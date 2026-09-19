from fastapi import APIRouter, Query
from services.route_engine import compute_route

router = APIRouter(prefix="/api", tags=["route"])


@router.get("/route")
async def get_route(
    customer: str = Query(default="Connaught Place Delivery", description="Customer node name"),
):
    """
    Compute the AQI-safe shortest route from the warehouse to the customer.
    Uses pure Cypher shortestPath with AQI <= 400 pre-filter (no GDS required).
    Returns waypoints with lat/lon for map rendering.
    """
    return await compute_route(customer_name=customer)
