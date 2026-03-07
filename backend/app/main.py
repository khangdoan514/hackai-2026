from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI # type: ignore
from app.config import Settings
from pydantic import BaseModel
import uvicorn
import asyncio

app = FastAPI(
    title="HackAI :D",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

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

@app.get("/chat")
async def chat():
    pass


if __name__ == "__main__":
    asyncio.run(main())