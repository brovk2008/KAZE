import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    NEO4J_URI: str = "neo4j+s://96f11763.databases.neo4j.io"
    NEO4J_USER: str = "96f11763"
    NEO4J_PASSWORD: str = "rWxcC9xgUB-W_2msk2tNhm7I0g0Cr3MbHdI3vp1MHks"
    NEO4J_DATABASE: str = "96f11763"
    CPCB_API_KEY: str = "579b464db66ec23bdd00000129ca663565f3487e68329466cdd8da2c"
    TAVILY_API_KEY: str = "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"
    CORS_ORIGINS: str = "http://localhost:5173,https://kaze.vercel.app,https://kaze-igniteroom-coral.vercel.app,*"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
