"""
PapaQuant - Article Controversy Extractor
Reads a .txt file, calls GPT-4.1-mini, returns controversy JSON.
Now also saves clean JSON via --json flag for downstream pipeline.
"""

import os, sys, json, argparse
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError("OPENAI_API_KEY not found. Check your .env file.")

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_controversial_excerpt(article_text: str) -> dict:
    system_prompt = """You are PapaQuant's News vs Noise AI analyzer.
Read the article and produce a ~150 word summary of the most controversial,
market-moving, or emotionally charged development.

Return ONLY a JSON object with these fields:
{
  "controversial_excerpt": "<~150 word prose summary>",
  "ticker_tags": ["<e.g. AAPL, TSLA>"],
  "controversy_score": <float 0.0-1.0>,
  "reason": "<one sentence why this is the most controversial part>"
}
No markdown. No explanation outside the JSON."""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": f"Article:\n{article_text[:6000]}"},
        ],
        temperature=0.3,
        max_tokens=600,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def run(file_path: str) -> dict:
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read().strip()
    if not text:
        raise ValueError("File is empty.")

    print(f"\nReading: {file_path} ({len(text.split())} words)")
    print("Analyzing with GPT-4.1-mini...\n")

    result = extract_controversial_excerpt(text)
    result["article"] = os.path.basename(file_path)

    print("=" * 60)
    print("MOST CONTROVERSIAL EXCERPT")
    print("=" * 60)
    print(f"\n\"{result['controversial_excerpt']}\"\n")
    print(f"Tickers:           {', '.join(result.get('ticker_tags', ['N/A']))}")
    print(f"Controversy Score: {result.get('controversy_score', 'N/A')}")
    print(f"Reason:            {result.get('reason', 'N/A')}")
    print("=" * 60)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="PapaQuant Controversy Extractor",
        epilog="Examples:\n"
               "  python extract_controversy.py article.txt\n"
               "  python extract_controversy.py article.txt --json output.json",
    )
    parser.add_argument("file", help="Path to .txt article file")
    parser.add_argument("--json", dest="json_out", default=None,
                        help="Save extracted JSON to this file (required for AI_analyzer.py)")
    args = parser.parse_args()

    result = run(args.file)

    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        print(f"\nJSON saved -> {args.json_out}")
        print(f"Next:  python AI_analyzer.py {args.json_out} --out analysis_results.csv")
    else:
        print("\nTip: use --json output.json to save for downstream analysis.")