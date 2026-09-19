import logging
from database.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)

BOOTSTRAP_QUERIES = [
    "CREATE CONSTRAINT warehouse_unique IF NOT EXISTS FOR (w:Warehouse) REQUIRE w.name IS UNIQUE",
    "CREATE CONSTRAINT neighborhood_unique IF NOT EXISTS FOR (n:Neighborhood) REQUIRE n.name IS UNIQUE",
    "CREATE CONSTRAINT customer_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.name IS UNIQUE",
    "CREATE INDEX neighborhood_aqi IF NOT EXISTS FOR (n:Neighborhood) ON (n.aqi)",
    "CREATE INDEX neighborhood_name IF NOT EXISTS FOR (n:Neighborhood) ON (n.name)",
]


async def bootstrap_schema():
    """Create constraints and indexes if they don't exist. Idempotent."""
    async with neo4j_client.session() as session:
        for query in BOOTSTRAP_QUERIES:
            try:
                await session.run(query)
                logger.info("Schema OK: %s", query[:60])
            except Exception as e:
                logger.warning("Schema statement skipped (%s): %s", query[:40], e)
    logger.info("Schema bootstrap complete")
