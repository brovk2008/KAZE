"""
Delhi NCR Graph Seed Data matching exact specification.
- 1 Warehouse: Okhla Industrial Estate (aqi=0)
- 2 Customers: Connaught Place Delivery (aqi=0), Rohini Sector 18 Delivery (aqi=0)
- 13 Neighborhoods with CPCB stations and coordinates
- 43 Bidirectional ROAD relationships with real road distances (km)
"""
import logging
from database.neo4j_client import neo4j_client

logger = logging.getLogger(__name__)

WAREHOUSE = {
    "name": "Okhla Industrial Estate",
    "lat": 28.5398,
    "lon": 77.2706,
    "aqi": 0,
}

CUSTOMERS = [
    {
        "name": "Connaught Place Delivery",
        "lat": 28.6295,
        "lon": 77.2205,
        "aqi": 0,
    },
    {
        "name": "Rohini Sector 18 Delivery",
        "lat": 28.7293,
        "lon": 77.1210,
        "aqi": 0,
    },
]

NEIGHBORHOODS = [
    {"name": "Okhla Phase 2",    "lat": 28.5280, "lon": 77.2736, "aqi": 187, "cat": "Moderate",  "hex": "#FFFF00", "st": "Okhla Phase-2, Delhi - DPCC"},
    {"name": "Nehru Nagar",       "lat": 28.5673, "lon": 77.2536, "aqi": 220, "cat": "Poor",      "hex": "#FF9900", "st": "Nehru Nagar, Delhi - DPCC"},
    {"name": "ITO",               "lat": 28.6328, "lon": 77.2402, "aqi": 312, "cat": "Very Poor", "hex": "#FF0000", "st": "ITO, Delhi - DPCC"},
    {"name": "Connaught Place",   "lat": 28.6329, "lon": 77.2195, "aqi": 195, "cat": "Moderate",  "hex": "#FFFF00", "st": "Mandir Marg, Delhi - DPCC"},
    {"name": "RK Puram",          "lat": 28.5672, "lon": 77.1878, "aqi": 198, "cat": "Moderate",  "hex": "#FFFF00", "st": "R.K. Puram, Delhi - DPCC"},
    {"name": "Shadipur",          "lat": 28.6540, "lon": 77.1445, "aqi": 264, "cat": "Poor",      "hex": "#FF9900", "st": "Shadipur, Delhi - DPCC"},
    {"name": "Punjabi Bagh",      "lat": 28.6681, "lon": 77.1280, "aqi": 301, "cat": "Very Poor", "hex": "#FF0000", "st": "Punjabi Bagh, Delhi - DPCC"},
    {"name": "Anand Vihar",       "lat": 28.6469, "lon": 77.3152, "aqi": 264, "cat": "Poor",      "hex": "#FF9900", "st": "Anand Vihar, Delhi - DPCC"},
    {"name": "Wazirpur",          "lat": 28.6908, "lon": 77.1587, "aqi": 342, "cat": "Very Poor", "hex": "#FF0000", "st": "Wazirpur, Delhi - DPCC"},
    {"name": "Jahangirpuri",      "lat": 28.7300, "lon": 77.1665, "aqi": 388, "cat": "Very Poor", "hex": "#FF0000", "st": "Jahangirpuri, Delhi - DPCC"},
    {"name": "Rohini",            "lat": 28.7293, "lon": 77.1210, "aqi": 195, "cat": "Moderate",  "hex": "#FFFF00", "st": "Rohini, Delhi - DPCC"},
    {"name": "Dwarka Sec 8",      "lat": 28.5823, "lon": 77.0637, "aqi": 220, "cat": "Poor",      "hex": "#FF9900", "st": "Dwarka-Sector 8, Delhi - DPCC"},
    {"name": "Mandir Marg",       "lat": 28.6430, "lon": 77.2021, "aqi": 178, "cat": "Moderate",  "hex": "#FFFF00", "st": "Mandir Marg, Delhi - DPCC"},
]

ROADS = [
    {"from": "Okhla Industrial Estate", "to": "Okhla Phase 2",              "dist": 2.1},
    {"from": "Okhla Phase 2",           "to": "Okhla Industrial Estate",     "dist": 2.1},
    {"from": "Okhla Phase 2",           "to": "Nehru Nagar",                 "dist": 3.8},
    {"from": "Nehru Nagar",             "to": "Okhla Phase 2",               "dist": 3.8},
    {"from": "Okhla Phase 2",           "to": "ITO",                         "dist": 7.2},
    {"from": "ITO",                     "to": "Okhla Phase 2",               "dist": 7.2},
    {"from": "Nehru Nagar",             "to": "RK Puram",                    "dist": 4.5},
    {"from": "RK Puram",                "to": "Nehru Nagar",                 "dist": 4.5},
    {"from": "Nehru Nagar",             "to": "ITO",                         "dist": 5.1},
    {"from": "ITO",                     "to": "Nehru Nagar",                 "dist": 5.1},
    {"from": "ITO",                     "to": "Connaught Place",             "dist": 3.9},
    {"from": "Connaught Place",         "to": "ITO",                         "dist": 3.9},
    {"from": "ITO",                     "to": "Mandir Marg",                 "dist": 4.2},
    {"from": "Mandir Marg",             "to": "ITO",                         "dist": 4.2},
    {"from": "ITO",                     "to": "Anand Vihar",                 "dist": 8.4},
    {"from": "Anand Vihar",             "to": "ITO",                         "dist": 8.4},
    {"from": "Connaught Place",         "to": "Mandir Marg",                 "dist": 2.1},
    {"from": "Mandir Marg",             "to": "Connaught Place",             "dist": 2.1},
    {"from": "Connaught Place",         "to": "Shadipur",                    "dist": 6.8},
    {"from": "Shadipur",                "to": "Connaught Place",             "dist": 6.8},
    {"from": "RK Puram",                "to": "Dwarka Sec 8",                "dist": 12.3},
    {"from": "Dwarka Sec 8",            "to": "RK Puram",                    "dist": 12.3},
    {"from": "RK Puram",                "to": "Shadipur",                    "dist": 7.4},
    {"from": "Shadipur",                "to": "RK Puram",                    "dist": 7.4},
    {"from": "Shadipur",                "to": "Punjabi Bagh",                "dist": 4.8},
    {"from": "Punjabi Bagh",            "to": "Shadipur",                    "dist": 4.8},
    {"from": "Shadipur",                "to": "Wazirpur",                    "dist": 5.2},
    {"from": "Wazirpur",                "to": "Shadipur",                    "dist": 5.2},
    {"from": "Punjabi Bagh",            "to": "Rohini",                      "dist": 9.1},
    {"from": "Rohini",                  "to": "Punjabi Bagh",                "dist": 9.1},
    {"from": "Punjabi Bagh",            "to": "Dwarka Sec 8",                "dist": 14.7},
    {"from": "Dwarka Sec 8",            "to": "Punjabi Bagh",                "dist": 14.7},
    {"from": "Wazirpur",                "to": "Jahangirpuri",                "dist": 4.3},
    {"from": "Jahangirpuri",            "to": "Wazirpur",                    "dist": 4.3},
    {"from": "Wazirpur",                "to": "Rohini",                      "dist": 6.2},
    {"from": "Rohini",                  "to": "Wazirpur",                    "dist": 6.2},
    {"from": "Jahangirpuri",            "to": "Rohini",                      "dist": 5.8},
    {"from": "Rohini",                  "to": "Jahangirpuri",                "dist": 5.8},
    {"from": "Anand Vihar",             "to": "Wazirpur",                    "dist": 11.3},
    {"from": "Wazirpur",                "to": "Anand Vihar",                 "dist": 11.3},
    {"from": "Mandir Marg",             "to": "Connaught Place Delivery",    "dist": 1.8},
    {"from": "Connaught Place",         "to": "Connaught Place Delivery",    "dist": 0.9},
    {"from": "Rohini",                  "to": "Rohini Sector 18 Delivery",   "dist": 1.2},
]


async def seed_delhi_graph(force: bool = False):
    """Seed the Neo4j graph with exact specification nodes and edges."""
    async with neo4j_client.session() as session:
        # Check if already seeded unless forced
        if not force:
            count_res = await session.run("MATCH (n:Neighborhood) RETURN count(n) AS c")
            record = await count_res.single()
            if record and record["c"] >= len(NEIGHBORHOODS):
                logger.info("Graph already seeded (%d neighborhoods). Skipping.", record["c"])
                return

        logger.info("Seeding Delhi NCR Graph specification...")

        # 1. Create Warehouse
        await session.run(
            """
            MERGE (w:Warehouse {name: $name})
            SET w.lat = $lat, w.lon = $lon, w.aqi = $aqi
            """,
            WAREHOUSE,
        )

        # 2. Create Customers
        for cust in CUSTOMERS:
            await session.run(
                """
                MERGE (c:Customer {name: $name})
                SET c.lat = $lat, c.lon = $lon, c.aqi = $aqi
                """,
                cust,
            )

        # 3. Create Neighborhoods
        await session.run(
            """
            UNWIND $items AS row
            MERGE (n:Neighborhood {name: row.name})
            SET n.lat          = row.lat,
                n.lon          = row.lon,
                n.aqi          = row.aqi,
                n.aqi_category = row.cat,
                n.aqi_hex      = row.hex,
                n.station      = row.st,
                n.last_updated = datetime()
            """,
            {"items": NEIGHBORHOODS},
        )

        # 4. Create Road Relationships
        await session.run(
            """
            UNWIND $roads AS road
            MATCH (a {name: road.from}), (b {name: road.to})
            MERGE (a)-[r:ROAD]->(b)
            SET r.distance = road.dist
            """,
            {"roads": ROADS},
        )

        logger.info("Delhi NCR Graph seed complete ✅")
