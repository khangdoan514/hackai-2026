from dotenv import load_dotenv
import os
from openai import AsyncOpenAI # type: ignore
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class Settings(BaseSettings):
    openai_api_key: str
    news_api_key: str
    openai_model: str = "gpt-4.1-mini"
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings() # type: ignore