from fastapi import APIRouter
from services.route_engine import get_all_nodes, get_all_edges

router = APIRouter(prefix="/api", tags=["graph"])


@router.get("/graph")
async def get_graph():
    """
    Return all nodes and edges for map rendering.
    Nodes include AQI colour data for the Leaflet circle layer.
    """
    nodes = await get_all_nodes()
    edges = await get_all_edges()
    return {"nodes": nodes, "edges": edges}
