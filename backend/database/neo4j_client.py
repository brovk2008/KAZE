from contextlib import asynccontextmanager
from neo4j import AsyncGraphDatabase, AsyncDriver
from config import settings
import logging

logger = logging.getLogger(__name__)


class Neo4jClient:
    def __init__(self):
        self._driver: AsyncDriver | None = None

    async def connect(self):
        self._driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            max_connection_pool_size=20,
            connection_acquisition_timeout=30,
            database=settings.NEO4J_DATABASE,
        )
        await self._driver.verify_connectivity()
        logger.info("Neo4j connected: %s", settings.NEO4J_URI)

    async def close(self):
        if self._driver:
            await self._driver.close()
            logger.info("Neo4j connection closed")

    @asynccontextmanager
    async def session(self, **kwargs):
        if self._driver is None:
            raise RuntimeError("Neo4j driver not initialised. Call connect() first.")
        kwargs.setdefault("database", settings.NEO4J_DATABASE)
        async with self._driver.session(**kwargs) as sess:
            yield sess


# Singleton used across the app
neo4j_client = Neo4jClient()
