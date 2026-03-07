from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
from app.config import settings
from pydantic import BaseModel
import uvicorn
import asyncio

app = FastAPI(
    title="HackAI :D",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

api_key = settings.openai_api_key
if not api_key:
    raise ValueError("API Key Missing")
client = AsyncOpenAI(api_key=api_key)

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


if __name__ == "__main__":
    asyncio.run(main())