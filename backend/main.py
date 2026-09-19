import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.neo4j_client import neo4j_client
from database.schema import bootstrap_schema
from scheduler import scheduler, get_last_sync
from websocket.manager import manager
from routes.route_api import router as route_router
from routes.aqi_api import router as aqi_router
from routes.graph_api import router as graph_router
from routes.news_api import router as news_router

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────
    logger.info("EcoRoute starting up...")
    await neo4j_client.connect()
    await bootstrap_schema()

    # Seed Delhi graph if empty
    await _seed_if_empty()

    # Warm the Tavily news cache on startup
    from routes.news_api import refresh_news_cache
    try:
        await refresh_news_cache()
    except Exception as e:
        logger.warning("Initial Tavily news fetch failed: %s", e)

    scheduler.start()
    logger.info("EcoRoute ready ✅")
    yield
    # ── Shutdown ─────────────────────────────────────────────
    scheduler.shutdown(wait=False)
    await neo4j_client.close()
    logger.info("EcoRoute shut down cleanly")


app = FastAPI(
    title="EcoRoute API",
    description="AQI-aware logistics routing for Delhi NCR — powered by Neo4j",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(route_router)
app.include_router(aqi_router)
app.include_router(graph_router)
app.include_router(news_router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "EcoRoute API",
        "neo4j": settings.NEO4J_URI,
        "last_aqi_sync": get_last_sync(),
        "websocket_clients": len(manager.active_connections),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.websocket("/ws/route-updates")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # Keep connection alive; client sends pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text('{"event":"pong"}')
    except WebSocketDisconnect:
        manager.disconnect(ws)


async def _seed_if_empty():
    """Seed the Delhi graph if no Neighborhood nodes exist yet."""
    CHECK_QUERY = "MATCH (n:Neighborhood) RETURN count(n) AS cnt"
    async with neo4j_client.session() as session:
        result = await session.run(CHECK_QUERY)
        record = await result.single()
        if record and record["cnt"] > 0:
            logger.info("Graph already seeded (%d neighborhoods)", record["cnt"])
            return

    logger.info("Seeding Delhi graph...")
    from seed.delhi_graph import NEIGHBORHOODS, WAREHOUSE, CUSTOMER, ROADS, aqi_to_category

    async with neo4j_client.session() as session:
        # Warehouse
        await session.run(
            "MERGE (w:Warehouse {name: $name}) SET w.lat=$lat, w.lon=$lon, w.aqi=$aqi, w.type='warehouse'",
            **WAREHOUSE,
        )
        # Customer
        await session.run(
            "MERGE (c:Customer {name: $name}) SET c.lat=$lat, c.lon=$lon, c.aqi=$aqi, c.type='customer'",
            **CUSTOMER,
        )
        # Neighborhoods
        for nbhd in NEIGHBORHOODS:
            category, hex_color = aqi_to_category(nbhd["aqi"])
            await session.run(
                """MERGE (n:Neighborhood {name: $name})
                   SET n.lat=$lat, n.lon=$lon, n.aqi=$aqi,
                       n.aqi_category=$category, n.aqi_hex=$hex,
                       n.station=$station, n.last_updated=datetime()""",
                name=nbhd["name"], lat=nbhd["lat"], lon=nbhd["lon"],
                aqi=nbhd["aqi"], category=category, hex=hex_color,
                station=nbhd["station"],
            )
        # Roads
        for frm, to, dist in ROADS:
            await session.run(
                "MATCH (a {name: $frm}), (b {name: $to}) MERGE (a)-[r:ROAD]-(b) SET r.distance=$dist",
                frm=frm, to=to, dist=dist,
            )

    logger.info("Delhi graph seeded: %d neighborhoods, %d roads", len(NEIGHBORHOODS), len(ROADS))
