from fastapi import APIRouter
from services.tavily_news import fetch_delhi_aqi_news

router = APIRouter(prefix="/api", tags=["news"])

# In-memory cache — updated by the 2-hour scheduler
_news_cache: dict = {"summary": "", "articles": [], "fetched_at": "never"}


@router.get("/news")
async def get_news():
    """Return cached Delhi AQI news from Tavily. Refreshed every 2 hours."""
    return _news_cache


async def refresh_news_cache():
    """Called by the scheduler every 2 hours."""
    global _news_cache
    from datetime import datetime, timezone
    result = await fetch_delhi_aqi_news(max_results=6)
    _news_cache = {**result, "fetched_at": datetime.now(timezone.utc).isoformat()}
