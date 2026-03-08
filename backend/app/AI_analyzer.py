"""
PapaQuant - AI News vs Noise Analyzer
======================================
Full pipeline:
  1. Ingest tweets_stockprice.csv → ChromaDB vector database (TF-IDF dense embeddings)
  2. Receive a controversy paragraph (from extract_controversy.py)
  3. Embed it → vector search → retrieve top-5 similar historical tweets
  4. Run multi-model analysis:
       - FinBERT-style financial sentiment (lexicon + pattern scoring)
       - Sarcasm classifier (linguistic pattern detection)
       - Historical pattern detector (via vector similarity + price impact)
       - Source credibility scorer
  5. Fuse scores → final verdict: NEWS or NOISE + confidence + reasoning

Usage:
  # Build/rebuild the vector DB from CSV (one-time, ~30 seconds for 80k rows)
  python ai_analyzer.py --build

  # Analyze a controversy paragraph
  python ai_analyzer.py --analyze "Elon Musk tweeted that Tesla would go private at $420..."

  # Full pipeline: build + analyze
  python ai_analyzer.py --build --analyze "your paragraph here"

  # Pipe from extract_controversy.py
  python extract_controversy.py https://... | python ai_analyzer.py --analyze -
"""

import os, sys, csv, json, re, math, argparse, hashlib, pickle
from collections import defaultdict
from typing import Optional
from dotenv import load_dotenv

import chromadb
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG  — all paths are relative to this script's own directory so it works
#           on any machine. Put tweets_stockprice.csv next to this file.
# ─────────────────────────────────────────────────────────────────────────────
_HERE           = os.path.dirname(os.path.abspath(__file__))
CSV_PATH        = os.path.join(_HERE, "tweets_stockprice.csv")
CHROMA_PATH     = os.path.join(_HERE, "papaQuant_chroma")
VECTORIZER_PATH = os.path.join(_HERE, "papaQuant_vectorizer.pkl")
COLLECTION_NAME = "tweet_history"
EMBED_DIM       = 512      # TF-IDF max_features
TOP_K           = 5        # similar tweets to retrieve

CEO_MAP = {
    "AAPL":"Tim Cook","AMD":"Lisa Su","AMZN":"Andy Jassy","BA":"Dave Calhoun",
    "BX":"Steve Schwarzman","COST":"Craig Jelinek","CRM":"Marc Benioff",
    "DIS":"Bob Chapek","ENPH":"Badri Kothandaraman","F":"Jim Farley",
    "GOOG":"Sundar Pichai","INTC":"Pat Gelsinger","KO":"James Quincey",
    "META":"Mark Zuckerberg","MSFT":"Satya Nadella","NFLX":"Reed Hastings",
    "NIO":"William Li","NOC":"Kathy Warden","PG":"Jon Moeller",
    "PYPL":"Dan Schulman","TSLA":"Elon Musk","TSM":"C.C. Wei",
    "VZ":"Hans Vestberg","XPEV":"He Xiaopeng","ZS":"Jay Chaudhry",
}

SOURCE_CREDIBILITY = {
    "reuters":0.95,"bloomberg":0.95,"wsj":0.92,"ft":0.92,"sec":0.99,
    "apnews":0.90,"cnbc":0.85,"forbes":0.80,"techcrunch":0.78,
    "yahoo finance":0.75,"marketwatch":0.75,"seeking alpha":0.65,
    "twitter":0.40,"x.com":0.40,"reddit":0.35,"wsb":0.30,
    "4chan":0.10,"unknown":0.50,
}

# ─────────────────────────────────────────────────────────────────────────────
# EMBEDDING ENGINE  (TF-IDF → dense 512-d float vectors, no downloads needed)
# ─────────────────────────────────────────────────────────────────────────────
class TFIDFEmbedder:
    """
    Wraps sklearn TfidfVectorizer to produce fixed-dim dense embeddings.
    Fitted once on the full tweet corpus and saved to disk.
    """
    def __init__(self, dim: int = EMBED_DIM):
        self.dim = dim
        self.vec: Optional[TfidfVectorizer] = None

    def fit(self, texts: list[str]):
        self.vec = TfidfVectorizer(
            max_features=self.dim,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2,
            strip_accents="unicode",
            analyzer="word",
        )
        self.vec.fit(texts)

    def embed(self, texts: list[str]) -> list[list[float]]:
        assert self.vec is not None, "Call fit() first or load from disk."
        mat = self.vec.transform(texts).toarray()  # (n, dim)
        # L2-normalize each row so cosine ≈ dot product in Chroma
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)
        mat = mat / norms
        return mat.tolist()

    def save(self, path: str):
        with open(path, "wb") as f:
            pickle.dump(self.vec, f)
        print(f"  Vectorizer saved → {path}")

    def load(self, path: str):
        with open(path, "rb") as f:
            self.vec = pickle.load(f)
        print(f"  Vectorizer loaded ← {path}")


embedder = TFIDFEmbedder()

# ─────────────────────────────────────────────────────────────────────────────
# CSV LOADER
# ─────────────────────────────────────────────────────────────────────────────
def load_tweet_rows(csv_path: str) -> list[dict]:
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tweet = row["Tweet"].strip()
            ticker = row["Stock Name"].strip()
            if not tweet or not ticker:
                continue
            rows.append({
                "tweet":   tweet,
                "ticker":  ticker,
                "company": row["Company Name"].strip(),
                "date":    row["Date"].strip(),
                "open":    row["Open"].strip(),
                "close":   row["Close"].strip(),
                "high":    row["High"].strip(),
                "low":     row["Low"].strip(),
                "volume":  row["Volume"].strip(),
            })
    return rows


def compute_daily_moves(rows: list[dict]) -> dict:
    """
    Returns {ticker: {date: pct_move}} where pct_move = (close-open)/open*100.
    Used later to tag historical tweets with actual market impact.
    """
    moves: dict[str, dict[str, float]] = defaultdict(dict)
    for r in rows:
        try:
            o, c = float(r["open"]), float(r["close"])
            if o > 0:
                moves[r["ticker"]][r["date"]] = round((c - o) / o * 100, 3)
        except (ValueError, ZeroDivisionError):
            pass
    return moves


# ─────────────────────────────────────────────────────────────────────────────
# BUILD VECTOR DB
# ─────────────────────────────────────────────────────────────────────────────
def build_vector_db(csv_path: str):
    print("\nBuilding PapaQuant vector database...")
    print(f"   Source: {csv_path}")

    rows = load_tweet_rows(csv_path)
    moves = compute_daily_moves(rows)

    # Deduplicate tweets by content hash
    seen: set[str] = set()
    unique_rows: list[dict] = []
    for r in rows:
        h = hashlib.md5(r["tweet"].encode()).hexdigest()
        if h not in seen:
            seen.add(h)
            unique_rows.append({**r, "_hash": h})

    print(f"   {len(rows):,} rows → {len(unique_rows):,} unique tweets")

    # Fit vectorizer on all unique tweet texts
    print("   Fitting TF-IDF vectorizer...")
    all_texts = [r["tweet"] for r in unique_rows]
    embedder.fit(all_texts)
    embedder.save(VECTORIZER_PATH)

    # Init ChromaDB
    chroma = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        chroma.delete_collection(COLLECTION_NAME)
        print("   🗑️  Deleted existing collection")
    except Exception:
        pass

    collection = chroma.create_collection(
        COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # Batch-insert in chunks of 500 (ChromaDB limit)
    BATCH = 500
    total = len(unique_rows)
    inserted = 0

    print(f"   Inserting {total:,} documents in batches of {BATCH}...")
    for i in range(0, total, BATCH):
        batch = unique_rows[i : i + BATCH]
        texts    = [r["tweet"] for r in batch]
        ids      = [r["_hash"] for r in batch]
        embeds   = embedder.embed(texts)

        # Tag each doc with its actual market impact (pct move that day)
        metadatas = []
        for r in batch:
            move = moves.get(r["ticker"], {}).get(r["date"], None)
            metadatas.append({
                "ticker":      r["ticker"],
                "company":     r["company"],
                "date":        r["date"],
                "close":       r["close"],
                "market_move": str(round(move, 3)) if move is not None else "unknown",
                "is_news":     "1" if (move is not None and abs(move) >= 2.0) else "0",
            })

        collection.add(documents=texts, embeddings=embeds, ids=ids, metadatas=metadatas)
        inserted += len(batch)

        if inserted % 5000 == 0 or inserted == total:
            pct = inserted / total * 100
            print(f"   [{pct:5.1f}%] {inserted:,}/{total:,} inserted")

    print(f"\nVector DB built → {CHROMA_PATH}")
    print(f"   Collection: '{COLLECTION_NAME}'  |  {collection.count():,} documents\n")
    return collection


# ─────────────────────────────────────────────────────────────────────────────
# VECTOR SEARCH
# ─────────────────────────────────────────────────────────────────────────────
def load_collection():
    chroma = chromadb.PersistentClient(path=CHROMA_PATH)
    return chroma.get_collection(COLLECTION_NAME)


def vector_search(paragraph: str, k: int = TOP_K) -> list[dict]:
    """
    Embed the paragraph, search ChromaDB, return top-k similar historical tweets
    with their metadata (ticker, date, market_move, is_news).
    """
    embedder.load(VECTORIZER_PATH)
    collection = load_collection()

    query_embed = embedder.embed([paragraph])
    results = collection.query(
        query_embeddings=query_embed,
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )

    hits = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        similarity = round(1 - dist, 4)   # cosine: distance→similarity
        hits.append({
            "tweet":       doc,
            "ticker":      meta.get("ticker", "?"),
            "company":     meta.get("company", "?"),
            "date":        meta.get("date", "?"),
            "close":       meta.get("close", "?"),
            "market_move": meta.get("market_move", "unknown"),
            "is_news":     meta.get("is_news", "0") == "1",
            "similarity":  similarity,
        })
    return hits


# ─────────────────────────────────────────────────────────────────────────────
# MODEL 1 — FinBERT-style Financial Sentiment (lexicon + context)
# ─────────────────────────────────────────────────────────────────────────────
FINBERT_LEXICON = {
    # Strong bullish (+2)
    "surge":2,"soar":2,"skyrocket":2,"breakout":2,"rally":2,"blowout":2,
    "record high":2,"beat estimates":2,"explosive growth":2,"parabolic":2,
    "record revenue":2,"acquisition":2,"partnership":2,"fda approved":2,
    "raised guidance":2,"buyback":2,"dividend increase":2,"short squeeze":2,
    # Weak bullish (+1)
    "buy":1,"upgrade":1,"outperform":1,"growth":1,"profit":1,"beat":1,
    "positive":1,"strong":1,"bullish":1,"upside":1,"opportunity":1,
    "recovery":1,"rebound":1,"demand":1,"expansion":1,"undervalued":1,
    "earnings beat":1,"revenue growth":1,"market share":1,"innovative":1,
    # Weak bearish (-1)
    "sell":-1,"downgrade":-1,"underperform":-1,"decline":-1,"drop":-1,
    "miss":-1,"weak":-1,"negative":-1,"concern":-1,"risk":-1,"loss":-1,
    "slowdown":-1,"headwinds":-1,"pressure":-1,"lawsuit":-1,"investigation":-1,
    "layoff":-1,"cut guidance":-1,"overvalued":-1,"bearish":-1,"below expectations":-1,
    # Strong bearish (-2)
    "crash":-2,"collapse":-2,"bankrupt":-2,"fraud":-2,"scandal":-2,
    "catastrophic":-2,"implode":-2,"meltdown":-2,"margin call":-2,
    "sec investigation":-2,"class action":-2,"delisted":-2,"ponzi":-2,
    "criminal charges":-2,"massive loss":-2,"default":-2,"insolvency":-2,
}

def finbert_score(text: str) -> dict:
    t = text.lower()
    total, hits = 0, []
    for phrase, score in sorted(FINBERT_LEXICON.items(), key=lambda x: -len(x[0])):
        if phrase in t:
            total += score
            hits.append((phrase, score))

    n_bull = sum(1 for _, s in hits if s > 0)
    n_bear = sum(1 for _, s in hits if s < 0)

    if total >= 3:      label = "STRONGLY_BULLISH"
    elif total >= 1:    label = "BULLISH"
    elif total <= -3:   label = "STRONGLY_BEARISH"
    elif total <= -1:   label = "BEARISH"
    else:               label = "NEUTRAL"

    return {
        "score":      total,
        "label":      label,
        "bull_hits":  n_bull,
        "bear_hits":  n_bear,
        "top_signals": [p for p, _ in hits[:5]],
    }


# ─────────────────────────────────────────────────────────────────────────────
# MODEL 2 — Sarcasm Classifier (linguistic pattern detection)
# ─────────────────────────────────────────────────────────────────────────────
SARCASM_PATTERNS = [
    # Explicit markers
    (r'\b(lol|lmao|lmfao|rofl|haha|hehe|heh)\b',               0.7, "explicit laugh"),
    (r'\\b(ha){2,}\\b|\\b(he){2,}\\b',                                   0.5, "laugh pattern"),
    (r'\b(obviously|clearly|everyone knows|trust me bro)\b',    0.5, "false authority"),
    (r'\b(definitely|absolutely|totally) (not|never)\b',        0.6, "ironic denial"),
    (r'\b(wow|great|amazing|fantastic|brilliant)\b.*(!{2,})',   0.5, "hyperbolic praise"),
    (r'/s\b',                                                    0.95,"reddit /s tag"),
    (r'\b(galaxy brain|big brain|genius move)\b',               0.65,"sarcastic praise"),
    (r'\b(nothing|no way|never|impossible)\s+(could|can|will)\s+(go wrong|fail|hurt)\b', 0.70, "jinx pattern"),
    # WSB / meme language
    (r'\b(apes|diamond hands|tendies|yolo|moon|rocket|🚀{2,})\b', 0.60, "wsb meme language"),
    (r'\b(retard|autist|smooth brain|regard)\b',                0.55, "wsb slang"),
    (r'\b(to the moon|going to zero|stonks)\b',                 0.55, "meme phrase"),
    # Hedging / rumour signals
    (r'\b(allegedly|rumor|unconfirmed|i heard|someone told me|my friend)\b', 0.45, "unverified rumour"),
    (r'\b(they say|word is|sources say)\b',                     0.40, "vague sourcing"),
]

def sarcasm_score(text: str) -> dict:
    t = text.lower()
    total_prob = 0.0
    triggers = []
    for pattern, weight, label in SARCASM_PATTERNS:
        if re.search(pattern, t, re.IGNORECASE):
            total_prob = 1 - (1 - total_prob) * (1 - weight)   # prob union
            triggers.append(label)

    # Adjust for negation context ("I'm NOT joking")
    if re.search(r"\b(not|no)\s+(joking|kidding|trolling|sarcastic)\b", t):
        total_prob *= 0.6

    # All-caps words (shouting = possible emphasis or joke)
    caps_words = re.findall(r'\b[A-Z]{3,}\b', text)
    if len(caps_words) >= 3:
        total_prob = min(1.0, total_prob + 0.15)
        triggers.append("all-caps emphasis")

    is_sarcastic = total_prob >= 0.5
    return {
        "probability": round(total_prob, 3),
        "is_sarcastic": is_sarcastic,
        "triggers": triggers,
    }


# ─────────────────────────────────────────────────────────────────────────────
# MODEL 3 — Historical Pattern Detector (uses vector search results)
# ─────────────────────────────────────────────────────────────────────────────
def historical_pattern_score(similar_tweets: list[dict]) -> dict:
    """
    Analyzes the top-K similar historical tweets to determine:
    - Did similar past content move markets?
    - What % of similar tweets were eventually 'NEWS' (>2% move)?
    - Average magnitude of market impact
    """
    if not similar_tweets:
        return {"historical_news_rate": 0.5, "avg_move": 0.0, "pattern_verdict": "UNKNOWN", "evidence": []}

    news_count = sum(1 for t in similar_tweets if t["is_news"])
    moves = []
    for t in similar_tweets:
        try:
            moves.append(abs(float(t["market_move"])))
        except (ValueError, TypeError):
            pass

    news_rate = news_count / len(similar_tweets)
    avg_move = sum(moves) / len(moves) if moves else 0.0

    if news_rate >= 0.6 and avg_move >= 2.0:
        verdict = "LIKELY_NEWS"
    elif news_rate <= 0.3 and avg_move < 1.0:
        verdict = "LIKELY_NOISE"
    else:
        verdict = "MIXED"

    evidence = []
    for t in similar_tweets[:3]:
        move_str = f"{t['market_move']}%" if t["market_move"] != "unknown" else "?"
        evidence.append(f"[{t['ticker']} {t['date']} sim={t['similarity']:.2f} Δ{move_str}] {t['tweet'][:80]}...")

    return {
        "historical_news_rate": round(news_rate, 3),
        "avg_move":             round(avg_move, 3),
        "pattern_verdict":      verdict,
        "evidence":             evidence,
        "n_similar":            len(similar_tweets),
    }


# ─────────────────────────────────────────────────────────────────────────────
# MODEL 4 — Source Credibility
# ─────────────────────────────────────────────────────────────────────────────
def source_credibility_score(source: str) -> dict:
    s = source.lower()
    for key, score in SOURCE_CREDIBILITY.items():
        if key in s:
            return {"source": source, "credibility": score, "tier": _tier(score)}
    return {"source": source, "credibility": 0.50, "tier": "UNKNOWN"}

def _tier(score: float) -> str:
    if score >= 0.90: return "TIER1_WIRE"
    if score >= 0.75: return "TIER2_FINANCIAL"
    if score >= 0.60: return "TIER3_MEDIA"
    if score >= 0.40: return "TIER4_SOCIAL"
    return "TIER5_UNVERIFIED"


# ─────────────────────────────────────────────────────────────────────────────
# SCORE FUSION — combine all 4 models into final verdict
# ─────────────────────────────────────────────────────────────────────────────
def fuse_scores(finbert: dict, sarcasm: dict, history: dict, credibility: dict) -> dict:
    """
    Weighted fusion:
      FinBERT sentiment strength → 25%
      Sarcasm (inverse)         → 20%
      Historical pattern        → 35%   (strongest signal)
      Source credibility        → 20%
    """
    # FinBERT: convert label to 0-1 news likelihood
    finbert_map = {
        "STRONGLY_BULLISH": 0.80, "BULLISH": 0.65,
        "NEUTRAL": 0.50,
        "BEARISH": 0.65, "STRONGLY_BEARISH": 0.80,   # strong bear = also news
    }
    finbert_news_prob = finbert_map.get(finbert["label"], 0.5)

    # Sarcasm: high sarcasm → noise
    sarcasm_news_prob = 1.0 - sarcasm["probability"]

    # Historical
    history_news_prob = history["historical_news_rate"]

    # Credibility
    cred_news_prob = credibility["credibility"]

    # Weighted sum
    weights = [0.25, 0.20, 0.35, 0.20]
    probs   = [finbert_news_prob, sarcasm_news_prob, history_news_prob, cred_news_prob]
    news_probability = sum(w * p for w, p in zip(weights, probs))

    # Final verdict
    if news_probability >= 0.65:
        verdict     = "NEWS"
        confidence  = news_probability
    elif news_probability <= 0.40:
        verdict     = "NOISE"
        confidence  = 1 - news_probability
    else:
        verdict     = "MIXED"
        confidence  = 0.5

    # Direction: binary UP or DOWN based on fused news_probability + FinBERT sentiment.
    # Positive sentiment or high news probability with bullish signal -> UP
    # Negative sentiment or high news probability with bearish signal -> DOWN
    # Neutral with no strong signal defaults to DOWN (conservative/risk-aware)
    bull_labels = ("STRONGLY_BULLISH", "BULLISH")
    bear_labels = ("STRONGLY_BEARISH", "BEARISH")
    if finbert["label"] in bull_labels:
        direction = "UP"
    elif finbert["label"] in bear_labels:
        direction = "DOWN"
    elif news_probability >= 0.55 and finbert["score"] >= 0:
        direction = "UP"
    else:
        direction = "DOWN"

    return {
        "verdict":          verdict,
        "direction":        direction,
        "confidence":       round(confidence, 3),
        "news_probability": round(news_probability, 3),
        "model_probs": {
            "finbert":     round(finbert_news_prob, 3),
            "anti_sarcasm":round(sarcasm_news_prob, 3),
            "historical":  round(history_news_prob, 3),
            "credibility": round(cred_news_prob, 3),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ANALYZER — public API
# ─────────────────────────────────────────────────────────────────────────────
def analyze(paragraph: str, source: str = "unknown", ticker_hint: str = "") -> dict:
    """
    Full News vs Noise analysis on a controversy paragraph.

    Args:
        paragraph:   Text from extract_controversy.py
        source:      Source URL or name (e.g. "twitter", "reuters.com")
        ticker_hint: Optional ticker context (e.g. "TSLA")

    Returns:
        Full analysis dict ready for game engine consumption.
    """
    print("\n" + "-"*60)
    print("PapaQuant AI News vs Noise Analyzer")
    print("-"*60)
    print(f"\nParagraph ({len(paragraph.split())} words):")
    print(f'   "{paragraph[:200]}{"..." if len(paragraph)>200 else ""}"\n')

    # Step 1 — Vector search for similar historical tweets
    print(f"Searching vector DB for top-{TOP_K} similar historical tweets...")
    try:
        similar = vector_search(paragraph, k=TOP_K)
        print(f"   Found {len(similar)} matches")
        for i, s in enumerate(similar, 1):
            print(f"   {i}. [{s['ticker']} {s['date']}] sim={s['similarity']:.3f} "
                  f"Δ{s['market_move']}% | {s['tweet'][:70]}...")
    except Exception as e:
        print(f"   Vector search failed: {e}")
        print("      → Run with --build first to create the vector DB")
        similar = []

    # Step 2 — FinBERT-style sentiment
    print("\nModel 1: FinBERT Financial Sentiment")
    fb = finbert_score(paragraph)
    print(f"   Label: {fb['label']}  |  Score: {fb['score']:+d}  "
          f"|  Signals: {', '.join(fb['top_signals'][:3]) or 'none'}")

    # Step 3 — Sarcasm classifier
    print("\nModel 2: Sarcasm Classifier")
    sc = sarcasm_score(paragraph)
    print(f"   Sarcasm probability: {sc['probability']:.1%}  "
          f"|  Is sarcastic: {sc['is_sarcastic']}")
    if sc["triggers"]:
        print(f"   Triggers: {', '.join(sc['triggers'])}")

    # Step 4 — Historical pattern
    print("\nModel 3: Historical Pattern Detection")
    hp = historical_pattern_score(similar)
    print(f"   Similar tweets that moved market: {hp['historical_news_rate']:.0%}  "
          f"|  Avg move: {hp['avg_move']:.2f}%  |  Verdict: {hp['pattern_verdict']}")

    # Step 5 — Source credibility
    print("\nModel 4: Source Credibility")
    cred = source_credibility_score(source)
    print(f"   Source: '{source}'  |  Credibility: {cred['credibility']:.0%}  "
          f"|  Tier: {cred['tier']}")

    # Step 6 — Score fusion
    print("\nFusing model scores...")
    fusion = fuse_scores(fb, sc, hp, cred)

    # Step 7 — Build final result
    result = {
        "verdict":              fusion["verdict"],
        "direction":            fusion["direction"],
        "confidence":           fusion["confidence"],
        "news_probability":     fusion["news_probability"],
        "sentiment_label":      fb["label"],
        "is_sarcastic":         sc["is_sarcastic"],
        "sarcasm_probability":  sc["probability"],
        "historical_news_rate": hp["historical_news_rate"],
        "avg_historical_move":  hp["avg_move"],
        "source_credibility":   cred["credibility"],
        "source_tier":          cred["tier"],
        "historical_pattern_verdict": hp["pattern_verdict"],
        "model_weights": {
            "finbert_contribution":    f"{fusion['model_probs']['finbert']:.0%}",
            "sarcasm_contribution":    f"{fusion['model_probs']['anti_sarcasm']:.0%}",
            "historical_contribution": f"{fusion['model_probs']['historical']:.0%}",
            "credibility_contribution":f"{fusion['model_probs']['credibility']:.0%}",
        },
        "similar_tweets":       similar[:TOP_K],
        "historical_evidence":  hp["evidence"],
        "ticker_context":       ticker_hint or (similar[0]["ticker"] if similar else "UNKNOWN"),
        "paragraph":            paragraph,
        "source":               source,
    }

    return result


# ─────────────────────────────────────────────────────────────────────────────
# CSV OUTPUT
# ─────────────────────────────────────────────────────────────────────────────
def save_to_csv(result: dict, csv_path: str):
    """
    Appends one analysis result row to the output CSV.
    Creates the file with headers if it does not exist yet.
    Columns: Company, Current Stock Price, CEO, Sentiment Analysis, Direction, Day30 Return
    """
    fieldnames = [
        "Company",
        "Current Stock Price",
        "CEO",
        "Sentiment Analysis",
        "Direction",
        "Day30 Return",
    ]

    # ── Derive display values ──────────────────────────────────────────────
    ticker   = result.get("ticker_context", "UNKNOWN")
    company  = CEO_MAP_COMPANY.get(ticker, ticker)
    ceo      = CEO_MAP.get(ticker, "Unknown")

    # Current stock price: pull latest close from the CSV for this ticker
    stock_price = _get_latest_price(ticker)

    # Sentiment Analysis: human-readable paragraph summarising all model outputs
    verdict   = result["verdict"]
    direction = result["direction"]
    sarcastic = result["is_sarcastic"]
    hist_rate = result["historical_news_rate"]
    avg_move  = result["avg_historical_move"]
    finbert   = result["sentiment_label"]
    confidence= result["confidence"]

    joke_str = (
        "flagged as a joke/meme by sarcasm classifier"
        if sarcastic else
        "not flagged as sarcastic"
    )
    hist_str = (
        f"{hist_rate:.0%} of historically similar incidents caused a market move "
        f"(avg {avg_move:.1f}% price change)"
    )
    sentiment_analysis = (
        f"Verdict: {verdict} | FinBERT: {finbert} | {joke_str}. "
        f"Historical pattern: {hist_str}. "
        f"Direction signal: {direction} with {confidence:.0%} confidence."
    )

    # Day30 Return: computed from CSV price data for this ticker
    day30 = _get_day30_return(ticker)

    row = {
        "Company":             company,
        "Current Stock Price": stock_price,
        "CEO":                 ceo,
        "Sentiment Analysis":  sentiment_analysis,
        "Direction":           direction,
        "Day30 Return":        day30,
    }

    file_exists = os.path.isfile(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

    print(f"\nResult saved → {csv_path}")
    print(f"   Company: {company}  |  Price: {stock_price}  |  CEO: {ceo}")
    print(f"   Verdict: {verdict}  |  Direction: {direction}  |  30d Return: {day30}")


# ─────────────────────────────────────────────────────────────────────────────
# PRICE HELPERS  — read latest close + 30-day return from the source CSV
# ─────────────────────────────────────────────────────────────────────────────
CEO_MAP_COMPANY = {
    "AAPL":"Apple Inc.","AMD":"Advanced Micro Devices","AMZN":"Amazon.com Inc.",
    "BA":"The Boeing Company","BX":"Blackstone Inc.","COST":"Costco Wholesale",
    "CRM":"Salesforce Inc.","DIS":"The Walt Disney Company","ENPH":"Enphase Energy",
    "F":"Ford Motor Company","GOOG":"Alphabet Inc.","INTC":"Intel Corporation",
    "KO":"The Coca-Cola Company","META":"Meta Platforms Inc.","MSFT":"Microsoft Corporation",
    "NFLX":"Netflix Inc.","NIO":"NIO Inc.","NOC":"Northrop Grumman","PG":"Procter & Gamble",
    "PYPL":"PayPal Holdings","TSLA":"Tesla Inc.","TSM":"Taiwan Semiconductor",
    "VZ":"Verizon Communications","XPEV":"XPeng Inc.","ZS":"Zscaler Inc.",
}

_price_cache: dict = {}   # ticker → {dates sorted, prices dict}

def _load_prices(ticker: str) -> dict:
    """Load and cache all close prices for a ticker from the source CSV."""
    if ticker in _price_cache:
        return _price_cache[ticker]
    prices = {}
    try:
        with open(CSV_PATH, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row["Stock Name"].strip() == ticker:
                    date = row["Date"].strip()
                    close = row["Close"].strip()
                    if date and close:
                        try:
                            prices[date] = float(close)
                        except ValueError:
                            pass
    except FileNotFoundError:
        pass
    _price_cache[ticker] = prices
    return prices

def _get_latest_price(ticker: str) -> str:
    prices = _load_prices(ticker)
    if not prices:
        return "N/A"
    last_date = max(prices.keys())
    return f"${prices[last_date]:.2f} ({last_date})"

def _get_day30_return(ticker: str) -> str:
    prices = _load_prices(ticker)
    if not prices:
        return "N/A"
    sorted_dates = sorted(prices.keys())
    if len(sorted_dates) < 2:
        return "N/A"
    start = sorted_dates[0]
    candidates = [d for d in sorted_dates if d > start]
    if not candidates:
        return "N/A"
    end = candidates[min(29, len(candidates) - 1)]
    s, e = prices[start], prices[end]
    if s == 0:
        return "N/A"
    pct = (e - s) / s * 100
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.1f}% ({start} to {end})"


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="PapaQuant AI News vs Noise Analyzer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Build vector DB (required once before analyzing)
  python AI_analyzer.py --build

  # Analyze a paragraph and save to CSV
  python AI_analyzer.py --analyze "Elon Musk said Tesla will go private at $420..."

  # With source and ticker context
  python AI_analyzer.py --analyze "..." --source twitter --ticker TSLA

  # Custom output CSV path
  python AI_analyzer.py --analyze "..." --output my_results.csv

  # Build + analyze in one step
  python AI_analyzer.py --build --analyze "your paragraph"

  # Pipe from extract_controversy.py
  python extract_controversy.py https://... | python AI_analyzer.py --analyze -
        """,
    )
    parser.add_argument("--build",   action="store_true", help="Build/rebuild vector DB from CSV")
    parser.add_argument("--analyze", metavar="TEXT",      help="Paragraph to analyze (use '-' to read from stdin)")
    parser.add_argument("--source",  default="unknown",   help="Source name or URL (e.g. twitter, reuters.com)")
    parser.add_argument("--ticker",  default="",          help="Ticker hint (e.g. TSLA)")
    parser.add_argument("--output",  metavar="FILE",
                        default=os.path.join(_HERE, "analysis_results.csv"),
                        help="Output CSV file path (default: analysis_results.csv next to this script)")
    args = parser.parse_args()

    if not args.build and not args.analyze:
        parser.print_help()
        sys.exit(0)

    if args.build:
        build_vector_db(CSV_PATH)

    if args.analyze:
        paragraph = sys.stdin.read().strip() if args.analyze == "-" else args.analyze
        result = analyze(paragraph, source=args.source, ticker_hint=args.ticker)
        save_to_csv(result, args.output)


if __name__ == "__main__":
    main()