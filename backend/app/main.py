from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI # type: ignore
from app.config import settings
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

client = AsyncOpenAI(api_key=ai_api_key)

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
    BASE_URL = "https://newsapi.org/v2"

    headers = {
        "X-Api-Key": news_api_key
    }

    try:
        response = requests.get(
            f"{BASE_URL}/{endpoint}",
            params=params,
            headers=headers,
            timeout=15
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"News request failed: {e}")

    data = response.json()

    if response.status_code != 200:
        message = data.get("message", "Unknown error")
        code = data.get("code", "newsapi_error")
        raise HTTPException(status_code=response.status_code, detail={
            "code": code,
            "message": message
        })

    return data
@app.get("/news")
def get_news():

    params = {
        "q": "CEO controversy OR CEO scandal",
        "language": "en",
        "pageSize": 10
    }

    data = call_newsapi("everything", params)

    articles = [
        {
            "title": a["title"],
            "source": a["source"]["name"],
            "url": a["url"],
            "published": a["publishedAt"]
        }
        for a in data["articles"]
    ]

    return {"articles": articles}


if __name__ == "__main__":
    asyncio.run(main())