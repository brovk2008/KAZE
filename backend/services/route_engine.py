import logging
from database.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)

SAFE_ROUTE_QUERY = """
MATCH (warehouse:Warehouse), (customer:Customer {name: $customer_name})
MATCH p = shortestPath((warehouse)-[:ROAD*..15]-(customer))
WHERE all(n IN nodes(p)
          WHERE n.aqi <= 400
             OR n:Warehouse
             OR n:Customer)
WITH p,
     reduce(dist = 0, r IN relationships(p) | dist + r.distance) AS total_km,
     [x IN nodes(p) | {
       name:     x.name,
       lat:      x.lat,
       lon:      x.lon,
       aqi:      coalesce(x.aqi, 0),
       category: coalesce(x.aqi_category, 'N/A'),
       hex:      coalesce(x.aqi_hex, '#FFFFFF'),
       type:     CASE WHEN x:Warehouse THEN 'warehouse'
                      WHEN x:Customer  THEN 'customer'
                      ELSE 'neighborhood' END
     }] AS waypoints
RETURN waypoints,
       total_km,
       length(p) AS hops,
       [x IN nodes(p) WHERE x:Neighborhood AND x.aqi > 300 | x.name] AS high_risk_zones
ORDER BY total_km ASC
LIMIT 1;
"""

ALL_NODES_QUERY = """
MATCH (n)
WHERE n:Neighborhood OR n:Warehouse OR n:Customer
RETURN n.name AS name,
       n.lat AS lat,
       n.lon AS lon,
       coalesce(n.aqi, 0) AS aqi,
       coalesce(n.aqi_category, 'N/A') AS category,
       coalesce(n.aqi_hex, '#FFFFFF') AS hex,
       coalesce(n.last_updated, '') AS last_updated,
       CASE WHEN n:Warehouse THEN 'warehouse'
            WHEN n:Customer  THEN 'customer'
            ELSE 'neighborhood' END AS type
ORDER BY n.aqi DESC
"""

ALL_EDGES_QUERY = """
MATCH (a)-[r:ROAD]->(b)
RETURN a.name AS from_node, b.name AS to_node, r.distance AS distance
"""


async def compute_route(
    customer_name: str = "Connaught Place Delivery",
) -> dict:
    """
    Run the AQI-constrained shortest path query according to specification.
    Returns route dict or a 'no_safe_route' sentinel if all paths are blocked.
    """
    try:
        async with neo4j_client.session() as session:
            result = await session.run(SAFE_ROUTE_QUERY, customer_name=customer_name)
            record = await result.single()

        if record is None:
            logger.warning("No safe route found — all paths pass through AQI > 400 zones")
            return {
                "status": "no_safe_route",
                "message": "All routes pass through AQI > 400 zones. Manual dispatch required.",
                "waypoints": [],
                "total_km": 0,
                "hops": 0,
                "avoided": [],
                "high_risk_zones": [],
            }

        waypoints = record["waypoints"]
        total_km = round(record["total_km"], 2)
        hops = record["hops"]
        high_risk_zones = record.get("high_risk_zones", [])

        # Identify which neighborhoods are avoided (AQI > 400 across graph)
        avoided = await _get_severe_nodes(waypoints)

        return {
            "status": "ok",
            "waypoints": waypoints,
            "total_km": total_km,
            "hops": hops,
            "avoided": avoided,
            "high_risk_zones": high_risk_zones,
        }

    except Exception as e:
        logger.error("Route query failed: %s", e)
        return {
            "status": "error",
            "message": str(e),
            "waypoints": [],
            "total_km": 0,
            "hops": 0,
            "avoided": [],
            "high_risk_zones": [],
        }


async def _get_severe_nodes(waypoints: list) -> list[str]:
    """Return names of Neighborhood nodes with AQI > 400."""
    try:
        waypoint_names = {w["name"] for w in waypoints}
        async with neo4j_client.session() as session:
            res = await session.run(
                "MATCH (n:Neighborhood) WHERE n.aqi > 400 RETURN n.name AS name"
            )
            records = await res.data()
            return [r["name"] for r in records if r["name"] not in waypoint_names]
    except Exception as e:
        logger.error("Failed to query severe nodes: %s", e)
        return []


async def get_all_nodes() -> list[dict]:
    """Return all node details for live AQI station listings."""
    try:
        async with neo4j_client.session() as session:
            res = await session.run(ALL_NODES_QUERY)
            return await res.data()
    except Exception as e:
        logger.error("Failed to fetch nodes: %s", e)
        return []


async def get_graph_data() -> dict:
    """Return all nodes and edges for map rendering."""
    try:
        async with neo4j_client.session() as session:
            n_res = await session.run(ALL_NODES_QUERY)
            nodes = await n_res.data()

            e_res = await session.run(ALL_EDGES_QUERY)
            edges = await e_res.data()

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error("Failed to fetch graph data: %s", e)
        return {"nodes": [], "edges": []}
