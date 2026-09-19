import httpx
import logging
from database.neo4j_client import neo4j_client
from services.graph_mapper import station_to_neighborhood

logger = logging.getLogger(__name__)

DATA_GOV_URL = (
    "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
    "?api-key={key}&format=json&filters%5Bcity%5D=Delhi&limit=100"
)

CYPHER_BULK_UPDATE = """
UNWIND $updates AS u
MATCH (n:Neighborhood {name: u.name})
SET n.aqi       = u.aqi,
    n.aqi_category = u.category,
    n.aqi_hex   = u.hex,
    n.station   = u.station,
    n.last_updated = datetime()
RETURN count(n) AS updated
"""

# In-memory cache: neighborhood_name → real AQI (used for reset-after-simulate)
_real_aqi_cache: dict[str, dict] = {}


def compute_station_aqi(records: list[dict]) -> dict[str, int]:
    """
    Group pollutant sub-indices by station, return max per station.
    CPCB: each row = one pollutant at one station.
    AQI = max(all pollutant_avg values for that station).
    """
    station_maxes: dict[str, int] = {}
    for r in records:
        station = r.get("station", "")
        try:
            val = int(float(r.get("pollutant_avg") or 0))
        except (ValueError, TypeError):
            continue
        station_maxes[station] = max(station_maxes.get(station, 0), val)
    return station_maxes


def aqi_to_category(aqi: int) -> tuple[str, str]:
    if aqi <= 50:   return "Good", "#00B050"
    if aqi <= 100:  return "Satisfactory", "#92D050"
    if aqi <= 200:  return "Moderate", "#FFFF00"
    if aqi <= 300:  return "Poor", "#FF9900"
    if aqi <= 400:  return "Very Poor", "#FF0000"
    return "Severe", "#800000"


async def sync_aqi_from_cpcb(api_key: str) -> int:
    """Fetch CPCB data, compute station AQI, bulk-update Neo4j. Returns count updated."""
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(DATA_GOV_URL.format(key=api_key))
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.error("CPCB API fetch failed: %s — using cached AQI values", e)
        return 0

    records = data.get("records", [])
    if not records:
        logger.warning("CPCB API returned 0 records")
        return 0

    station_aqis = compute_station_aqi(records)
    updates = []

    for station_name, aqi in station_aqis.items():
        nbhd = station_to_neighborhood(station_name)
        if not nbhd:
            continue
        category, hex_color = aqi_to_category(aqi)
        entry = {
            "name": nbhd,
            "aqi": aqi,
            "category": category,
            "hex": hex_color,
            "station": station_name,
        }
        updates.append(entry)
        _real_aqi_cache[nbhd] = entry

    if not updates:
        logger.warning("No station→neighborhood matches found in CPCB response")
        return 0

    try:
        async with neo4j_client.session() as session:
            result = await session.run(CYPHER_BULK_UPDATE, updates=updates)
            record = await result.single()
            count = record["updated"] if record else 0
            logger.info("AQI sync complete: %d neighborhoods updated", count)
            return count
    except Exception as e:
        logger.error("Neo4j bulk AQI update failed: %s", e)
        return 0


def get_real_aqi(neighborhood: str) -> dict | None:
    """Return last-known real AQI data for a neighborhood (for reset-after-simulate)."""
    return _real_aqi_cache.get(neighborhood)
