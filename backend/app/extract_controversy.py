"""
PapaQuant - Article Controversy Extractor
Reads a .txt file and uses GPT-4.1-mini to extract the most controversial
paragraph for the News vs Noise game engine.
"""

import os
import sys
import json
import argparse
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise EnvironmentError("OPENAI_API_KEY not found in environment. Check your .env file.")

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_controversial_excerpt(article_text: str) -> dict:
    system_prompt = """You are PapaQuant's News vs Noise AI analyzer.
Your job is to read financial or market-related articles and produce a ~150 word summary
of the most controversial, market-moving, or emotionally charged development in the article.

"Controversial" means:
- Makes a bold claim about a stock, CEO, company, or market
- Could cause retail traders to panic buy or panic sell
- Contains a provocative opinion or prediction
- Has potential to go viral on r/wallstreetbets or Twitter/X
- Is ambiguous enough that traders might disagree on whether it's NEWS or NOISE

The "controversial_excerpt" field should be a self-contained ~150 word paragraph that:
- Summarizes the core controversial event or claim in plain language
- Includes enough context so it can be read standalone
- Is written to be suitable for downstream sentiment analysis
- Does NOT use bullet points or headers — flowing prose only

Return your response as a JSON object with these fields:
{
  "controversial_excerpt": "<~150 word prose summary of the most controversial element>",
  "ticker_tags": ["<relevant tickers, e.g. AAPL, TSLA, DOGE>"],
  "controversy_score": <float 0.0-1.0, how controversial this is>,
  "reason": "<one sentence explaining why this is the most controversial part>"
}

Only return valid JSON. No markdown, no explanation outside the JSON."""

    user_prompt = f"""Article Text:
{article_text[:6000]}

Identify the most controversial element and return a ~150 word prose summary of it."""

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

    return json.loads(response.choices[0].message.content)


def run(file_path: str) -> dict:
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        article_text = f.read().strip()

    if not article_text:
        raise ValueError("The file is empty.")

    print(f"\nReading: {file_path} ({len(article_text.split())} words)")
    print("Analyzing with GPT-4.1-mini...\n")

    result = extract_controversial_excerpt(article_text)

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
        epilog="Example: python extract_controversy.py article.txt",
    )
    parser.add_argument("file", help="Path to a .txt file containing the article text")
    args = parser.parse_args()

    run(args.file)