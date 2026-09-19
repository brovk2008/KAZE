import logging
from tavily import TavilyClient
from config import settings

logger = logging.getLogger(__name__)

_client: TavilyClient | None = None


def get_client() -> TavilyClient:
    global _client
    if _client is None:
        _client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    return _client


async def fetch_delhi_aqi_news(max_results: int = 5) -> list[dict]:
    """
    Search Tavily for latest Delhi air quality news.
    Called every 2 hours by the scheduler.
    """
    try:
        client = get_client()
        result = client.search(
            query="Delhi NCR air quality AQI pollution today 2026",
            search_depth="basic",
            max_results=max_results,
            include_answer=True,
            include_domains=["timesofindia.com", "hindustantimes.com", "thehindu.com",
                             "ndtv.com", "indiatoday.in", "iqair.com", "aqi.in"],
        )
        articles = []
        for r in result.get("results", []):
            articles.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", "")[:300],
                "source": r.get("url", "").split("/")[2] if r.get("url") else "",
                "score": round(r.get("score", 0), 3),
            })
        summary = result.get("answer", "")
        return {"summary": summary, "articles": articles}
    except Exception as e:
        logger.error("Tavily news fetch failed: %s", e)
        return {"summary": "", "articles": []}


async def fetch_spike_context(neighborhood: str, aqi: int) -> str:
    """
    When a spike is simulated, ask Tavily WHY that area might be spiking.
    Returns a short contextual paragraph for the dashboard.
    """
    try:
        client = get_client()
        result = client.search(
            query=f"Why is {neighborhood} Delhi AQI high pollution causes {aqi} 2026",
            search_depth="basic",
            max_results=3,
            include_answer=True,
        )
        return result.get("answer", f"AQI spike detected at {neighborhood} ({aqi}). Check local pollution sources.")
    except Exception as e:
        logger.warning("Tavily spike context failed: %s", e)
        return f"AQI spike detected at {neighborhood} ({aqi})."
