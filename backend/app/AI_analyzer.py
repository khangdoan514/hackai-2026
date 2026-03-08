"""
PapaQuant - AI News vs Noise Sentiment Analyzer
================================================
Step 2 of 3 in the PapaQuant pipeline.

Consumes JSON from extract_controversy.py and runs:
  1. FinBERT-proxy  : VADER + financial lexicon (domain-calibrated sentiment)
  2. Sarcasm        : Lexicon + punctuation + contrastive-phrase heuristics
  3. Historical     : Keyword → scandal archetype → predicted Day30 return

Writes analysis_results.csv with columns model.py expects:
  company, current_stock_price, ceo, sentiment, 30d_return, direction

Usage:
  python AI_analyzer.py output.json
  python AI_analyzer.py output.json --out analysis_results.csv
  python AI_analyzer.py --inline
"""

import os, sys, re, json, csv, argparse
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# ─────────────────────────────────────────────────────────────────
# 1.  FINBERT-PROXY  (VADER + financial lexicon)
# ─────────────────────────────────────────────────────────────────

FINANCIAL_NEG = {
    "resign": -0.5,  "fired": -0.6,     "ousted": -0.55,  "terminated": -0.5,
    "scandal": -0.65,"lawsuit": -0.45,  "investigation": -0.45,
    "fraud": -0.8,   "misconduct": -0.6,"racial slur": -0.9,
    "n-word": -0.95, "racist": -0.8,    "boycott": -0.7,
    "backlash": -0.6,"controversy": -0.5,"sever ties": -0.65,
    "distance itself": -0.4,"tarnish": -0.5,"downgrade": -0.55,
    "miss": -0.4,    "loss": -0.45,     "decline": -0.4,
    "plunge": -0.7,  "crash": -0.8,     "default": -0.75,
    "bankruptcy": -0.85,"recall": -0.6, "fine": -0.4,"penalty": -0.45,
}

FINANCIAL_POS = {
    "upgrade": 0.5,  "beat": 0.45,  "record": 0.4,   "rally": 0.55,
    "surge": 0.6,    "buyback": 0.45,"dividend": 0.3, "profit": 0.4,
    "growth": 0.35,  "partnership": 0.3,"deal": 0.25,
}

vader = SentimentIntensityAnalyzer()

def finbert_proxy(text):
    compound = vader.polarity_scores(text)["compound"]
    lower    = text.lower()
    boost, signals = 0.0, []
    for phrase, val in FINANCIAL_NEG.items():
        if phrase in lower:
            boost += val; signals.append(phrase)
    for phrase, val in FINANCIAL_POS.items():
        if phrase in lower:
            boost += val; signals.append(phrase)
    blended = 0.4 * compound + 0.6 * max(-1.0, min(1.0, boost))
    if blended <= -0.25:  label, impact = "negative", "bearish"
    elif blended >= 0.25: label, impact = "positive", "bullish"
    else:                 label, impact = "neutral",  "neutral"
    return {
        "label":         label,
        "score":         round(min(1.0, abs(blended) + 0.3), 3),
        "market_impact": impact,
        "key_signals":   signals[:3],
        "raw_compound":  round(blended, 4),
    }

# ─────────────────────────────────────────────────────────────────
# 2.  SARCASM CLASSIFIER
# ─────────────────────────────────────────────────────────────────

SARCASM_RE   = [r"\bwhat could go wrong\b", r"\bgreat idea\b",
                r"\bperfect timing\b",       r"\bbrilliant\b",
                r"\bnot like\b",             r"\bof course\b",
                r"\bobviously\b",            r"\bneedless to say\b"]
CONTRASTIVE  = ["despite","however","but","although","even though",
                "yet","nonetheless","ironically","notwithstanding"]
ALARMIST     = ["catastrophic","devastating","meltdown","collapse",
                "obliterate","explosive","apocalypse","skyrocket"]
DISMISSIVE   = ["merely","only","just a","nothing to see","overblown",
                "overreact","much ado","exaggerated"]

def sarcasm_classifier(text):
    lower = text.lower()
    irony = min(0.2, text.count("!")*0.05 + text.count("?")*0.04
                + len(re.findall(r'\b[A-Z]{3,}\b', text))*0.03)
    for pat in SARCASM_RE:
        if re.search(pat, lower): irony += 0.15
    contrast = sum(1 for w in CONTRASTIVE if w in lower)
    irony = round(min(1.0, irony + min(0.2, contrast*0.06)), 3)
    is_sarc  = irony >= 0.35
    alarmist = any(w in lower for w in ALARMIST)
    dismissiv= any(w in lower for w in DISMISSIVE)
    if alarmist:        framing = "alarmist"
    elif dismissiv:     framing = "dismissive"
    elif is_sarc:       framing = "misleading"
    elif contrast >= 2: framing = "neutral"
    else:               framing = "straightforward"
    base     = finbert_proxy(text)["label"]
    adjusted = ("positive" if base=="negative" else "negative") if (is_sarc and base!="neutral") else base
    return {"is_sarcastic": is_sarc, "irony_score": irony,
            "framing": framing, "adjusted_sentiment": adjusted}

# ─────────────────────────────────────────────────────────────────
# 3.  HISTORICAL PATTERN DETECTION
# ─────────────────────────────────────────────────────────────────

PATTERNS = [
    {"type":"CEO_RACIAL_SCANDAL",
     "keywords":["racial","n-word","racist","slur","discrimination"],
     "analogues":[
         {"event":"Papa John's Schnatter N-word (2018)","ticker":"PZZA","day30":-18.0},
         {"event":"CrossFit CEO racist tweet (2020)",   "ticker":"PRIVATE","day30":-22.0},
         {"event":"Uber CEO Kalanick resignation (2017)","ticker":"UBER","day30":-12.0}],
     "day30":-17.5,"direction":"DOWN","confidence":0.82},
    {"type":"CEO_MISCONDUCT_RESIGNATION",
     "keywords":["resign","fired","ousted","step down","removed","chairman"],
     "analogues":[
         {"event":"McDonald's CEO Easterbrook fired (2019)","ticker":"MCD","day30":-3.5},
         {"event":"Intel CEO Krzanich resigned (2018)",      "ticker":"INTC","day30":-8.1},
         {"event":"CBS CEO Moonves ousted (2018)",           "ticker":"CBS","day30":-7.2}],
     "day30":-6.3,"direction":"DOWN","confidence":0.70},
    {"type":"BRAND_BOYCOTT",
     "keywords":["boycott","sever ties","backlash","brand damage","protest","marketing agency"],
     "analogues":[
         {"event":"Bud Light Mulvaney boycott (2023)","ticker":"BUD","day30":-14.0},
         {"event":"Gillette backlash (2019)",          "ticker":"PG","day30":-2.5},
         {"event":"Papa John's NFL controversy (2017)","ticker":"PZZA","day30":-11.0}],
     "day30":-9.2,"direction":"DOWN","confidence":0.68},
    {"type":"EARNINGS_MISS",
     "keywords":["miss","below expectations","disappoint","shortfall","warn"],
     "analogues":[
         {"event":"Meta Q4 2022 earnings miss",         "ticker":"META","day30":-26.0},
         {"event":"Netflix subscriber loss Q1 2022",    "ticker":"NFLX","day30":-35.0}],
     "day30":-12.0,"direction":"DOWN","confidence":0.72},
    {"type":"REGULATORY_ACTION",
     "keywords":["investigation","fine","penalty","sec","ftc","doj","lawsuit","regulatory"],
     "analogues":[
         {"event":"Facebook FTC $5B fine (2019)","ticker":"META","day30":+4.0},
         {"event":"Goldman DOJ settlement (2020)","ticker":"GS","day30":-5.0}],
     "day30":-4.5,"direction":"DOWN","confidence":0.58},
    {"type":"FRAUD_ACCOUNTING",
     "keywords":["fraud","accounting","restate","ponzi","embezzle"],
     "analogues":[
         {"event":"Enron fraud (2001)","ticker":"ENE","day30":-60.0},
         {"event":"Wirecard fraud (2020)","ticker":"WDI","day30":-98.0}],
     "day30":-35.0,"direction":"DOWN","confidence":0.88},
    {"type":"POSITIVE_CATALYST",
     "keywords":["upgrade","beat","record revenue","acquisition","partnership","deal"],
     "analogues":[
         {"event":"Apple Q4 2023 earnings beat","ticker":"AAPL","day30":+8.0},
         {"event":"NVIDIA blowout Q2 2023",     "ticker":"NVDA","day30":+28.0}],
     "day30":+9.0,"direction":"UP","confidence":0.65},
]

def historical_pattern(text, reason=""):
    combined = (text + " " + reason).lower()
    best, best_hits = None, 0
    for p in PATTERNS:
        hits = sum(1 for kw in p["keywords"] if kw in combined)
        if hits > best_hits:
            best_hits, best = hits, p
    if not best or best_hits == 0:
        return {"pattern_type":"UNKNOWN","analogues":[],
                "predicted_30d_return":"0.0%","direction":"SIDEWAYS",
                "confidence":0.3,"reasoning":"No strong historical pattern matched."}
    conf = round(min(0.95, best["confidence"] + best_hits*0.04), 3)
    return {
        "pattern_type":         best["type"],
        "analogues":            best["analogues"][:2],
        "predicted_30d_return": f"{best['day30']:+.1f}%",
        "direction":            best["direction"],
        "confidence":           conf,
        "reasoning": (f"Matched {best_hits} keyword(s) → '{best['type']}'. "
                      f"Median Day30: {best['day30']:+.1f}%."),
    }

# ─────────────────────────────────────────────────────────────────
# 4.  COMPANY / CEO LOOKUP
# ─────────────────────────────────────────────────────────────────

KNOWN_CEOS = {
    "PZZA":"Todd Penegor","MCD":"Chris Kempczinski","AAPL":"Tim Cook",
    "TSLA":"Elon Musk","META":"Mark Zuckerberg","NVDA":"Jensen Huang",
    "AMZN":"Andy Jassy","GOOGL":"Sundar Pichai","MSFT":"Satya Nadella",
    "NFLX":"Greg Peters","UBER":"Dara Khosrowshahi","GS":"David Solomon",
    "BUD":"Michel Doukeris","PG":"Jon Moeller","INTC":"Pat Gelsinger",
}

def get_company_info(ticker):
    try:
        t    = yf.Ticker(ticker)
        info = t.info
        name = info.get("longName") or info.get("shortName") or ticker
        hist  = t.history(period="2d")
        price = f"${hist['Close'].iloc[-1]:.2f}" if not hist.empty else "N/A"
        officers = info.get("companyOfficers") or []
        ceo = next((o.get("name","") for o in officers
                    if "ceo" in o.get("title","").lower()), "")
        ceo = ceo or KNOWN_CEOS.get(ticker.upper(), "N/A")
        return {"company": name, "ticker": ticker.upper(), "price": price, "ceo": ceo}
    except Exception:
        return {"company": ticker, "ticker": ticker.upper(),
                "price": "N/A", "ceo": KNOWN_CEOS.get(ticker.upper(), "N/A")}

# ─────────────────────────────────────────────────────────────────
# 5.  PRINT DEBUG REPORT
# ─────────────────────────────────────────────────────────────────

def print_debug(rec):
    excerpt = rec.get("controversial_excerpt","")
    reason  = rec.get("reason","")
    fb = finbert_proxy(excerpt)
    sc = sarcasm_classifier(excerpt)
    hp = historical_pattern(excerpt, reason)

    print("\n" + "="*62)
    print("  PAPAQUANT — NEWS vs NOISE SENTIMENT REPORT")
    print("="*62)
    print(f"\nArticle  : {rec.get('article','(inline)')}")
    print(f"Excerpt  : {excerpt[:110]}...\n")
    print("-- FinBERT-Proxy ----------------------------------------")
    print(f"  Label          : {fb['label'].upper()}  ({fb['score']:.0%} confidence)")
    print(f"  Market Impact  : {fb['market_impact'].upper()}")
    print(f"  Key Signals    : {', '.join(fb['key_signals']) or 'none'}")
    print(f"  Raw Compound   : {fb['raw_compound']}")
    print("\n-- Sarcasm Classifier -----------------------------------")
    print(f"  Sarcastic?     : {'YES' if sc['is_sarcastic'] else 'No'}")
    print(f"  Irony Score    : {sc['irony_score']:.3f}")
    print(f"  Framing        : {sc['framing'].upper()}")
    print(f"  Adj Sentiment  : {sc['adjusted_sentiment'].upper()}")
    print("\n-- Historical Pattern Detection -------------------------")
    print(f"  Pattern Type   : {hp['pattern_type']}")
    print(f"  Predicted D30  : {hp['predicted_30d_return']}")
    print(f"  Direction      : {hp['direction']}")
    print(f"  Confidence     : {hp['confidence']:.0%}")
    print(f"  Reasoning      : {hp['reasoning']}")
    for a in hp["analogues"]:
        print(f"    - {a['event']}  [{a['ticker']}]  {a['day30']:+.1f}%")
    print()

# ─────────────────────────────────────────────────────────────────
# 6.  ANALYZE  →  CSV ROW
#     Column names match exactly what model.py expects:
#     company, current_stock_price, ceo, sentiment, 30d_return, direction
# ─────────────────────────────────────────────────────────────────

# CSV columns in exact order model.py expects
FIELDS = ["company","current_stock_price","ceo","sentiment","30d_return","direction"]

def analyze(rec) -> list[dict]:
    excerpt = rec.get("controversial_excerpt","")
    reason  = rec.get("reason","")
    tickers = rec.get("ticker_tags", [])

    fb = finbert_proxy(excerpt)
    sc = sarcasm_classifier(excerpt)
    hp = historical_pattern(excerpt, reason)

    # Compact sentiment string: label + confidence + irony flag + pattern
    sentiment_str = (
        f"{sc['adjusted_sentiment'].upper()}/{fb['market_impact'].upper()} "
        f"conf={fb['score']:.0%} irony={sc['irony_score']:.2f} "
        f"pat={hp['pattern_type']}"
    )

    # Strip % and convert to float for model.py numeric feature
    day30_raw = hp["predicted_30d_return"]          # e.g. "-17.5%"
    day30_float = float(day30_raw.replace("%",""))  # -17.5

    direction = hp["direction"]   # "UP" / "DOWN" / "SIDEWAYS"
    # Map to model.py label space: growth / reduction
    dir_label = "reduction" if direction == "DOWN" else "growth"

    rows = []
    for ticker in (tickers or ["UNKNOWN"]):
        info = ({"company":"Unknown","price":"N/A","ceo":"N/A"}
                if ticker == "UNKNOWN" else get_company_info(ticker))
        rows.append({
            "company":             info["company"],
            "current_stock_price": info["price"],
            "ceo":                 info["ceo"],
            "sentiment":           sentiment_str,
            "30d_return":          day30_float,
            "direction":           dir_label,
        })
    return rows

# ─────────────────────────────────────────────────────────────────
# 7.  INLINE EXAMPLE
# ─────────────────────────────────────────────────────────────────

INLINE_EXAMPLE = {
    "article": "article1.txt",
    "controversial_excerpt": (
        "John Schnatter, founder and former CEO of Papa John's, used the N-word during a May "
        "conference call intended as a media training exercise to help him avoid future PR disasters. "
        "Schnatter's remarks, which included a racially charged reference to Colonel Sanders and a "
        "disturbing anecdote about racial violence in Indiana, sparked immediate backlash. Despite his "
        "apology, the incident led to Schnatter's resignation as chairman of Papa John's. This "
        "controversy follows Schnatter's previous public relations crisis in 2017 when he blamed NFL "
        "national anthem protests for declining sales, causing an 11% drop in Papa John's stock and a "
        "significant hit to his personal wealth. The recent incident not only tarnishes Schnatter's "
        "reputation but also jeopardizes Papa John's brand image, prompting the marketing agency "
        "Laundry Service to sever ties with the company."
    ),
    "ticker_tags": ["PZZA"],
    "controversy_score": 0.95,
    "reason": (
        "The use of a racial slur by a high-profile CEO during a media training call, leading to his "
        "resignation and significant brand damage, is highly provocative and market-moving."
    ),
}

# ─────────────────────────────────────────────────────────────────
# 8.  MAIN
# ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="PapaQuant AI Analyzer — Step 2 of 3",
        epilog=("Examples:\n"
                "  python AI_analyzer.py output.json\n"
                "  python AI_analyzer.py output.json --out analysis_results.csv\n"
                "  python AI_analyzer.py --inline\n\n"
                "Next step:  python model.py"),
    )
    parser.add_argument("input",      nargs="?", help="JSON from extract_controversy.py")
    parser.add_argument("--inline",   action="store_true", help="Run Papa John's built-in example")
    parser.add_argument("--out",      default="analysis_results.csv",
                        help="Output CSV (default: analysis_results.csv)")
    parser.add_argument("--no-debug", action="store_true", help="Skip detailed report")
    args = parser.parse_args()

    if args.inline:
        records = [INLINE_EXAMPLE]
    elif args.input:
        if not os.path.exists(args.input):
            sys.exit(
                f"\nERROR: '{args.input}' not found.\n\n"
                "  Step 1 — generate it first:\n"
                f"    python extract_controversy.py article.txt --json {args.input}\n\n"
                "  Or run the full pipeline at once:\n"
                "    python pipeline.py article.txt\n"
            )
        with open(args.input,"r",encoding="utf-8") as f:
            raw = json.load(f)
        records = raw if isinstance(raw, list) else [raw]
    else:
        parser.print_help(); sys.exit(1)

    all_rows = []
    for rec in records:
        if not args.no_debug:
            print_debug(rec)
        all_rows.extend(analyze(rec))

    with open(args.out,"w",newline="",encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(all_rows)

    print(f"CSV saved -> {args.out}  ({len(all_rows)} row(s))")
    print("\n" + ",".join(FIELDS))
    for row in all_rows:
        print(",".join(str(row[k]) for k in FIELDS))
    print(f"\nNext step:  python model.py --data {args.out}")

if __name__ == "__main__":
    main()