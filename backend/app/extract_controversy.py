"""
PapaQuant - Article Controversy Extractor
Fetches an article from a URL and uses GPT-4.1-mini to extract
the most controversial paragraph for the News vs Noise game engine.

Fetch strategy (tried in order):
  1. Direct request with rotating User-Agent headers
  2. Google AMP cache  (works for many news sites)
  3. archive.org Wayback Machine latest snapshot
  4. newspaper3k  (robust article extractor, handles many paywalls)
"""

import os
import sys
import time
import random
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from dotenv import load_dotenv

# Load .env file
load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError("OPENAI_API_KEY not found in environment. Check your .env file.")

client = OpenAI(api_key=OPENAI_API_KEY)

# ---------------------------------------------------------------------------
# Rotating User-Agent pool — avoids simple bot-detection fingerprinting
# ---------------------------------------------------------------------------
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
]

def _random_headers() -> dict:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
    }


def _parse_html_to_text(html: str) -> str:
    """Strip boilerplate from raw HTML and return clean paragraph text."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "figure", "iframe"]):
        tag.decompose()
    body = (
        soup.find("article")
        or soup.find("main")
        or soup.find("div", class_=lambda c: c and "article" in c.lower())
        or soup.find("div", class_=lambda c: c and "story" in c.lower())
        or soup.find("div", class_=lambda c: c and "content" in c.lower())
        or soup.body
    )
    paragraphs = body.find_all("p") if body else soup.find_all("p")
    return "\n".join(p.get_text(strip=True) for p in paragraphs if len(p.get_text(strip=True)) > 40)


# ---------------------------------------------------------------------------
# Strategy 1 — Direct request
# ---------------------------------------------------------------------------
def _fetch_direct(url: str) -> str:
    resp = requests.get(url, headers=_random_headers(), timeout=15, allow_redirects=True)
    resp.raise_for_status()
    return _parse_html_to_text(resp.text)


# ---------------------------------------------------------------------------
# Strategy 2 — Google AMP cache
# Converts   https://www.forbes.com/sites/...
# →          https://www-forbes-com.cdn.ampproject.org/v/s/www.forbes.com/sites/...
# ---------------------------------------------------------------------------
def _fetch_google_amp(url: str) -> str:
    from urllib.parse import urlparse
    parsed = urlparse(url)
    domain_dashed = parsed.netloc.replace(".", "-")
    amp_url = f"https://{domain_dashed}.cdn.ampproject.org/v/s/{parsed.netloc}{parsed.path}"
    resp = requests.get(amp_url, headers=_random_headers(), timeout=15)
    resp.raise_for_status()
    return _parse_html_to_text(resp.text)


# ---------------------------------------------------------------------------
# Strategy 3 — Wayback Machine (archive.org) latest snapshot
# ---------------------------------------------------------------------------
def _fetch_wayback(url: str) -> str:
    api = f"https://archive.org/wayback/available?url={url}"
    meta = requests.get(api, timeout=10).json()
    snapshot_url = meta.get("archived_snapshots", {}).get("closest", {}).get("url")
    if not snapshot_url:
        raise ValueError("No Wayback snapshot found.")
    resp = requests.get(snapshot_url, headers=_random_headers(), timeout=20)
    resp.raise_for_status()
    return _parse_html_to_text(resp.text)


# ---------------------------------------------------------------------------
# Strategy 4 — newspaper3k (most robust; handles many paywalled sites)
# ---------------------------------------------------------------------------
def _fetch_newspaper(url: str) -> str:
    try:
        from newspaper import Article
    except ImportError:
        raise ImportError("newspaper3k not installed. Run: pip install newspaper3k")
    article = Article(url)
    article.download()
    article.parse()
    if not article.text or len(article.text) < 100:
        raise ValueError("newspaper3k returned empty text.")
    return article.text


# ---------------------------------------------------------------------------
# Public fetch function — tries all strategies, returns first success
# ---------------------------------------------------------------------------
def fetch_article_text(url: str) -> str:
    """
    Attempts to fetch article text using multiple strategies in order.
    Raises a descriptive error if all strategies fail.
    """
    strategies = [
        ("Direct request",       _fetch_direct),
        ("Google AMP cache",     _fetch_google_amp),
        ("Wayback Machine",      _fetch_wayback),
        ("newspaper3k",          _fetch_newspaper),
    ]

    last_error = None
    for name, fn in strategies:
        try:
            print(f"  ↳ Trying {name}...", end=" ", flush=True)
            text = fn(url)
            if text and len(text.split()) > 80:
                print(f"({len(text.split())} words)")
                return text
            print("too little text, trying next strategy.")
        except Exception as e:
            print(f"  {e}")
            last_error = e
        time.sleep(0.3)   # brief pause between attempts

    raise ValueError(
        f"All fetch strategies failed for {url}.\n"
        "Options:\n"
        "  • Try a different URL (archived/AMP version)\n"
        "  • Paste the article text directly using --text flag\n"
        f"Last error: {last_error}"
    )


def extract_controversial_excerpt(article_text: str, url: str) -> dict:
    """
    Sends article text to GPT-4.1-mini and returns the most controversial
    one-paragraph excerpt along with metadata useful for the game engine.
    """

    system_prompt = """You are PapaQuant's News vs Noise AI analyzer.
Your job is to read financial or market-related articles and identify the single most
controversial, market-moving, or emotionally charged paragraph.

"Controversial" means:
- Makes a bold claim about a stock, CEO, company, or market
- Could cause retail traders to panic buy or panic sell
- Contains a provocative opinion or prediction
- Has potential to go viral on r/wallstreetbets or Twitter/X
- Is ambiguous enough that traders might disagree on whether it's NEWS or NOISE

Return your response as a JSON object with these fields:
{
  "controversial_excerpt": "<one paragraph from the article, verbatim or lightly cleaned>",
  "ticker_tags": ["<relevant tickers, e.g. AAPL, TSLA, DOGE>"],
  "controversy_score": <float 0.0-1.0, how controversial this is>,
  "reason": "<one sentence explaining why this is the most controversial part>"
}

Only return valid JSON. No markdown, no explanation outside the JSON."""

    user_prompt = f"""Article URL: {url}

Article Text:
{article_text[:6000]}

Identify and return the most controversial excerpt from this article."""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=600,
        response_format={"type": "json_object"},
    )

    import json
    result = json.loads(response.choices[0].message.content)
    return result


def run(url: str = None, raw_text: str = None) -> dict:
    """
    Main entry point.
    Pass either a URL (fetched automatically) or raw_text (skips fetch).
    """
    if raw_text:
        article_text = raw_text
        source = "pasted text"
        print(f"\nUsing pasted text ({len(article_text.split())} words)\n")
    elif url:
        print(f"\nFetching article: {url}\n")
        article_text = fetch_article_text(url)
        source = url
    else:
        raise ValueError("Provide either a URL or --text <article text>")

    print("\nAnalyzing with GPT-4.1-mini...\n")
    result = extract_controversial_excerpt(article_text, source)

    print("=" * 60)
    print("MOST CONTROVERSIAL EXCERPT")
    print("=" * 60)
    print(f"\n\"{result['controversial_excerpt']}\"\n")
    print(f"Tickers:          {', '.join(result.get('ticker_tags', ['N/A']))}")
    print(f"Controversy Score: {result.get('controversy_score', 'N/A')}")
    print(f"Reason:           {result.get('reason', 'N/A')}")
    print("=" * 60)

    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="PapaQuant Controversy Extractor",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python extract_controversy.py https://finance.yahoo.com/news/some-article
  python extract_controversy.py --text "Apple CEO Tim Cook said today that..."
        """,
    )
    parser.add_argument("url", nargs="?", help="Article URL to fetch and analyze")
    parser.add_argument("--text", "-t", metavar="ARTICLE_TEXT",
                        help="Paste raw article text instead of fetching a URL")
    args = parser.parse_args()

    if not args.url and not args.text:
        parser.print_help()
        sys.exit(1)

    run(url=args.url, raw_text=args.text)