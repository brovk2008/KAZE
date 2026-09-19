# EcoRoute KAZE — Architecture Reference

> **AQI-Aware Logistics Routing for Delhi NCR**
> Built for the PS-1A Neo4j Hackathon

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Graph Data Model (Neo4j)](#4-graph-data-model-neo4j)
5. [Core Routing Algorithm](#5-core-routing-algorithm)
6. [Backend Service Layer](#6-backend-service-layer)
7. [API Reference](#7-api-reference)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Real Road Geometry (OSRM)](#9-real-road-geometry-osrm)
10. [Data Flow — End to End](#10-data-flow--end-to-end)
11. [Deployment](#11-deployment)
12. [Key Design Decisions](#12-key-design-decisions)

---

## 1. Project Overview

EcoRoute KAZE is an AQI-aware logistics routing dashboard for Delhi NCR. The core premise mirrors Google Maps' traffic-avoidance behaviour — but instead of routing around congestion, it routes delivery vehicles around neighbourhoods where air quality is dangerously poor (AQI > 400, classified as Hazardous).

The system ingests live CPCB (Central Pollution Control Board) air quality station data, models Delhi NCR as a weighted directed graph in Neo4j, and runs a Cypher `shortestPath` query that treats Hazardous AQI zones like road closures. Routes are recomputed automatically every hour and pushed to all connected browser clients over WebSocket.

**The key innovation:** AQI as a first-class routing constraint, not just an overlay. A neighbourhood with AQI > 400 is removed from the traversable graph entirely — the algorithm finds the shortest safe path around it, or reports that no safe path exists.

---

## 2. Technology Stack

### Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| API framework | FastAPI | 0.115 |
| Runtime | Python | 3.11 |
| ASGI server | Uvicorn | latest |
| Job scheduler | APScheduler | 3.10 |
| Graph database driver | neo4j async driver | 5.23 |
| AI news search | tavily-python | 0.5 |
| HTTP client | httpx | 0.27 |
| Config management | pydantic-settings | latest |

### Database

| Component | Technology |
|-----------|-----------|
| Graph database | Neo4j AuraDB (managed cloud) |
| Connection URI | `neo4j+s://96f11763.databases.neo4j.io` |
| Protocol | Bolt over TLS |

### Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| UI framework | React | 18 |
| Build tool | Vite | 8 |
| Language | TypeScript | 6 |
| State management | Zustand | 5 |
| Data fetching | TanStack Query | 5 |
| Mapping | react-leaflet | 4 |
| Styling | Tailwind CSS | 3 |
| Icons | lucide-react | latest |

### Mapping & External APIs

| Service | Purpose |
|---------|---------|
| Esri World Dark Gray Canvas | Base map tiles |
| OSRM Public API | Real road geometry for route polylines |
| CPCB data.gov.in API | Live AQI station readings |
| Tavily AI Search | Delhi AQI news + spike context |

### Deployment

| Layer | Platform |
|-------|---------|
| Backend | Render (Singapore region, Starter plan) |
| Frontend | Vercel |

---

## 3. System Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React + Vite)                     │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ MapPanel │  │  KpiBar  │  │SidePanel │  │SimulationControl   │ │
│  │(Leaflet) │  │          │  │(4 tabs)  │  │(demo AQI spikes)   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┬──────────┘ │
│       │              │             │                   │            │
│  ┌────▼──────────────▼─────────────▼───────────────────▼──────────┐ │
│  │            Zustand Store (routeStore)                           │ │
│  │   route | nodes | edges | selectedCustomer | events | AQI      │ │
│  └───────────────────────────┬─────────────────────────────────────┘ │
│                              │                                       │
│  ┌──────────────────┐  ┌─────▼────────────────────────────────────┐ │
│  │ TanStack Query   │  │ useRouteWebSocket (auto-reconnect 3s)    │ │
│  │ /api/graph  60s  │  │  ping every 25s → keepalive             │ │
│  │ /api/route  30s  │  │  events: aqi_update / pong / aqi_reset  │ │
│  │ /health     10s  │  └──────────────────────────────────────────┘ │
│  └────────┬─────────┘                                               │
└───────────┼─────────────────────────────────────────────────────────┘
            │ HTTPS                                        │ WSS
            ▼                                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI / Render)                         │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  REST Router │  │  WS Manager  │  │ APScheduler  │              │
│  │  /api/*      │  │  /ws/route-  │  │  hourly AQI  │              │
│  │  /health     │  │  updates     │  │  2hr news    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────▼─────────────────▼──────────────────▼─────────────────┐   │
│  │              Service Layer                                    │   │
│  │  route_engine.py  |  aqi_ingestion.py  |  tavily_news.py    │   │
│  └──────────────────────────────┬────────────────────────────────┘   │
│                                 │ Bolt TLS                           │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                    ┌─────────────▼──────────────────┐
                    │    Neo4j AuraDB (Cloud Graph)  │
                    │   Warehouse → Neighborhoods    │
                    │          → Customers           │
                    │   13 AQI nodes, ~43 ROAD edges │
                    └────────────────────────────────┘

            External APIs (outbound from backend)
            ┌──────────────┐  ┌───────────────────┐
            │  CPCB /      │  │  Tavily AI Search │
            │  data.gov.in │  │  (news + context) │
            └──────────────┘  └───────────────────┘

            External APIs (outbound from browser)
            ┌──────────────────────────────────────┐
            │  OSRM router.project-osrm.org        │
            │  Real road geometry for route lines  │
            └──────────────────────────────────────┘
```

---

## 4. Graph Data Model (Neo4j)

### Node Labels

#### `Warehouse` (1 node)
The single dispatch origin for all delivery routes.

| Property | Type | Value |
|----------|------|-------|
| name | String | "Okhla Industrial Estate" |
| lat | Float | 28.5398 |
| lon | Float | 77.2706 |

#### `Customer` (2 nodes)
Delivery destinations that routes must reach.

| name | lat | lon |
|------|-----|-----|
| Connaught Place Delivery | 28.6295 | 77.2205 |
| Rohini Sector 18 Delivery | 28.7293 | 77.1210 |

#### `Neighborhood` (13 nodes)
Delhi NCR areas with live AQI data. Each is a waypoint the routing algorithm can traverse — or avoid.

| Property | Type | Description |
|----------|------|-------------|
| name | String | Human-readable area name |
| lat | Float | Geographic latitude |
| lon | Float | Geographic longitude |
| aqi | Integer | Current AQI (0–999+) |
| aqi_category | String | Good / Satisfactory / Moderate / Poor / Very Poor / Hazardous |
| aqi_hex | String | CSS hex colour for map rendering |
| station | String | Mapped CPCB monitoring station name |
| last_updated | DateTime | Timestamp of last AQI sync |

### Relationship Type

#### `ROAD`
Directed edge representing a traversable road segment between two nodes (Warehouse, Neighborhood, or Customer). Bidirectional roads are modelled as two directed edges.

| Property | Type | Description |
|----------|------|-------------|
| distance | Float | Road segment length in kilometres |

**Total seed data:** ~43 ROAD relationships (bidirectional pairs for each physical road).

### Schema Constraints and Indexes

```cypher
-- Uniqueness constraints (idempotent, IF NOT EXISTS)
CREATE CONSTRAINT IF NOT EXISTS FOR (w:Warehouse) REQUIRE w.name IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (c:Customer)  REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS FOR (n:Neighborhood) REQUIRE n.name IS UNIQUE;

-- Range index for AQI-filtered path queries
CREATE INDEX IF NOT EXISTS FOR (n:Neighborhood) ON (n.aqi);

-- Index for CPCB station name lookups during sync
CREATE INDEX IF NOT EXISTS FOR (n:Neighborhood) ON (n.station);
```

### Graph Topology (ASCII)

```
OKHLA WAREHOUSE
      │
      ├──[ROAD]──► Okhla Phase II ──[ROAD]──► Sarita Vihar
      │                  │
      │                  └──[ROAD]──► Jasola ──[ROAD]──► Ashram
      │                                              │
      ├──[ROAD]──► Anand Vihar ◄──[ROAD]──── ITO ◄──┘
      │                  │
      │            [ROAD]├──[ROAD]──► Lodhi Road
      │                  │
      │             Naraina ──[ROAD]──► Punjabi Bagh
      │                                      │
      │                               [ROAD] └──► Rohini
      │                                                │
      │                                    [ROAD] ────► ROHINI CUSTOMER
      │
      └──[ROAD]──► Dwarka ──[ROAD]──► Janakpuri
                               │
                        [ROAD] └──► CP ──► CONNAUGHT PLACE CUSTOMER
```

*(Simplified; actual graph has 13 neighborhood nodes with multiple cross-connections.)*

---

## 5. Core Routing Algorithm

### Primary Route Query

```cypher
MATCH (warehouse:Warehouse), (customer:Customer {name: $customer_name})
MATCH p = shortestPath((warehouse)-[:ROAD*..15]-(customer))
WHERE all(n IN nodes(p)
          WHERE n.aqi <= 400
             OR n:Warehouse
             OR n:Customer)
WITH p,
     reduce(dist = 0, r IN relationships(p) | dist + r.distance) AS total_km,
     [x IN nodes(p) | {
         name: x.name,
         lat:  x.lat,
         lon:  x.lon,
         aqi:  x.aqi,
         category: x.aqi_category,
         hex:  x.aqi_hex,
         type: labels(x)[0]
     }] AS waypoints
RETURN
    waypoints,
    total_km,
    length(p)                                                    AS hops,
    [x IN nodes(p) WHERE x:Neighborhood AND x.aqi > 300 | x.name] AS high_risk_zones
ORDER BY total_km ASC
LIMIT 1;
```

**How it works:**

1. `shortestPath` finds the minimum-hop path through the graph (Dijkstra on hop count, not distance).
2. The `WHERE all(n IN nodes(p) ...)` clause is the AQI filter — it rejects any path that passes through a Neighborhood with AQI > 400. Warehouse and Customer nodes are always allowed (they cannot be avoided).
3. `reduce(dist = 0, r IN relationships(p) | dist + r.distance)` computes actual road distance in km across the path's edges.
4. `high_risk_zones` flags neighborhoods with AQI > 300 even on the chosen route (for the warning UI).
5. **No GDS plugin required.** Pure Cypher on standard Neo4j AuraDB.

### Alternative Route Query

```cypher
MATCH (warehouse:Warehouse), (customer:Customer {name: $customer_name})
MATCH p = shortestPath((warehouse)-[:ROAD*..10]-(customer))
WHERE all(n IN nodes(p)
          WHERE n.aqi <= 400
             OR n:Warehouse
             OR n:Customer)
  AND NOT [x IN nodes(p) | x.name] = $primary_names
WITH p,
     reduce(dist = 0, r IN relationships(p) | dist + r.distance) AS total_km,
     [x IN nodes(p) | x.name] AS node_names
RETURN p, total_km, node_names
ORDER BY total_km ASC
LIMIT 1;
```

`$primary_names` is the list of node names from the primary route. The `NOT ... = $primary_names` condition forces a structurally distinct path.

### No-Safe-Route Case

When all traversable paths to a customer are blocked by Hazardous zones (AQI > 400), the query returns no rows. The backend detects this and returns:

```json
{ "status": "no_safe_route" }
```

The frontend renders a red alert in the SidePanel and disables the route polyline on the map.

### AQI Category Reference

| Category | AQI Range | Routing Treatment |
|----------|-----------|------------------|
| Good | 0–50 | Fully traversable |
| Satisfactory | 51–100 | Fully traversable |
| Moderate | 101–200 | Fully traversable |
| Poor | 201–300 | Traversable (flagged as high-risk) |
| Very Poor | 301–400 | Traversable (flagged as high-risk) |
| Hazardous | 401+ | **Blocked — excluded from all paths** |

---

## 6. Backend Service Layer

### File Structure

```
backend/
├── main.py                    # FastAPI app, lifespan, CORS, router mounts
├── config.py                  # pydantic-settings BaseSettings, .env reader
├── scheduler.py               # APScheduler jobs (AQI sync, news refresh)
├── database/
│   ├── neo4j_client.py        # Async driver singleton, session() context manager
│   └── schema.py              # Idempotent constraint/index bootstrap
├── seed/
│   └── delhi_graph.py         # MERGE-based seed: nodes + ROAD edges
├── services/
│   ├── route_engine.py        # Cypher query functions
│   ├── aqi_ingestion.py       # CPCB fetch, bulk Neo4j update
│   ├── graph_mapper.py        # CPCB station name → graph node name dict
│   └── tavily_news.py         # AI news + spike context
└── websocket/
    └── manager.py             # ConnectionManager, broadcast()
```

### `main.py` — Application Entry Point

FastAPI app with a `lifespan` async context manager that controls the full startup/shutdown sequence:

**Startup sequence:**
1. Connect Neo4j driver (`neo4j_client.init()`)
2. Bootstrap schema constraints and indexes (`schema.bootstrap()`)
3. Seed graph if empty (`delhi_graph.seed_if_empty()`)
4. Warm Tavily news cache (`tavily_news.warm_cache()`)
5. Start APScheduler (`scheduler.start()`)

**Shutdown sequence:**
1. Stop APScheduler (`scheduler.shutdown()`)
2. Close Neo4j driver (`neo4j_client.close()`)

**CORS:** `allow_origins=["*"]` — open for hackathon; tighten for production.

**WebSocket endpoint:** `/ws/route-updates` — upgrades HTTP to WebSocket, registers connection with `ConnectionManager`, enters ping/pong keepalive loop.

### `config.py` — Settings

```python
class Settings(BaseSettings):
    NEO4J_URI:       str  # neo4j+s://96f11763.databases.neo4j.io
    NEO4J_USER:      str  # "neo4j"
    NEO4J_PASSWORD:  str
    NEO4J_DATABASE:  str  # "neo4j"
    CPCB_API_KEY:    str
    TAVILY_API_KEY:  str
    CORS_ORIGINS:    list[str]
    LOG_LEVEL:       str  # "INFO"

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings: ...
```

Singleton via `@lru_cache` — safe to call from any module.

### `database/neo4j_client.py` — Driver Singleton

```python
driver = AsyncGraphDatabase.driver(
    uri,
    auth=(user, password),
    max_connection_pool_size=20,
    connection_timeout=30,
)

@asynccontextmanager
async def session():
    async with driver.session(database=database) as s:
        yield s
```

Pool size 20 handles concurrent requests without exhausting AuraDB connections. All Cypher execution goes through this context manager.

### `database/schema.py` — Idempotent Bootstrap

Runs on every startup using `IF NOT EXISTS`. Safe against re-runs on already-populated databases. Creates:
- 3 UNIQUE constraints (Warehouse.name, Customer.name, Neighborhood.name)
- 1 Range index on Neighborhood.aqi
- 1 Index on Neighborhood.station

### `seed/delhi_graph.py` — Graph Seeding

Uses `MERGE` (not `CREATE`) — entirely idempotent. Before seeding, counts existing Neighborhood nodes; if count >= 13, skips seeding. Seeds:
- 1 Warehouse node
- 2 Customer nodes
- 13 Neighborhood nodes (with initial AQI values)
- ~43 ROAD relationships (pairs of directed edges)

### `services/route_engine.py` — Query Functions

| Function | Description |
|----------|-------------|
| `compute_route(customer_name)` | Runs PRIMARY_ROUTE_QUERY, parses result into `RouteResult` dataclass. Returns `None` if no safe path. |
| `get_all_nodes()` | Returns all Warehouse, Customer, Neighborhood nodes with properties. |
| `get_all_edges()` | Returns all ROAD relationships with start/end node names and distance. |
| `get_graph_data()` | Combines nodes + edges into a single response dict. |
| `_get_severe_nodes()` | Returns Neighborhood nodes with AQI > 400 (for broadcast payloads). |

### `services/aqi_ingestion.py` — CPCB Sync

**Fetch:** HTTP GET to `data.gov.in` CPCB API with `CPCB_API_KEY`. Returns pollutant readings per station.

**Processing:**
1. Group readings by station name.
2. For each station, compute AQI = max sub-index across pollutants (PM2.5, PM10, NO2, O3, CO, SO2).
3. Map station name to graph node name via `graph_mapper.STATION_MAP`.
4. Build list of `{node_name, aqi}` pairs.

**Neo4j update (bulk UNWIND):**
```cypher
UNWIND $updates AS u
MATCH (n:Neighborhood {name: u.name})
SET n.aqi = u.aqi,
    n.aqi_category = u.category,
    n.aqi_hex = u.hex,
    n.last_updated = datetime()
```

**Cache:** `_real_aqi_cache: dict[str, int]` stores the last real CPCB AQI per node. Used by `POST /api/aqi/reset` to restore nodes after simulation spikes.

### `services/graph_mapper.py` — Station Name Mapping

Static dict translating verbose CPCB station names to the short graph node names used in the seed data. Example:

```python
STATION_MAP = {
    "Anand Vihar, Delhi - DPCC":      "Anand Vihar",
    "ITO, Delhi - DPCC":              "ITO",
    "Punjabi Bagh, Delhi - DPCC":     "Punjabi Bagh",
    "Dwarka-Sector 8, Delhi - IMD":   "Dwarka",
    # ... 13 entries total
}
```

Unmapped stations are ignored during sync.

### `services/tavily_news.py` — AI News Integration

**`fetch_delhi_aqi_news()`:** Searches Tavily for "Delhi AQI air quality today" — returns:
- `summary`: AI-generated paragraph summarizing current air quality situation
- `articles`: List of `{title, url, published_date, snippet}` objects
- Cached for 2 hours (refreshed by APScheduler `news_refresh` job)

**`fetch_spike_context(neighborhood, aqi)`:** On-demand search triggered after a simulation spike. Queries "Why is AQI high in {neighborhood} Delhi {current_month}" — returns an AI-generated explanation (industrial activity, meteorology, traffic patterns). Used to populate the SimulationControl context card.

### `scheduler.py` — Background Jobs

```python
scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

scheduler.add_job(
    hourly_aqi_sync,
    trigger="interval",
    minutes=60,
    id="aqi_sync",
)

scheduler.add_job(
    news_refresh,
    trigger="interval",
    hours=2,
    id="news_refresh",
)
```

**`hourly_aqi_sync` pipeline:**
1. `aqi_ingestion.sync()` — fetch CPCB, update Neo4j
2. `route_engine.compute_route()` for each customer
3. `manager.broadcast({"event": "aqi_sync", "routes": ..., "nodes": ...})`

### `websocket/manager.py` — Connection Manager

```python
class ConnectionManager:
    def __init__(self):
        self.active: set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)

    async def broadcast(self, payload: dict):
        dead = set()
        for ws in self.active:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.add(ws)
        self.active -= dead

manager = ConnectionManager()  # module-level singleton
```

Dead connections are silently removed from the active set during broadcast — no retry, no error propagation.

---

## 7. API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service status, last AQI sync timestamp, active WS client count |
| GET | `/api/route` | AQI-constrained route for `?customer=<name>` |
| GET | `/api/graph` | All nodes + edges for initial map render |
| GET | `/api/aqi/live` | All neighborhood AQI values (for KPI bar + AQI grid) |
| POST | `/api/aqi/sync` | Manual trigger: fetch CPCB, update Neo4j, broadcast WS |
| POST | `/api/aqi/simulate` | Spike a neighborhood AQI for demo (`{node, aqi}`) |
| POST | `/api/aqi/reset` | Restore a neighborhood to its last real CPCB AQI |
| GET | `/api/news` | Cached Tavily AQI news feed |
| WS | `/ws/route-updates` | WebSocket: broadcasts on AQI change / hourly sync |

### Response Shapes

**`GET /api/route`**

```json
{
  "status": "ok",
  "customer": "Connaught Place Delivery",
  "route": {
    "waypoints": [
      { "name": "Okhla Industrial Estate", "lat": 28.5398, "lon": 77.2706, "aqi": 180, "category": "Moderate", "hex": "#FF7E00", "type": "Warehouse" },
      { "name": "Sarita Vihar",            "lat": 28.5529, "lon": 77.2839, "aqi": 210, "category": "Poor",     "hex": "#FF0000", "type": "Neighborhood" }
    ],
    "total_km": 14.2,
    "hops": 5,
    "high_risk_zones": ["Anand Vihar"]
  },
  "alt_route": { "waypoints": [...], "total_km": 17.8 }
}
```

**`GET /api/graph`**

```json
{
  "nodes": [
    { "id": "Okhla Industrial Estate", "type": "Warehouse", "lat": 28.5398, "lon": 77.2706, "aqi": null }
  ],
  "edges": [
    { "source": "Okhla Industrial Estate", "target": "Sarita Vihar", "distance": 2.4 }
  ]
}
```

**`POST /api/aqi/simulate`**

```json
{ "node": "Anand Vihar", "aqi": 480 }
```

Returns updated route + Tavily spike context.

### WebSocket Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| `aqi_update` | Manual simulate/reset | `{event, node_name, aqi, routes}` |
| `aqi_sync` | Hourly scheduler | `{event, timestamp, routes, nodes}` |
| `aqi_reset` | POST /api/aqi/reset | `{event, node_name, aqi}` |
| `pong` | Client ping | `{event: "pong"}` |

---

## 8. Frontend Architecture

### Component Hierarchy

```
App.tsx
├── Header.tsx               — Brand, AQI legend, WS live indicator
├── KpiBar.tsx               — 4-cell KPI strip
│   ├── Active Mission card  — distance, hops, customer switcher
│   ├── Delhi Mean AQI card
│   ├── Safety Clearance card
│   └── Chokepoint Watch card
├── MapPanel.tsx             — Leaflet map, route + AQI visualization
│   ├── TileLayer (Esri dark gray)
│   ├── Polyline (graph edge overlay, dashed white)
│   ├── Polyline (alt route, purple dashed)
│   ├── Polyline (primary route glow — thick cyan)
│   ├── Polyline (primary route core — white)
│   └── NodeCircle × N      — AQI circle, pulse ring, popup, tooltip
└── SidePanel.tsx            — 4-tab panel
    ├── Route tab            — waypoints, stats, alt route, avoided zones
    ├── AQI Grid tab         — all neighborhoods sorted by AQI
    ├── Events tab           — dispatch audit log
    └── News tab             → NewsPanel.tsx (Tavily feed)
        └── SimulationControl.tsx — demo AQI spike engine
```

### `src/store/routeStore.ts` — Zustand State

```typescript
interface RouteStore {
  // State
  route:            RouteResult | null;
  nodes:            GraphNode[];
  edges:            GraphEdge[];
  liveConnected:    boolean;
  selectedCustomer: string;
  events:           EventLogEntry[];

  // Actions
  setRoute:          (r: RouteResult | null) => void;
  setNodes:          (n: GraphNode[]) => void;
  setEdges:          (e: GraphEdge[]) => void;
  setLiveConnected:  (b: boolean) => void;
  setSelectedCustomer: (c: string) => void;
  appendEvent:       (e: EventLogEntry) => void;
  updateNodeAqi:     (name: string, aqi: number, category: string, hex: string) => void;
}
```

**Pre-seeded initial state:** `INITIAL_NODES`, `INITIAL_EDGES`, and `INITIAL_ROUTE` are hardcoded into the store module with the seed data coordinates and nominal AQI values. This ensures the map renders immediately when the page loads — before the first API response arrives. There is no blank-map flash.

### `src/App.tsx` — Query Orchestration

Three TanStack Query instances run in parallel:

```typescript
// Graph topology — infrequent changes
const { data: graphData } = useQuery({
  queryKey: ["graph"],
  queryFn: () => api.fetchGraph(),
  refetchInterval: 60_000,
});

// Route for selected customer — re-keyed on customer change
const { data: routeData } = useQuery({
  queryKey: ["route", selectedCustomer],
  queryFn: () => api.fetchRoute(selectedCustomer),
  refetchInterval: 30_000,
});

// Health / WS status
const { data: healthData } = useQuery({
  queryKey: ["health"],
  queryFn: () => api.fetchHealth(),
  refetchInterval: 10_000,
});
```

`useEffect` hooks sync query results into the Zustand store when they arrive. Query results never flow directly to components — everything reads from the store, so WS updates and poll updates share one source of truth.

### `src/hooks/useRouteWebSocket.ts` — Live Updates

```
Browser                          Backend
  │                                │
  ├──── WebSocket connect ────────►│
  │                                │
  ├──── ping (every 25s) ─────────►│
  │◄─── pong ───────────────────── │
  │                                │
  │  [CPCB sync fires on backend]  │
  │◄─── aqi_sync event ─────────── │
  │  updateNodeAqi × N             │
  │  setRoute(newRoute)            │
  │  appendEvent(...)              │
  │                                │
  [connection drops]               │
  │  3s timeout                    │
  ├──── reconnect ────────────────►│
```

Auto-reconnect: on `onclose` / `onerror`, a 3-second timeout triggers a new `WebSocket()` call. Reconnect attempts are not capped — the hook stays persistent for the page lifetime.

### `src/components/MapPanel.tsx` — Map Rendering

**OSRM road geometry fetch:** When `route.waypoints` changes, the component builds an OSRM URL from the waypoint coordinates and fetches real road geometry:

```typescript
const url = `https://router.project-osrm.org/route/v1/driving/
  ${waypoints.map(w => `${w.lon},${w.lat}`).join(";")
}?overview=full&geometries=geojson`;

// 6-second timeout via AbortController
// On success: use GeoJSON LineString coordinates
// On failure/timeout: fall back to straight-line [lat, lon] segments
```

GeoJSON coordinates are `[lon, lat]` — flipped to `[lat, lon]` for Leaflet before rendering.

**Layer rendering order (bottom to top):**
1. Esri dark gray base tiles
2. Graph edge overlay (all ROAD edges, thin white dashed)
3. Alternative route polyline (purple dashed, 3px)
4. Primary route glow (cyan, 8px, opacity 0.4)
5. Primary route core (white, 3px)
6. AQI circles for all nodes (color-coded by `aqi_hex`)
7. Pulse rings on Hazardous nodes (animated CSS ring)

**`NodeCircle` subcomponent:**
- Renders a `CircleMarker` sized by node type (Warehouse > Customer > Neighborhood)
- Severe AQI nodes (> 300) get an additional larger `CircleMarker` with low opacity for a pulsing ring effect
- Click opens a Leaflet `Popup` with: name, AQI value, category, last updated
- Warehouse and Customer nodes have `permanent={true}` tooltips showing their label

### `src/components/KpiBar.tsx`

| Cell | Data Source | Update Frequency |
|------|-------------|-----------------|
| Active Mission | Zustand route | WS push / 30s poll |
| Delhi Mean AQI | Zustand nodes (mean) | WS push / 60s poll |
| Safety Clearance | % nodes AQI ≤ 400 | WS push / 60s poll |
| Chokepoint Watch | Count AQI > 400 nodes | WS push / 60s poll |

Customer switcher buttons in the Active Mission cell dispatch `setSelectedCustomer` to the store, which invalidates the route query key, triggering an immediate refetch.

### `src/components/SimulationControl.tsx` — Demo Engine

1. Select a neighborhood from dropdown (populated from store nodes)
2. Set target AQI with a range slider (50–999)
3. "Spike AQI" button → `POST /api/aqi/simulate {node, aqi}`
4. Backend responds with updated route + triggers WS broadcast
5. Component fetches Tavily spike context and displays AI explanation card
6. "Reset" button → `POST /api/aqi/reset {node}` → restores real CPCB AQI

### `src/api.ts` — API URL Resolution

```typescript
const API_BASE = import.meta.env.VITE_API_URL
  ?? (window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : "https://ecoroute-backend.onrender.com");

export const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws/route-updates";
```

All endpoint URL builders are exported from this file: `routeUrl(customer)`, `graphUrl()`, `simulateUrl()`, etc.

---

## 9. Real Road Geometry (OSRM)

### Why OSRM?

Without OSRM, route polylines would be straight crow-flies lines between waypoints. Delhi's road network has major detours around expressways, ring roads, and flyovers. Real road geometry makes routes immediately credible to judges and users.

### Request Format

```
GET https://router.project-osrm.org/route/v1/driving/
    77.2706,28.5398;77.2839,28.5529;77.2205,28.6295
    ?overview=full&geometries=geojson
```

- Coordinates are `longitude,latitude` (GeoJSON convention)
- `overview=full` returns the complete road geometry (not simplified)
- `geometries=geojson` returns a GeoJSON LineString

### Response Processing

```typescript
const coords: [number, number][] = response.routes[0].geometry.coordinates
  .map(([lon, lat]) => [lat, lon]);  // flip for Leaflet
```

### Fallback

If OSRM times out (6s AbortController) or returns an error, the component falls back to straight-line segments between waypoint coordinates. The route is still drawn — degraded geometry, not a blank map.

---

## 10. Data Flow — End to End

### Scenario A: Initial Page Load

```
1. Browser loads React bundle from Vercel CDN
2. Zustand store initialises with INITIAL_NODES + INITIAL_EDGES + INITIAL_ROUTE
   → Map renders immediately (no blank flash)
3. TanStack Query fires:
   → GET /api/graph    (60s interval)
   → GET /api/route    (30s interval, keyed by selectedCustomer)
   → GET /health       (10s interval)
4. useRouteWebSocket connects to wss://backend/ws/route-updates
5. API responses arrive → useEffect updates Zustand store
   → MapPanel re-renders with live data
6. MapPanel fetches OSRM geometry for route waypoints
   → Real road polyline replaces initial straight-line fallback
```

### Scenario B: Hourly AQI Sync (Background)

```
1. APScheduler fires hourly_aqi_sync (IST timezone)
2. aqi_ingestion.sync():
   → HTTP GET data.gov.in CPCB API
   → Group by station, compute AQI = max sub-index
   → UNWIND bulk UPDATE in Neo4j (SET aqi, category, hex, last_updated)
3. route_engine.compute_route() for each customer
   → Re-runs shortestPath Cypher with updated AQI values
4. manager.broadcast({event: "aqi_sync", timestamp, routes, nodes})
5. All connected browsers receive WS message:
   → updateNodeAqi() for each changed node
   → setRoute() with new route
   → appendEvent() to audit log
   → MapPanel re-renders: new route polyline + updated AQI circles
```

### Scenario C: Demo Simulation

```
1. User selects neighborhood + target AQI in SimulationControl
2. POST /api/aqi/simulate {node: "Anand Vihar", aqi: 480}
3. Backend:
   → SET n.aqi = 480 in Neo4j (marks node as Hazardous)
   → compute_route() — Anand Vihar now excluded from all paths
   → manager.broadcast({event: "aqi_update", ...new_route})
   → fetch_spike_context("Anand Vihar", 480) from Tavily
4. WS message arrives in browser:
   → Anand Vihar circle turns Hazardous red on map
   → Route polyline reroutes around Anand Vihar
   → SidePanel shows "Avoided Zones: [Anand Vihar]"
5. Tavily context card renders AI explanation of the spike
6. User clicks Reset:
   → POST /api/aqi/reset {node: "Anand Vihar"}
   → Backend restores _real_aqi_cache value to Neo4j
   → WS broadcast restores node + recalculates route
```

---

## 11. Deployment

### Backend — Render (`render.yaml`)

```yaml
services:
  - type: web
    name: ecoroute-backend
    runtime: python
    region: singapore
    plan: starter
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
    healthCheckPath: /health
    envVars:
      - key: NEO4J_URI
        sync: false
      - key: NEO4J_PASSWORD
        sync: false
      - key: TAVILY_API_KEY
        sync: false
      - key: CPCB_API_KEY
        sync: false
```

**Workers: 1** — Required because APScheduler and the WebSocket ConnectionManager are in-process state. Multiple workers would create separate scheduler instances and separate WS broadcast sets.

**Singapore region** — Lowest latency to Neo4j AuraDB (AuraDB instance is also Singapore-region).

### Frontend — Vercel (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

SPA rewrite ensures React Router handles all client-side paths. Build output directory: `frontend/dist`. `VITE_API_URL` environment variable set to the Render backend URL in Vercel project settings.

### Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `NEO4J_URI` | backend | AuraDB connection URI |
| `NEO4J_USER` | backend | AuraDB username |
| `NEO4J_PASSWORD` | backend | AuraDB password |
| `NEO4J_DATABASE` | backend | Database name (default: `neo4j`) |
| `CPCB_API_KEY` | backend | data.gov.in API key |
| `TAVILY_API_KEY` | backend | Tavily search API key |
| `VITE_API_URL` | frontend (build time) | Backend base URL for API calls |

---

## 12. Key Design Decisions

### Why Neo4j for Routing?

The problem maps directly to a graph: nodes are locations, edges are roads, and the routing objective is a constrained shortest path. Neo4j's Cypher `shortestPath` with a `WHERE all(...)` filter clause expresses this naturally in a single declarative query — no procedural path-search code, no GDS plugin, no external routing engine. The graph model also makes AQI updates trivial: update a node property, re-run the query.

### Why Not GDS (Graph Data Science)?

GDS's Dijkstra algorithm supports node property filtering but requires the GDS plugin and a more complex setup. The `shortestPath` + `WHERE all(...)` pattern is available on standard Neo4j AuraDB without any plugins, which is critical for a hackathon deployment where managed cloud databases are the norm.

### Why Pre-seed the Frontend Store?

Network latency to the Render backend (Singapore) from a Delhi browser can be 200–400ms. Seeding the Zustand store with hardcoded initial data means the map renders immediately with placeholder data, and updates seamlessly when the real API response arrives. This avoids the common pattern of a blank or loading-spinner map on first load.

### Why One Backend Worker?

APScheduler runs in the same process as the FastAPI app and uses `AsyncIOScheduler` — it shares the same event loop. The WebSocket `ConnectionManager` is a module-level singleton holding active connections in memory. Multiple Uvicorn workers would each have their own event loop and their own `manager` instance. A WS message broadcast by worker A would not reach clients connected to worker B. A single worker avoids this entirely for the hackathon scope. Production scale would use a Redis pub/sub broadcast layer.

### Why OSRM Public API?

OSRM's public instance (`router.project-osrm.org`) is free, requires no API key, and returns accurate Delhi road geometry. The 6-second timeout + straight-line fallback ensures the map never hangs waiting for road geometry. For production, a self-hosted OSRM instance or the Mapbox Directions API would be more appropriate.

### AQI as a Road Closure

The conceptual insight that makes the system work: instead of computing AQI as a penalty weight on edges (which complicates the query and the UX explanation), hazardous AQI is modelled as a binary exclusion — the node does not exist for routing purposes. This makes the `shortestPath` query simple, the UI easy to explain ("routes around red zones"), and the demo dramatic (spike a node's AQI, watch the route visibly reroute around it).

---

*This document describes EcoRoute KAZE as built for the PS-1A Neo4j Hackathon, Delhi 2024.*
*Backend: Render (Singapore) | Frontend: Vercel | Database: Neo4j AuraDB*
