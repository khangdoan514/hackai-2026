import os
import sys
import argparse

# ── Make sure both sibling files are importable ───────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

import extract_controversy as extractor
import AI_analyzer as analyzer


def run_pipeline(
    url: str = None,
    raw_text: str = None,
    output_csv: str = None,
):
    """
    Full pipeline:
      1. Fetch article + extract most controversial paragraph
      2. Pull ticker and source from the extraction result
      3. Run AI_analyzer sentiment analysis
      4. Write to CSV

    Args:
        url:        Article URL to fetch (mutually exclusive with raw_text)
        raw_text:   Raw article text to use directly
        output_csv: Path to the output CSV (default: analysis_results.csv)
    """
    if not url and not raw_text:
        raise ValueError("Provide either a URL or raw text.")

    output_csv = output_csv or os.path.join(_HERE, "analysis_results.csv")

    # ── Stage 1: Extract controversial paragraph ──────────────────────────────
    print("\n[Stage 1] Extracting controversial paragraph...")
    extraction = extractor.run(url=url, raw_text=raw_text)

    paragraph = extraction["controversial_excerpt"]
    tickers   = extraction.get("ticker_tags", [])
    ticker    = tickers[0] if tickers else ""
    source    = url if url else "pasted text"

    print(f"\n  Paragraph : {paragraph[:120]}...")
    print(f"  Ticker    : {ticker or 'unknown'}")
    print(f"  Source    : {source}")

    # ── Stage 2: Sentiment analysis + vector search ───────────────────────────
    print("\n[Stage 2] Running sentiment analysis...")
    result = analyzer.analyze(
        paragraph=paragraph,
        source=source,
        ticker_hint=ticker,
    )

    # ── Stage 3: Write to CSV ─────────────────────────────────────────────────
    print("\n[Stage 3] Saving to CSV...")
    analyzer.save_to_csv(result, output_csv)


def main():
    parser = argparse.ArgumentParser(
        description="PapaQuant Pipeline — URL to CSV in one command",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # One-time vector DB setup (run this first)
  python run_pipeline.py --build

  # Analyze an article URL
  python run_pipeline.py --url https://finance.yahoo.com/news/some-article

  # Analyze pasted text
  python run_pipeline.py --text "Apple CEO Tim Cook said revenues fell short..."

  # Build + analyze in one shot
  python run_pipeline.py --build --url https://...

  # Custom output file
  python run_pipeline.py --url https://... --output game_rounds.csv
        """,
    )

    parser.add_argument(
        "--build",
        action="store_true",
        help="Build/rebuild the vector DB from tweets_stockprice.csv (required once before analyzing)",
    )
    parser.add_argument(
        "--url",
        metavar="URL",
        help="Article URL to fetch and analyze",
    )
    parser.add_argument(
        "--text",
        metavar="TEXT",
        help="Raw article text to analyze instead of fetching a URL",
    )
    parser.add_argument(
        "--output",
        metavar="FILE",
        default=os.path.join(_HERE, "analysis_results.csv"),
        help="Output CSV path (default: analysis_results.csv next to this script)",
    )

    args = parser.parse_args()

    if not args.build and not args.url and not args.text:
        parser.print_help()
        sys.exit(0)

    if args.build:
        print("\n[Setup] Building vector database...")
        analyzer.build_vector_db(analyzer.CSV_PATH)

    if args.url or args.text:
        run_pipeline(
            url=args.url,
            raw_text=args.text,
            output_csv=args.output,
        )


if __name__ == "__main__":
    main()