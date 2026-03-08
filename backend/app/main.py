from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI, OpenAI # type: ignore
from app.config import settings
from datetime import datetime, timezone
from pydantic import BaseModel
import uvicorn
import os
import asyncio
import requests
import json

app = FastAPI(
    title="HackAI :D",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

ai_api_key = settings.openai_api_key
news_api_key = settings.news_api_key
url = "https://newsapi.org/v2/everything"

if not ai_api_key or not news_api_key:
    raise ValueError("API Key Missing")

client = OpenAI(api_key=ai_api_key)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {"message": "HackAI API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

async def main():
    config = uvicorn.Config(
        "main:app",
        host="localhost",
        port=8000,
        log_level="info",
        reload=True
    )
    server = uvicorn.Server(config)
        
    await server.serve()
    
class ChatRequest(BaseModel):
    prompt: str

@app.post("/chat")
async def chat(request: ChatRequest):
    response = await client.responses.create(model = settings.openai_model, input = request.prompt)
    return {"response" : response.output_text}

def call_newsapi(endpoint: str, params: dict):
    if not news_api_key:
        raise HTTPException(status_code=500, detail="NEWS_API_KEY is not set")

    base_url = "https://newsapi.org/v2"
    headers = {"X-Api-Key": news_api_key}

    try:
        response = requests.get(
            f"{base_url}/{endpoint}",
            params=params,
            headers=headers,
            timeout=15
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"News request failed: {e}")

    try:
        data = response.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="News API returned invalid JSON")

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=data
        )

    return data


def analyze_one_article(article: dict):
    article_data = {
        "title": article.get("title"),
        "description": article.get("description"),
        "content": article.get("content"),
        "source": article.get("source", {}).get("name"),
        "author": article.get("author"),
        "url": article.get("url"),
        "publishedAt": article.get("publishedAt")
    }

    article_json = json.dumps(article_data, indent=2)

    prompt = f"""
Your job is to read a financial, business, or market-related article and identify the most controversial, market-moving, or emotionally charged element.

"Controversial" means:
- Makes a bold claim about a stock, CEO, company, or market
- Could cause retail traders to panic buy or panic sell
- Contains a provocative opinion or prediction
- Has potential to go viral on social media
- Is ambiguous enough that traders may disagree on whether it is NEWS or NOISE

Return only valid JSON with exactly these fields:
{{
  "controversial_excerpt": "<about 120-150 words of standalone prose>",
  "ticker_tags": ["<relevant tickers>"],
  "controversy_score": <float from 0.0 to 1.0>,
  "reason": "<one sentence explaining the score>"
}}

Article:
{article_json}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "You analyze financial news and return strict JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    raw = response.choices[0].message.content

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {
            "controversial_excerpt": raw,
            "ticker_tags": [],
            "controversy_score": 0.0,
            "reason": "Model did not return valid JSON."
        }

    return {
        "article": article_data,
        "analysis": parsed
    }


def rank_articles(articles: list[dict]):
    ranked = []

    for article in articles:
        result = analyze_one_article(article)
        ranked.append(result)

    ranked.sort(
        key=lambda x: x["analysis"].get("controversy_score", 0.0),
        reverse=True
    )

    top_controversy = ranked[0] if ranked else None

    return {
        "generated_at": datetime.now().isoformat(),
        "article_count": len(ranked),
        "top_controversy": top_controversy,
        "ranked_articles": ranked
    }


@app.get("/news/ranked")
def get_ranked_news():
    params = {
        "q": '"CEO controversy" OR "CEO scandal" OR lawsuit OR fraud OR resignation',
        "language": "en",
        "pageSize": 20,
        "sortBy": "relevancy"
    }

    data = call_newsapi("everything", params)
    articles = data.get("articles", [])

    if not articles:
        return {
            "generated_at": datetime.now().isoformat(),
            "article_count": 0,
            "top_controversy": None,
            "ranked_articles": []
        }

    result = rank_articles(articles)

    filename = f"ranked_news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w") as f:
        json.dump(result, f, indent=2)

    return result

FINNHUB_API_KEY = "d6mp2lhr01qir35hu8p0d6mp2lhr01qir35hu8pg"
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

@app.get("/stocks/latest")
def get_latest_stock(symbol: str = Query(..., min_length=1, max_length=10)):
    """
    Returns the latest stock price for a symbol in a simple format
    that works nicely with a line chart.
    """
    url = f"{FINNHUB_BASE_URL}/quote"
    params = {
        "symbol": symbol.upper(),
        "token": FINNHUB_API_KEY,
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Stock API request failed: {e}")

    # Finnhub returns c=0 sometimes for invalid/no data
    current_price = data.get("c")
    if current_price is None or current_price == 0:
        raise HTTPException(status_code=404, detail=f"No latest price found for symbol '{symbol}'")

    return {
        "symbol": symbol.upper(),
        "time": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        "value": float(current_price),
        "open": float(data.get("o", 0)),
        "high": float(data.get("h", 0)),
        "low": float(data.get("l", 0)),
        "previous_close": float(data.get("pc", 0)),
    }
@app.get("/stocks/history")
def get_stock_history(symbol: str):
    return [
        {"time": "2026-02-01", "value": 185},
        {"time": "2026-02-08", "value": 188},
        {"time": "2026-02-15", "value": 184},
        {"time": "2026-02-22", "value": 191},
        {"time": "2026-03-01", "value": 193},
    ]


if __name__ == "__main__":
    asyncio.run(main())