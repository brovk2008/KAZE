import asyncio
import logging
from database.neo4j_client import neo4j_client
from services.route_engine import compute_route

logging.basicConfig(level=logging.INFO)

async def main():
    await neo4j_client.connect()

    # 1. Check initial route
    r1 = await compute_route()
    print("Initial Route:", [w["name"] for w in r1["waypoints"]], "KM:", r1["total_km"])

    # 2. Spike ITO to 503 (Severe > 400)
    async with neo4j_client.session() as s:
        await s.run(
            "MATCH (n:Neighborhood {name: 'ITO'}) SET n.aqi = 503, n.aqi_category = 'Severe', n.aqi_hex = '#800000'"
        )
    print("Spiked ITO to 503 (Severe > 400)")

    # 3. Check rerouted path
    r2 = await compute_route()
    print("Rerouted Route:", [w["name"] for w in r2["waypoints"]], "KM:", r2["total_km"])
    print("Avoided zones:", r2["avoided"])

    # 4. Reset ITO back to 312
    async with neo4j_client.session() as s:
        await s.run(
            "MATCH (n:Neighborhood {name: 'ITO'}) SET n.aqi = 312, n.aqi_category = 'Very Poor', n.aqi_hex = '#FF0000'"
        )
    print("Reset ITO back to 312")

    await neo4j_client.close()

if __name__ == "__main__":
    asyncio.run(main())
