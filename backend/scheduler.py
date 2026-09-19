import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.aqi_ingestion import sync_aqi_from_cpcb
from services.route_engine import compute_route
from websocket.manager import manager
from config import settings

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")
_last_sync: str = "never"


@scheduler.scheduled_job("interval", minutes=60, id="hourly_aqi_sync")
async def hourly_aqi_sync():
    global _last_sync
    logger.info("⏰ Hourly AQI sync starting...")
    updated = await sync_aqi_from_cpcb(settings.CPCB_API_KEY)
    _last_sync = datetime.now(timezone.utc).isoformat()
    if updated > 0:
        route = await compute_route()
        await manager.broadcast({
            "event": "aqi_sync",
            "updated_nodes": updated,
            "route": route,
            "timestamp": _last_sync,
        })
        logger.info("Hourly sync broadcast sent: %d nodes updated", updated)


@scheduler.scheduled_job("interval", hours=2, id="news_refresh")
async def news_refresh():
    """Refresh Tavily AQI news cache every 2 hours."""
    from routes.news_api import refresh_news_cache
    logger.info("📰 Refreshing Tavily news cache...")
    await refresh_news_cache()


def get_last_sync() -> str:
    return _last_sync
