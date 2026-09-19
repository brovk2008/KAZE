import asyncio
import logging
from database.neo4j_client import neo4j_client
from database.schema import bootstrap_schema
from seed.delhi_graph import seed_delhi_graph

logging.basicConfig(level=logging.INFO)

async def main():
    logger = logging.getLogger("seed_runner")
    logger.info("Connecting to Neo4j...")
    await neo4j_client.connect()

    async with neo4j_client.session() as session:
        logger.info("Wiping existing graph data...")
        await session.run("MATCH (n) DETACH DELETE n")

    logger.info("Bootstrapping constraints and indexes...")
    await bootstrap_schema()

    logger.info("Seeding exact specification graph...")
    await seed_delhi_graph(force=True)

    # Verification
    async with neo4j_client.session() as session:
        res = await session.run("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label")
        records = await res.data()
        logger.info("Node inventory: %s", records)

        rel_res = await session.run("MATCH ()-[r:ROAD]->() RETURN count(r) AS roads")
        rel_rec = await rel_res.single()
        logger.info("Total ROAD relationships: %s", rel_rec["roads"])

    await neo4j_client.close()
    logger.info("Setup & Seeding Complete! ✅")

if __name__ == "__main__":
    asyncio.run(main())
