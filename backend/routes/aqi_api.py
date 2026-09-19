import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from services.aqi_ingestion import sync_aqi_from_cpcb, get_cached_real_aqi as get_real_aqi, aqi_to_category
from services.route_engine import compute_route, get_all_nodes
from services.tavily_news import fetch_spike_context
from websocket.manager import manager
from database.neo4j_client import neo4j_client
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/aqi", tags=["aqi"])

_last_sync: str = "never"


class SpikeRequest(BaseModel):
    neighborhood: str
    spike_value: int = 487


class ResetRequest(BaseModel):
    neighborhood: str


@router.get("/live")
async def get_live_aqi():
    """Return all neighborhood nodes with current AQI values."""
    nodes = await get_all_nodes()
    return {
        "stations": nodes,
        "last_sync": _last_sync,
        "count": len(nodes),
    }


@router.post("/sync")
async def manual_sync():
    """Manually trigger a CPCB AQI sync (useful for demo)."""
    global _last_sync
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
    return {"updated": updated, "timestamp": _last_sync}


@router.post("/simulate")
async def simulate_spike(body: SpikeRequest):
    """
    Simulate an AQI spike on a neighborhood node.
    Updates Neo4j, recomputes the route, and broadcasts via WebSocket.
    Also fetches Tavily context for why the area might be spiking.
    """
    SET_QUERY = """
    MATCH (n:Neighborhood {name: $name})
    WITH n, n.aqi AS prev_aqi
    SET n.aqi = $aqi,
        n.aqi_category = $category,
        n.aqi_hex = $hex,
        n.last_updated = datetime()
    RETURN n.name AS name, prev_aqi
    """
    category, hex_color = ("Severe", "#800000") if body.spike_value > 400 else aqi_to_category(body.spike_value)

    try:
        async with neo4j_client.session() as session:
            result = await session.run(
                SET_QUERY,
                name=body.neighborhood,
                aqi=body.spike_value,
                category=category,
                hex=hex_color,
            )
            record = await result.single()
            if not record:
                return {"success": False, "error": f"Neighborhood '{body.neighborhood}' not found"}
            prev_aqi = record["prev_aqi"]
    except Exception as e:
        logger.error("Spike simulation failed: %s", e)
        return {"success": False, "error": str(e)}

    route = await compute_route()
    context = await fetch_spike_context(body.neighborhood, body.spike_value)

    await manager.broadcast({
        "event": "aqi_update",
        "spiked_node": body.neighborhood,
        "previous_aqi": prev_aqi,
        "new_aqi": body.spike_value,
        "route": route,
        "context": context,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "success": True,
        "neighborhood": body.neighborhood,
        "previous_aqi": prev_aqi,
        "new_aqi": body.spike_value,
        "category": category,
        "route": route,
        "context": context,
    }


@router.post("/reset")
async def reset_spike(body: ResetRequest):
    """Restore real AQI after simulation."""
    real = get_real_aqi(body.neighborhood)
    if not real:
        # Fall back to a neutral Moderate value
        real = {"name": body.neighborhood, "aqi": 180, "category": "Moderate", "hex": "#FFFF00", "station": ""}

    RESET_QUERY = """
    MATCH (n:Neighborhood {name: $name})
    SET n.aqi = $aqi, n.aqi_category = $category, n.aqi_hex = $hex, n.last_updated = datetime()
    RETURN n.name
    """
    async with neo4j_client.session() as session:
        await session.run(
            RESET_QUERY,
            name=body.neighborhood,
            aqi=real["aqi"],
            category=real["category"],
            hex=real["hex"],
        )

    route = await compute_route()
    await manager.broadcast({
        "event": "aqi_reset",
        "neighborhood": body.neighborhood,
        "restored_aqi": real["aqi"],
        "route": route,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"success": True, "restored": real, "route": route}
