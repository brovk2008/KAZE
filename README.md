<div align="center">
  <img src="Logo.png" alt="KAZE — EcoRoute" width="200" />

  <h1>EcoRoute — KAZE</h1>
  <h3>AQI-Aware Logistics Routing for Delhi NCR</h3>
  <p><em>Google Maps, but the third dimension is air quality.</em></p>

  <p>
    <img src="https://img.shields.io/badge/Neo4j-AuraDB%205.23-00857E?style=for-the-badge&logo=neo4j&logoColor=white" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Deployed-Render%20%2B%20Vercel-black?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Data-CPCB%20live%20AQI-FF6B6B?style=for-the-badge" />
    <img src="https://img.shields.io/badge/PS--1A-Neo4j%20Hackathon-00857E?style=for-the-badge" />
  </p>

  <br />

  <p>
    <strong>Backend API (Live):</strong>
    <a href="https://ecoroute-api-fg15.onrender.com/health">https://ecoroute-api-fg15.onrender.com</a>
  </p>
  <p>
    <strong>Frontend Dashboard (Live):</strong>
    <a href="https://kaze-igniteroom-coral.vercel.app">https://kaze-igniteroom-coral.vercel.app</a>
  </p>
</div>

---

## Table of Contents

1. [The Idea](#1-the-idea)
2. [Why This Matters](#2-why-this-matters)
3. [Live Demo — What You'll See](#3-live-demo--what-youll-see)
4. [Feature List](#4-feature-list)
5. [System Architecture](#5-system-architecture)
6. [The Graph Model](#6-the-graph-model)
7. [The Routing Algorithm](#7-the-routing-algorithm)
8. [Real Road Geometry (OSRM)](#8-real-road-geometry-osrm)
9. [Live AQI Data Pipeline](#9-live-aqi-data-pipeline)
10. [WebSocket Real-Time Updates](#10-websocket-real-time-updates)
11. [Spike Simulation Engine](#11-spike-simulation-engine)
12. [AI News Context (Tavily)](#12-ai-news-context-tavily)
13. [Frontend Architecture](#13-frontend-architecture)
14. [Backend Architecture](#14-backend-architecture)
15. [API Reference](#15-api-reference)
16. [Data Flow — End to End](#16-data-flow--end-to-end)
17. [Project File Structure](#17-project-file-structure)
18. [Local Development Setup](#18-local-development-setup)
19. [Environment Variables](#19-environment-variables)
20. [Deployment Guide](#20-deployment-guide)
21. [Integration Status](#21-integration-status)
22. [Delhi NCR Graph — All Nodes & Roads](#22-delhi-ncr-graph--all-nodes--roads)
23. [AQI Standards (CPCB India)](#23-aqi-standards-cpcb-india)
24. [Design System](#24-design-system)
25. [Known Limitations](#25-known-limitations)
26. [V2 Roadmap](#26-v2-roadmap)
27. [Tech Choices — Why We Picked These](#27-tech-choices--why-we-picked-these)
28. [Team](#28-team)

---

## 1. The Idea

Delhi NCR has some of the worst air quality in the world. When AQI crosses 400 (Hazardous/Severe), breathing the outdoor air for even 30 minutes causes serious respiratory damage. Delivery drivers, postal workers, and logistics personnel spend **hours** on Delhi roads every single day — driving through whichever route is shortest, with no regard for which route exposes them to the least pollution.

**EcoRoute KAZE asks a simple question:** what if your routing engine treated air quality the same way Google Maps treats traffic jams?

Google Maps avoids roads with heavy traffic because they add time. EcoRoute avoids neighborhoods with hazardous AQI because they add **health risk**. A route that takes 3 km more but avoids two severely polluted neighborhoods is, objectively, a better route for the driver's lungs.

The name **KAZE** (風) is Japanese for "wind" — the element that disperses pollution, and the force that routing must work with.

### The Core Analogy

```
Google Maps:  Road A → High Traffic → AVOID
EcoRoute:     Zone A → AQI 450     → AVOID

Google Maps:  Route Distance + ETA + Toll
EcoRoute:     Route Distance + ETA + AQI Exposure Score
```

---

## 2. Why This Matters

### Delhi's Air Quality Crisis (Real Numbers)

| Metric | Value |
|--------|-------|
| Delhi avg AQI (winter) | 300–500 (Very Poor to Severe) |
| Days above AQI 400 annually | 80–120 days |
| Population exposed (Delhi NCR) | 30+ million |
| Outdoor delivery workers in Delhi | ~500,000+ (estimated) |
| Health cost of air pollution (India) | ₹2.5 lakh crore/year |

### The Problem with Current Routing

Every major routing app (Google Maps, Ola Maps, MapmyIndia) optimizes for:
- Shortest distance
- Fastest time
- Toll avoidance (sometimes)

None of them optimize for **pollution exposure**. A delivery driver going from Okhla to Rohini via ITO and Anand Vihar (both frequently AQI 300–400+) could instead go through RK Puram and Shadipur — a slightly longer route with significantly lower AQI exposure.

### Who Benefits

- **Last-mile delivery companies** (Delhivery, Zomato, Swiggy, Amazon, Dunzo)
- **Courier services and postal workers**
- **Healthcare logistics** (medicine delivery in clean-air corridors)
- **School bus routing** (protect children from high-AQI zones)
- **Municipal services** (garbage trucks, water tankers)

---

## 3. Live Demo — What You'll See

Open the dashboard at the live URL. Here is the exact walkthrough:

### Step 1: Instant Map Load
The dashboard loads instantly with a pre-seeded initial state — no waiting spinner. You see:
- Dark Delhi NCR map (Esri World Dark Gray base)
- 13 AQI circles representing CPCB monitoring stations, colored by real air quality
- Warehouse marker (cyan) at Okhla Industrial Estate
- Delivery marker (rose) at Connaught Place
- Route line connecting them

### Step 2: Live Data Resolves (~1–2s)
React Query fetches live data from the backend:
- AQI circles update to real CPCB values
- Route line recalculates via Neo4j shortestPath
- The route line "snaps" to real Delhi streets (OSRM road geometry loads)
- Header shows "WS LIVE" with a green pulse (WebSocket connected)

### Step 3: Explore the Map
- Click any AQI circle → popup with node name, AQI value, category, and route status
- Warehouse and Customer nodes have permanent labels
- Severely polluted zones (AQI > 400) show pulsing red rings
- Dashed white lines show the full road network graph topology

### Step 4: Read the Side Panel
- **Route tab**: current route waypoints, distance, hops, estimated time, alternative path
- **AQI Grid tab**: all 13 neighborhoods ranked by AQI with live progress bars
- **Events tab**: real-time log of syncs, spikes, resets, WS events
- **News tab**: Tavily-curated Delhi AQI news articles

### Step 5: Trigger a Spike Simulation
1. On the Route tab, scroll to "SIMULATE AQI SPIKE"
2. Select "Anand Vihar" from the dropdown (or click the preset button)
3. Set AQI to 487 (already pre-filled)
4. Click **TRIGGER SPIKE**
5. Watch: Anand Vihar circle turns dark red with pulse ring
6. Route instantly rereroutes away from Anand Vihar
7. Events log shows the spike with timestamp
8. Tavily AI panel shows contextual explanation

### Step 6: Switch Customer Destination
- KPI bar top-left: click **Rohini North** button
- Route recalculates for Rohini Sector 18 Delivery
- Map updates to show new path to the north

### Step 7: Reset
- Click **RESET DATA** to restore Anand Vihar to real CPCB AQI
- Route returns to original optimal path

---

## 4. Feature List

### Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| AQI-Constrained Routing | Pure Cypher `shortestPath` with AQI ≤ 400 filter | ✅ Live |
| Alternative Route | Second distinct path for comparison | ✅ Live |
| No-Safe-Route Detection | All paths blocked → manual dispatch alert | ✅ Live |
| Real Road Geometry | OSRM API for actual Delhi street geometry | ✅ Live |
| Live CPCB AQI Sync | Hourly fetch from data.gov.in real sensor data | ✅ Live |
| WebSocket Updates | Route push on any AQI change, < 1s latency | ✅ Live |
| AQI Spike Simulation | Demo engine for real-time rerouting demo | ✅ Live |
| Tavily AI Context | AI explains why a zone is spiking | ✅ Live |
| Customer Switching | Switch delivery destination, route refetches | ✅ Live |
| AQI News Feed | Delhi AQI news curated by Tavily (2hr cache) | ✅ Live |
| Dispatch Audit Log | Timestamped event stream | ✅ Live |
| AQI Grid | All stations ranked by AQI with bars | ✅ Live |
| KPI Bar | Distance, mean AQI, safety clearance, chokepoints | ✅ Live |
| Instant Load | Pre-seeded initial state, no spinner on first render | ✅ Live |

### Map Features

| Feature | Description |
|---------|-------------|
| Dark Gray Base Tiles | Esri World Dark Gray Canvas (no API key needed) |
| AQI Color Circles | 5-tier color scheme matching CPCB standards |
| Severe Zone Rings | Animated pulse rings for AQI > 400 nodes |
| Node Popups | Click to see AQI, category, on-route status |
| Warehouse/Customer Labels | Permanent tooltips with type badges |
| Route Glow Effect | Dual polyline (glow layer + crisp layer) |
| Graph Topology | Dashed white overlay showing all road connections |
| Route Legend | Bottom-left legend showing primary + alt path |
| No-Safe-Route Alert | Red pulsing banner when all routes blocked |

### Technical Features

| Feature | Implementation |
|---------|---------------|
| Async Graph DB | Neo4j AuraDB with async Python driver, pool size 20 |
| Idempotent Schema | Constraints + indexes with `IF NOT EXISTS` |
| Auto-Seed | Graph seeds itself on first startup if empty |
| CORS | Wildcard allow-origins for demo flexibility |
| Health Endpoint | `/health` with Neo4j status + WS client count |
| Interactive API Docs | FastAPI Swagger UI at `/docs` |
| Zero-Config Frontend | VITE_API_URL auto-detected based on hostname |
| Auto-Reconnect WS | 3s reconnect with exponential hint |
| WS Ping/Pong | 25s keepalive to prevent proxy timeouts |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     REACT 18 + VITE 8 APP                        │   │
│  │                                                                    │   │
│  │   ┌─────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│  │   │ Header  │  │    MapPanel     │  │       SidePanel         │  │   │
│  │   │ • Brand │  │ • Leaflet map   │  │ • Route tab             │  │   │
│  │   │ • AQI   │  │ • Esri tiles   │  │ • AQI Grid tab          │  │   │
│  │   │   legend│  │ • AQI circles  │  │ • Events tab            │  │   │
│  │   │ • WS    │  │ • OSRM route   │  │ • News tab              │  │   │
│  │   │   status│  │ • Graph edges  │  │ • SimulationControl     │  │   │
│  │   └─────────┘  └─────────────────┘  └─────────────────────────┘  │   │
│  │                                                                    │   │
│  │   ┌──────────────────────────────────────────────────────────┐   │   │
│  │   │                    KpiBar                                 │   │   │
│  │   │  Active Mission │ Delhi Mean AQI │ Safety │ Chokepoints  │   │   │
│  │   └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                    │   │
│  │   ┌───────────────────┐  ┌───────────────────────────────────┐   │   │
│  │   │  Zustand Store    │  │       TanStack Query              │   │   │
│  │   │  • route          │  │  • GET /api/graph  (60s)          │   │   │
│  │   │  • nodes          │  │  • GET /api/route  (30s)          │   │   │
│  │   │  • edges          │  │  • GET /health     (10s)          │   │   │
│  │   │  • liveConnected  │  └───────────────────────────────────┘   │   │
│  │   │  • selectedCust   │  ┌───────────────────────────────────┐   │   │
│  │   │  • events         │  │   useRouteWebSocket (hook)        │   │   │
│  │   └───────────────────┘  │   • auto-reconnect 3s             │   │   │
│  │                          │   • ping/pong 25s                 │   │   │
│  │                          └───────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────┐                                               │
│  │   OSRM Public API    │ ← MapPanel fetches real road geometry        │
│  │ router.project-osrm  │   for primary + alt routes on change         │
│  │ .org/route/v1/driving│                                               │
│  └──────────────────────┘                                               │
└────────────────────────┬──────────────────────┬────────────────────────┘
                         │   REST (HTTP)         │   WebSocket
                         ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (Render)                             │
│                    Python 3.11 · Uvicorn · Port $PORT                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        REST Routers                               │  │
│  │                                                                    │  │
│  │  /api/route       → route_api.py  → route_engine.py             │  │
│  │  /api/graph       → graph_api.py  → route_engine.py             │  │
│  │  /api/aqi/*       → aqi_api.py    → aqi_ingestion.py            │  │
│  │  /api/news        → news_api.py   → tavily_news.py              │  │
│  │  /health          → main.py                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────┐                       │
│  │          WebSocket Manager                   │                       │
│  │  /ws/route-updates                           │                       │
│  │  • Set[WebSocket] active connections         │                       │
│  │  • broadcast(payload) → JSON to all clients  │                       │
│  └─────────────────────────────────────────────┘                       │
│                                                                          │
│  ┌─────────────────────────────────────────────┐                       │
│  │          APScheduler (IST timezone)          │                       │
│  │  • hourly_aqi_sync    — every 60 minutes     │                       │
│  │  • news_refresh       — every 2 hours        │                       │
│  └─────────────────────────────────────────────┘                       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
              ┌────────────────────┼───────────────────────┐
              ▼                    ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│    Neo4j AuraDB      │  │  data.gov.in CPCB   │  │  Tavily AI API  │
│  neo4j+s://...       │  │  (real Delhi AQI)   │  │  (news + spike  │
│                      │  │                     │  │   context)      │
│  Nodes:              │  │  Fetched hourly:    │  │                 │
│  • 1 Warehouse       │  │  • Station readings │  │  • Search API   │
│  • 2 Customers       │  │  • Pollutant avgs   │  │  • include_     │
│  • 13 Neighborhoods  │  │  • 13 stations      │  │    answer=True  │
│                      │  │    → AQI compute    │  │  • Delhi news   │
│  Edges:              │  │    → Neo4j UNWIND   │  │    domains      │
│  • 43 ROAD rels      │  │                     │  │                 │
│  • shortestPath      │  └─────────────────────┘  └──────────────────┘
│  • AQI filter        │
└─────────────────────┘
```

---

## 6. The Graph Model

### Why a Graph Database?

Routing is a graph problem by nature. Neo4j's Cypher gives us:
- `shortestPath()` built-in with depth limits
- `WHERE all(n IN nodes(p) ...)` — pre-filter paths by node properties before traversal
- No external dependencies — pure Cypher, no GDS plugin required
- Native relationship properties (`distance`) for weighted traversal
- Real-time AQI on every node — the graph is a live, stateful routing map

### Node Labels

**Warehouse** — The dispatch origin. One node.
```
(w:Warehouse {
  name: "Okhla Industrial Estate",
  lat: 28.5398,
  lon: 77.2706,
  aqi: 0
})
```

**Customer** — Delivery destinations. Two nodes.
```
(c:Customer {
  name: "Connaught Place Delivery",
  lat: 28.6295,
  lon: 77.2205,
  aqi: 0
})

(c:Customer {
  name: "Rohini Sector 18 Delivery",
  lat: 28.7293,
  lon: 77.1210,
  aqi: 0
})
```

**Neighborhood** — CPCB-monitored zones. Thirteen nodes.
```
(n:Neighborhood {
  name: "Anand Vihar",
  lat: 28.6469,
  lon: 77.3152,
  aqi: 264,
  aqi_category: "Poor",
  aqi_hex: "#FF9900",
  station: "Anand Vihar, Delhi - DPCC",
  last_updated: datetime()
})
```

### Relationship Type

**ROAD** — A physical road connection with distance.
```
(a)-[:ROAD {distance: 8.4}]->(b)
```

Roads are stored as directed edges. Each bidirectional road = 2 directed `ROAD` relationships (one each way). This allows future asymmetric routing (e.g. one-way roads, wind direction effects on AQI).

### Schema Constraints & Indexes

```cypher
-- Uniqueness constraints (prevent duplicate nodes)
CREATE CONSTRAINT warehouse_name_unique IF NOT EXISTS
  FOR (w:Warehouse) REQUIRE w.name IS UNIQUE;

CREATE CONSTRAINT customer_name_unique IF NOT EXISTS
  FOR (c:Customer) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT neighborhood_name_unique IF NOT EXISTS
  FOR (n:Neighborhood) REQUIRE n.name IS UNIQUE;

-- Performance indexes
CREATE INDEX neighborhood_aqi_range IF NOT EXISTS
  FOR (n:Neighborhood) ON (n.aqi);

CREATE INDEX neighborhood_station IF NOT EXISTS
  FOR (n:Neighborhood) ON (n.station);
```

The AQI range index makes the `WHERE n.aqi <= 400` filter in the routing query blazing fast — Neo4j evaluates it before path expansion.

### Complete Node Inventory

| Node | Type | Lat | Lon | Typical AQI | CPCB Station |
|------|------|-----|-----|-------------|--------------|
| Okhla Industrial Estate | Warehouse | 28.5398 | 77.2706 | — | — |
| Connaught Place Delivery | Customer | 28.6295 | 77.2205 | — | — |
| Rohini Sector 18 Delivery | Customer | 28.7293 | 77.1210 | — | — |
| Okhla Phase 2 | Neighborhood | 28.5280 | 77.2736 | 187 | Okhla Phase-2, DPCC |
| Nehru Nagar | Neighborhood | 28.5673 | 77.2536 | 220 | Nehru Nagar, DPCC |
| ITO | Neighborhood | 28.6328 | 77.2402 | 312 | ITO, DPCC |
| Connaught Place | Neighborhood | 28.6329 | 77.2195 | 195 | Mandir Marg, DPCC |
| RK Puram | Neighborhood | 28.5672 | 77.1878 | 198 | R.K. Puram, DPCC |
| Shadipur | Neighborhood | 28.6540 | 77.1445 | 264 | Shadipur, DPCC |
| Punjabi Bagh | Neighborhood | 28.6681 | 77.1280 | 301 | Punjabi Bagh, DPCC |
| Anand Vihar | Neighborhood | 28.6469 | 77.3152 | 264 | Anand Vihar, DPCC |
| Wazirpur | Neighborhood | 28.6908 | 77.1587 | 342 | Wazirpur, DPCC |
| Jahangirpuri | Neighborhood | 28.7300 | 77.1665 | 388 | Jahangirpuri, DPCC |
| Rohini | Neighborhood | 28.7293 | 77.1210 | 195 | Rohini, DPCC |
| Dwarka Sec 8 | Neighborhood | 28.5823 | 77.0637 | 220 | Dwarka-Sector 8, DPCC |
| Mandir Marg | Neighborhood | 28.6430 | 77.2021 | 178 | Mandir Marg, DPCC |

---

## 7. The Routing Algorithm

### Primary Route — Pure Cypher

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
```

**Line by line:**
1. `MATCH (warehouse:Warehouse)` — find the dispatch origin
2. `MATCH (customer:Customer {name: $customer_name})` — find the target destination
3. `shortestPath((warehouse)-[:ROAD*..15]-(customer))` — find the shortest path using BFS, max 15 hops
4. `WHERE all(n IN nodes(p) WHERE n.aqi <= 400 OR n:Warehouse OR n:Customer)` — **the AQI filter**: every intermediate node must have AQI ≤ 400. Warehouse and Customer nodes are always allowed (their AQI is 0).
5. `reduce(dist = 0, r IN relationships(p) | dist + r.distance)` — sum road distances
6. List comprehension builds the waypoints array for the frontend
7. `ORDER BY total_km ASC LIMIT 1` — among all AQI-safe shortest paths, return the shortest by distance

### Alternative Route

```cypher
MATCH (warehouse:Warehouse), (customer:Customer {name: $customer_name})
MATCH p = (warehouse)-[:ROAD*..10]-(customer)
WHERE all(n IN nodes(p) WHERE n.aqi <= 400 OR n:Warehouse OR n:Customer)
  AND NOT [x IN nodes(p) | x.name] = $primary_names
WITH p,
     reduce(dist = 0, r IN relationships(p) | dist + r.distance) AS total_km,
     [x IN nodes(p) | {...}] AS waypoints
RETURN waypoints, total_km, length(p) AS hops
ORDER BY total_km ASC
LIMIT 1;
```

The alternative route excludes paths whose exact node sequence matches the primary route, ensuring the user gets a genuinely different corridor.

### No Safe Route

If the `WHERE all(n IN nodes(p) ...)` clause eliminates every path, Neo4j returns zero records. The backend detects this and returns:
```json
{
  "status": "no_safe_route",
  "message": "All routes pass through AQI > 400 zones. Manual dispatch required.",
  "waypoints": [],
  "total_km": 0,
  "hops": 0,
  "avoided": [],
  "high_risk_zones": []
}
```

The frontend renders a full-width red alert overlay and dashes the route line.

### Avoided Zones

After computing the primary route, the backend also queries for all Neighborhood nodes with AQI > 400 that are NOT on the chosen path — these are the "avoided zones" shown as red tags in the side panel.

```cypher
MATCH (n:Neighborhood)
WHERE n.aqi > 400
RETURN n.name AS name
```

---

## 8. Real Road Geometry (OSRM)

### The Problem with Straight Lines

The graph routing gives us **which neighborhoods to pass through**, but connecting them with straight polylines looks unrealistic. A route from Okhla to Connaught Place via Nehru Nagar doesn't go in three straight lines — it follows actual Delhi roads.

### The Solution: OSRM

When the route waypoints update, `MapPanel.tsx` calls the OSRM public routing API:

```
GET https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson
```

Where `{coords}` = waypoints formatted as `lon,lat;lon,lat;lon,lat`.

**Example call for a 5-waypoint route:**
```
https://router.project-osrm.org/route/v1/driving/
  77.2706,28.5398;    ← Okhla Industrial Estate
  77.2736,28.5280;    ← Okhla Phase 2
  77.2402,28.6328;    ← ITO
  77.2195,28.6329;    ← Connaught Place
  77.2205,28.6295     ← Connaught Place Delivery
  ?overview=full&geometries=geojson
```

**Response:**
```json
{
  "routes": [{
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [77.2706, 28.5398],
        [77.2712, 28.5401],
        ... (hundreds of road-following coordinates)
        [77.2205, 28.6295]
      ]
    },
    "distance": 14350,
    "duration": 1820
  }]
}
```

### Implementation Details

```typescript
async function fetchRoadGeometry(waypoints: Waypoint[]): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints.map((w) => [w.lat, w.lon])
  const coords = waypoints.map((w) => `${w.lon},${w.lat}`).join(';')
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(6000) },  // 6-second timeout
    )
    const data = await res.json()
    const geom: [number, number][] = data.routes?.[0]?.geometry?.coordinates ?? []
    if (geom.length === 0) throw new Error('empty')
    return geom.map(([lon, lat]) => [lat, lon])  // OSRM [lon,lat] → Leaflet [lat,lon]
  } catch {
    return waypoints.map((w) => [w.lat, w.lon])  // fallback: straight lines
  }
}
```

Key points:
- OSRM returns coordinates in `[longitude, latitude]` order (GeoJSON standard)
- Leaflet expects `[latitude, longitude]` — we flip them
- 6-second `AbortSignal.timeout` prevents hanging on slow network
- Graceful fallback to straight lines if OSRM is unreachable
- Both primary and alternative routes fetch their own geometry independently
- `useRef` tracks previous waypoint key to skip redundant fetches on re-render

### Why Not Use OSRM for Routing Logic Too?

OSRM routes by time/distance but has no concept of AQI. We'd need to encode AQI as artificial penalties on road segments — complex and lossy. Neo4j's graph model lets us work at the neighborhood level and make hard decisions: a zone above AQI 400 is simply not traversable. Clean, explicit, and explainable.

---

## 9. Live AQI Data Pipeline

### Data Source

India's Central Pollution Control Board (CPCB) publishes real-time AQI readings from monitoring stations across Delhi NCR through [data.gov.in](https://data.gov.in):

```
GET https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69
    ?api-key={CPCB_API_KEY}
    &format=json
    &filters[city]=Delhi
    &limit=100
```

### AQI Computation

The CPCB API returns individual pollutant readings per station, not a combined AQI. We compute it:

```python
def compute_station_aqi(records: list[dict]) -> dict[str, int]:
    """
    Group pollutant sub-indices by station, return max per station.
    CPCB methodology: AQI = max(all pollutant sub-index values).
    Pollutants: PM2.5, PM10, NO2, SO2, CO, O3, NH3.
    """
    station_maxes: dict[str, int] = {}
    for r in records:
        station = r.get("station", "")
        val = int(float(r.get("pollutant_avg") or 0))
        station_maxes[station] = max(station_maxes.get(station, 0), val)
    return station_maxes
```

This matches the official CPCB AQI methodology: the overall AQI for a station is the maximum sub-index across all pollutants.

### Station → Neighborhood Mapping

CPCB station names are verbose and non-canonical:
```
"Anand Vihar, Delhi - DPCC"   →  "Anand Vihar"   (graph node)
"R.K. Puram, Delhi - DPCC"    →  "RK Puram"
"Dwarka-Sector 8, Delhi - DPCC" → "Dwarka Sec 8"
"Okhla Phase-2, Delhi - DPCC"  →  "Okhla Phase 2"
```

The `graph_mapper.py` module maintains this static mapping. On a CPCB sync, only stations that have a mapping entry update the graph.

### Bulk Neo4j Update

After computing station AQIs, we update the graph in a single Cypher transaction:

```cypher
UNWIND $updates AS u
MATCH (n:Neighborhood)
WHERE n.station = u.station OR n.name = u.name
SET n.aqi          = u.aqi,
    n.aqi_category = u.category,
    n.aqi_hex      = u.hex,
    n.last_updated = datetime()
RETURN count(n) AS updated
```

One round trip to Neo4j updates all nodes. The index on `n.station` makes the MATCH fast.

### AQI Cache for Reset

Every successful CPCB sync stores the real AQI values in memory:

```python
_real_aqi_cache: dict[str, dict] = {}
# Example entry:
# {"Anand Vihar": {"aqi": 264, "category": "Poor", "hex": "#FF9900", ...}}
```

When a demo spike is reset, we restore from this cache rather than hitting the CPCB API again.

### Scheduler Jobs

```
APScheduler (IST timezone)
├── hourly_aqi_sync — every 60 minutes
│   ├── sync_aqi_from_cpcb()
│   ├── compute_route()      (recomputes after AQI update)
│   └── manager.broadcast()  (pushes new route to all WS clients)
└── news_refresh — every 2 hours
    └── refresh_news_cache()
```

---

## 10. WebSocket Real-Time Updates

### Architecture

```
Browser (useRouteWebSocket hook)
    │
    ├── WebSocket connects to ws://backend/ws/route-updates
    │
    ├── onopen: setLiveConnected(true), append "connected" event
    │
    ├── onmessage: parse JSON → handle by event type
    │   ├── "aqi_update": updateNodeAqi() + setRoute() + appendEvent() + toast
    │   ├── "aqi_sync":   appendEvent() + toast
    │   ├── "aqi_reset":  appendEvent()
    │   └── "pong":       (ignore — keepalive response)
    │
    ├── onerror: setLiveConnected(false)
    │
    ├── onclose: setLiveConnected(false) + scheduleReconnect(3000ms)
    │
    └── ping interval (25s): send "ping" text → backend replies {"event":"pong"}
```

### WebSocket Message Schema

**AQI Spike Update (from backend after `/api/aqi/simulate`):**
```json
{
  "event": "aqi_update",
  "spiked_node": "Anand Vihar",
  "previous_aqi": 264,
  "new_aqi": 487,
  "route": { ...RouteResult },
  "context": "Anand Vihar often experiences high AQI due to...",
  "timestamp": "2026-09-19T08:30:00Z"
}
```

**Hourly Sync (from APScheduler):**
```json
{
  "event": "aqi_sync",
  "updated_nodes": 11,
  "route": { ...RouteResult },
  "timestamp": "2026-09-19T09:00:00Z"
}
```

**AQI Reset (from `/api/aqi/reset`):**
```json
{
  "event": "aqi_reset",
  "neighborhood": "Anand Vihar",
  "restored_aqi": 264,
  "route": { ...RouteResult },
  "timestamp": "2026-09-19T08:35:00Z"
}
```

### What Updates in Real Time

When a `route` object is received in any WS message:
1. `setRoute(msg.route)` — updates Zustand store
2. MapPanel detects route waypoint change via React state
3. OSRM fetch fires for new road geometry
4. Polylines update on the Leaflet map
5. Side panel Route tab refreshes waypoints and stats
6. KPI bar updates distance, hops, safety status

All of this happens in < 500ms from the moment the spike is triggered.

---

## 11. Spike Simulation Engine

The simulation engine is EcoRoute's killer demo feature — it lets you show real-time rerouting happening live.

### How It Works

1. User selects a neighborhood and sets a target AQI (50–999) in `SimulationControl.tsx`
2. POST to `/api/aqi/simulate`:

```json
POST /api/aqi/simulate
{
  "neighborhood": "Anand Vihar",
  "spike_value": 487
}
```

3. Backend Cypher update:
```cypher
MATCH (n:Neighborhood {name: $name})
WITH n, n.aqi AS prev_aqi
SET n.aqi = $aqi,
    n.aqi_category = $category,
    n.aqi_hex = $hex,
    n.last_updated = datetime()
RETURN n.name AS name, prev_aqi
```

4. Route recomputes: `compute_route()` runs against the updated graph
5. Tavily fetches spike context: `fetch_spike_context("Anand Vihar", 487)`
6. WS broadcast: all connected clients receive updated route + context
7. Frontend: map updates, events log records spike, toast notification fires

### What the Rerouting Looks Like

**Before spike** (AQI 264, "Poor" — traversable):
```
Route: Okhla → Okhla Phase 2 → Nehru Nagar → ITO → Connaught Place → CP Delivery
14.1 km, 4 hops
```

**After spike** (AQI 487 on Anand Vihar — doesn't affect CP route directly):
```
Route: Okhla → Okhla Phase 2 → ITO → Connaught Place → CP Delivery
(depends on which nodes you spike — spike ITO to see major reroute)
```

**Best demo spike:** Spike ITO to AQI 487 → route must avoid ITO and find an alternate path through Mandir Marg instead.

### Preset Neighborhoods

The UI provides one-click presets for historically high-AQI areas:
- **Anand Vihar** — consistently among Delhi's worst (near Ghaziabad border, heavy traffic)
- **Punjabi Bagh** — industrial and traffic-heavy West Delhi
- **Jahangirpuri** — North Delhi, near landfills and industrial zones

### Reset

```json
POST /api/aqi/reset
{ "neighborhood": "Anand Vihar" }
```

Restores from `_real_aqi_cache` (the last CPCB sync value). If no cache exists (first run), falls back to AQI 180 (Moderate).

---

## 12. AI News Context (Tavily)

### What Is Tavily?

Tavily is an AI-powered search API built specifically for LLM/AI applications. Unlike a raw web scraper, it:
- Returns pre-summarized, relevant content
- Provides an `answer` field — a direct AI-generated response to the query
- Filters by domain (we restrict to trusted Indian news sources)
- Understands natural language queries

### News Feed

Every 2 hours, the scheduler fetches Delhi AQI news:

```python
client.search(
    query="Delhi NCR air quality AQI pollution today 2026",
    search_depth="basic",
    max_results=6,
    include_answer=True,
    include_domains=[
        "timesofindia.com", "hindustantimes.com", "thehindu.com",
        "ndtv.com", "indiatoday.in", "iqair.com", "aqi.in"
    ],
)
```

The result is cached in memory and served from `/api/news` — no Tavily charge per dashboard refresh, only per cache refresh.

### Spike Context

When a neighborhood is spiked, Tavily explains why that area typically has high AQI:

```python
client.search(
    query=f"Why is {neighborhood} Delhi AQI high pollution causes {aqi} 2026",
    search_depth="basic",
    max_results=3,
    include_answer=True,
)
```

Example response for Anand Vihar AQI 487:
> "Anand Vihar in East Delhi consistently reports among the highest AQI readings in the city due to its proximity to the Ghaziabad border, heavy truck traffic from the NH-24 corridor, and nearby industrial zones. The area also suffers from vehicular emissions during peak hours and dust from construction activity."

This makes the demo compelling — it explains the real-world context behind the simulated spike.

---

## 13. Frontend Architecture

### Component Tree

```
App.tsx
├── Header.tsx          ← Brand, AQI legend, WS status
├── KpiBar.tsx          ← 4-cell KPI strip, customer switcher
├── MapPanel.tsx        ← Leaflet map, OSRM routes, AQI circles
│   └── NodeCircle      ← AQI circle with popup + tooltip (subcomponent)
├── SidePanel.tsx       ← 4-tab panel
│   ├── SimulationControl.tsx
│   └── NewsPanel.tsx
└── Toaster             ← react-hot-toast overlay
```

### State Management (Zustand)

```typescript
interface RouteStore {
  // Data
  route: RouteResult | null       // Current AQI-safe route from Neo4j
  nodes: GraphNode[]              // All 16 nodes for map rendering
  edges: GraphEdge[]              // All 43 ROAD edges for topology overlay
  events: EventLogEntry[]         // Dispatch audit log

  // UI State
  liveConnected: boolean          // WebSocket connection status
  selectedCustomer: string        // Active delivery target

  // Actions
  setRoute: (r: RouteResult) => void
  setNodes: (n: GraphNode[]) => void
  setEdges: (e: GraphEdge[]) => void
  setLiveConnected: (v: boolean) => void
  setSelectedCustomer: (c: string) => void
  appendEvent: (e: Omit<EventLogEntry, 'id'>) => void
  updateNodeAqi: (name, aqi, category, hex) => void
}
```

**Pre-seeded initial state:** All nodes, edges, and a default route are hardcoded as initial state. This means the map renders **immediately** on page load with a realistic view — the API data then overwrites these values within 1–2 seconds. No loading spinner, no blank map.

### Data Fetching (TanStack Query)

Three polling queries in `App.tsx`:

```typescript
// Graph data — slow changing (nodes + edges for topology)
useQuery({
  queryKey: ['graph'],
  queryFn: () => fetch(API.graph).then(r => r.json()),
  refetchInterval: 60_000,   // every 60 seconds
})

// Route — changes when AQI changes or customer switches
useQuery({
  queryKey: ['route', selectedCustomer],  // selectedCustomer in key → refetch on switch
  queryFn: () => fetch(API.route(selectedCustomer)).then(r => r.json()),
  refetchInterval: 30_000,   // every 30 seconds
})

// Health — lightweight liveness check
useQuery({
  queryKey: ['health'],
  queryFn: () => fetch(API.health).then(r => r.json()),
  refetchInterval: 10_000,   // every 10 seconds
})
```

### URL Auto-Detection

```typescript
const isLocalhost = window.location.hostname === 'localhost'
                 || window.location.hostname === '127.0.0.1'

const API_BASE = import.meta.env.VITE_API_URL
             || (isLocalhost ? 'http://localhost:8000'
                             : 'https://ecoroute-api-fg15.onrender.com')
```

No env file needed for local dev — just run `npm run dev` and it connects to `localhost:8000`.

### TypeScript Types

```typescript
type NodeType = 'warehouse' | 'customer' | 'neighborhood'

interface GraphNode {
  name: string; lat: number; lon: number
  aqi: number; category: string; hex: string
  last_updated: string; type: NodeType
}

interface GraphEdge {
  from_node: string; to_node: string; distance: number
}

interface Waypoint {
  name: string; lat: number; lon: number
  aqi: number; category: string; hex: string; type: NodeType
}

interface RouteResult {
  status: 'ok' | 'no_safe_route' | 'error'
  waypoints: Waypoint[]
  total_km: number; hops: number
  avoided: string[]; high_risk_zones?: string[]
  alternative_waypoints?: Waypoint[]
  alternative_total_km?: number; alternative_hops?: number
}

interface EventLogEntry {
  id?: string
  type: 'spike' | 'sync' | 'reset' | 'info' | 'system'
  time: string; detail: string
}
```

---

## 14. Backend Architecture

### FastAPI App Startup Sequence

```
lifespan(app):
  STARTUP:
  1. neo4j_client.connect()       → verify Neo4j connectivity
  2. bootstrap_schema()           → create constraints + indexes (idempotent)
  3. _seed_if_empty()             → seed 16 nodes + 43 roads if graph empty
  4. refresh_news_cache()         → warm Tavily news cache
  5. scheduler.start()            → start APScheduler (hourly AQI sync + 2hr news)
  → yield (app runs)
  SHUTDOWN:
  6. scheduler.shutdown(wait=False)
  7. neo4j_client.close()
```

### Neo4j Connection Pool

```python
AsyncGraphDatabase.driver(
    uri,
    auth=(user, password),
    max_connection_pool_size=20,     # handles concurrent requests
    connection_acquisition_timeout=30,
    database=database,
)
```

The async driver supports Python's `asyncio` — all Neo4j calls are non-blocking. FastAPI's async routes use `await` throughout, meaning the server can handle many concurrent requests without threads.

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # open for demo; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Pydantic Settings

```python
class Settings(BaseSettings):
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str
    NEO4J_DATABASE: str
    CPCB_API_KEY: str
    TAVILY_API_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"       # ignore unknown env vars (Render injects extras)
```

`@lru_cache` on `get_settings()` ensures the `.env` file is read once and cached for the lifetime of the process.

---

## 15. API Reference

### `GET /health`

Returns service status, Neo4j URI, last AQI sync time, and WebSocket client count.

**Response:**
```json
{
  "status": "ok",
  "service": "EcoRoute API",
  "neo4j": "neo4j+s://96f11763.databases.neo4j.io",
  "last_aqi_sync": "2026-09-19T09:00:00+00:00",
  "websocket_clients": 2,
  "timestamp": "2026-09-19T09:14:32+00:00"
}
```

---

### `GET /api/route`

Computes the AQI-safe shortest path from the warehouse to the customer.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `customer` | string | `"Connaught Place Delivery"` | Customer node name |

**Response (status: ok):**
```json
{
  "status": "ok",
  "waypoints": [
    {"name": "Okhla Industrial Estate", "lat": 28.5398, "lon": 77.2706, "aqi": 0, "category": "N/A", "hex": "#FFFFFF", "type": "warehouse"},
    {"name": "Okhla Phase 2", "lat": 28.528, "lon": 77.2736, "aqi": 187, "category": "Moderate", "hex": "#FFFF00", "type": "neighborhood"},
    {"name": "ITO", "lat": 28.6328, "lon": 77.2402, "aqi": 312, "category": "Very Poor", "hex": "#FF0000", "type": "neighborhood"},
    {"name": "Connaught Place", "lat": 28.6329, "lon": 77.2195, "aqi": 195, "category": "Moderate", "hex": "#FFFF00", "type": "neighborhood"},
    {"name": "Connaught Place Delivery", "lat": 28.6295, "lon": 77.2205, "aqi": 0, "category": "N/A", "hex": "#FFFFFF", "type": "customer"}
  ],
  "total_km": 14.1,
  "hops": 4,
  "avoided": ["Anand Vihar"],
  "high_risk_zones": ["ITO"],
  "alternative_waypoints": [...],
  "alternative_total_km": 15.3,
  "alternative_hops": 4
}
```

**Response (no safe route):**
```json
{
  "status": "no_safe_route",
  "message": "All routes pass through AQI > 400 zones. Manual dispatch required.",
  "waypoints": [],
  "total_km": 0,
  "hops": 0,
  "avoided": [],
  "high_risk_zones": []
}
```

---

### `GET /api/graph`

Returns all nodes and edges for map rendering.

**Response:**
```json
{
  "nodes": [
    {"name": "Okhla Industrial Estate", "lat": 28.5398, "lon": 77.2706, "aqi": 0, "category": "N/A", "hex": "#FFFFFF", "last_updated": "", "type": "warehouse"},
    {"name": "Anand Vihar", "lat": 28.6469, "lon": 77.3152, "aqi": 264, "category": "Poor", "hex": "#FF9900", "last_updated": "2026-09-19T09:06:13", "type": "neighborhood"}
    // ... all 16 nodes
  ],
  "edges": [
    {"from_node": "Okhla Industrial Estate", "to_node": "Okhla Phase 2", "distance": 2.1},
    // ... all 43 edges
  ]
}
```

---

### `GET /api/aqi/live`

Returns all neighborhood AQI values with sync timestamp.

**Response:**
```json
{
  "stations": [/* all nodes */],
  "last_sync": "2026-09-19T09:00:00+00:00",
  "count": 16
}
```

---

### `POST /api/aqi/sync`

Manually triggers a CPCB AQI sync and broadcasts updated route via WebSocket.

**Response:**
```json
{
  "updated": 11,
  "timestamp": "2026-09-19T09:14:32+00:00"
}
```

---

### `POST /api/aqi/simulate`

Simulates an AQI spike on a neighborhood node.

**Request:**
```json
{
  "neighborhood": "Anand Vihar",
  "spike_value": 487
}
```

**Response:**
```json
{
  "success": true,
  "neighborhood": "Anand Vihar",
  "previous_aqi": 264,
  "new_aqi": 487,
  "category": "Severe",
  "route": { ...RouteResult },
  "context": "Anand Vihar often experiences high AQI due to..."
}
```

---

### `POST /api/aqi/reset`

Restores a neighborhood to its cached real CPCB AQI.

**Request:**
```json
{ "neighborhood": "Anand Vihar" }
```

**Response:**
```json
{
  "success": true,
  "restored": {"aqi": 264, "category": "Poor", "hex": "#FF9900"},
  "route": { ...RouteResult }
}
```

---

### `GET /api/news`

Returns cached Delhi AQI news articles from Tavily.

**Response:**
```json
{
  "summary": "Delhi's air quality today remains in the 'Poor' category...",
  "articles": [
    {
      "title": "Delhi AQI worsens as winter approaches",
      "url": "https://timesofindia.com/...",
      "snippet": "Air quality in Delhi NCR dipped...",
      "source": "timesofindia.com",
      "score": 0.932
    }
  ],
  "fetched_at": "2026-09-19T08:00:00+00:00"
}
```

---

### `WebSocket /ws/route-updates`

Persistent WebSocket connection. The server pushes updates when:
- AQI data is synced (hourly)
- A spike is simulated
- A spike is reset

**Client → Server:**
```
ping
```

**Server → Client:**
```json
{"event": "pong"}
```
```json
{"event": "aqi_update", "spiked_node": "...", "previous_aqi": 264, "new_aqi": 487, "route": {...}, "context": "...", "timestamp": "..."}
```
```json
{"event": "aqi_sync", "updated_nodes": 11, "route": {...}, "timestamp": "..."}
```
```json
{"event": "aqi_reset", "neighborhood": "...", "restored_aqi": 264, "route": {...}, "timestamp": "..."}
```

---

## 16. Data Flow — End to End

### Initial Page Load

```
1. Browser opens dashboard
2. React renders immediately with INITIAL_NODES + INITIAL_ROUTE (pre-seeded state)
   → Map shows instantly (no blank screen, no spinner)
3. TanStack Query fires three parallel requests:
   - GET /api/graph    (fetches all nodes + edges)
   - GET /api/route    (computes live route from Neo4j)
   - GET /health       (checks backend + last sync time)
4. useRouteWebSocket hook connects WebSocket
5. App.tsx useEffect: graphData arrives → setNodes() + setEdges()
6. App.tsx useEffect: routeData arrives → setRoute()
7. MapPanel detects route.waypoints change
8. fetchRoadGeometry() fires → OSRM returns real road coordinates
9. Map re-renders: polylines snap to real Delhi streets
10. Header: WebSocket connected → "WS LIVE" indicator goes green
```

### AQI Spike Demo

```
1. User: selects "ITO" in SimulationControl, sets AQI 490, clicks TRIGGER SPIKE
2. Frontend: POST /api/aqi/simulate {"neighborhood":"ITO","spike_value":490}
3. Backend:
   a. Neo4j: SET n.aqi = 490 on ITO node
   b. compute_route() runs → ITO is now AQI > 400 → filtered out of all paths
   c. New route: Okhla → Okhla Phase 2 → Nehru Nagar → Mandir Marg → CP Delivery
   d. fetch_spike_context("ITO", 490) → Tavily returns context string
   e. manager.broadcast({event:"aqi_update", route:newRoute, context:...})
4. Backend HTTP response: {success:true, route:newRoute, context:...}
5. SimulationControl: setRoute(data.route), setContext(data.context)
6. WebSocket: same route arrives at all connected browser tabs
7. Zustand store: route updated
8. MapPanel: new waypoints → OSRM fetch → new road geometry → polyline re-draws
9. ITO circle: color turns dark red (#800000) + pulse ring appears
10. Side panel Route tab: new waypoints list, new distance
11. Events tab: spike event appended with timestamp
12. Tavily context panel appears below simulation controls
13. Toast notification: "⚡ Spiked ITO to AQI 490"
Total time from click to map update: < 800ms (LAN) / < 2s (cloud)
```

### Hourly CPCB Sync

```
1. APScheduler fires hourly_aqi_sync (Asia/Kolkata timezone)
2. sync_aqi_from_cpcb(CPCB_API_KEY):
   a. GET data.gov.in CPCB API → raw pollutant readings
   b. compute_station_aqi() → max pollutant per station
   c. station_to_neighborhood() → map to graph node names
   d. UNWIND bulk Neo4j update → all matched nodes updated in one query
   e. _real_aqi_cache updated
3. compute_route() → recomputes optimal path with new AQI values
4. manager.broadcast({event:"aqi_sync", updated_nodes:N, route:...})
5. All browser tabs: route updates if changed, events log shows "🔄 AQI synced"
6. Toast: "AQI data synced from CPCB"
```

---

## 17. Project File Structure

```
KAZE/
│
├── Logo.png                   ← Project logo
├── README.md                  ← This file
├── ARCHITECTURE.md            ← Deep technical architecture
├── WORKING.md                 ← What's built, what's planned
├── render.yaml                ← Render deployment config
│
├── backend/
│   ├── main.py                ← FastAPI app, lifespan, WebSocket endpoint
│   ├── config.py              ← pydantic-settings, reads .env
│   ├── scheduler.py           ← APScheduler: hourly AQI sync + 2hr news
│   ├── requirements.txt       ← Python dependencies
│   ├── Dockerfile             ← Optional Docker build
│   ├── .env                   ← Local secrets (never committed)
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── neo4j_client.py    ← Async Neo4j driver singleton, pool size 20
│   │   └── schema.py          ← Idempotent constraints + indexes bootstrap
│   │
│   ├── seed/
│   │   ├── __init__.py
│   │   └── delhi_graph.py     ← 1 Warehouse + 2 Customers + 13 Neighborhoods + 43 ROADs
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── route_engine.py    ← shortestPath Cypher, get_all_nodes, get_all_edges
│   │   ├── aqi_ingestion.py   ← CPCB fetch, AQI compute, Neo4j bulk update, cache
│   │   ├── graph_mapper.py    ← CPCB station name → graph node name mapping
│   │   └── tavily_news.py     ← Tavily search: news feed + spike context
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── route_api.py       ← GET /api/route
│   │   ├── aqi_api.py         ← GET /api/aqi/live, POST /simulate, /reset, /sync
│   │   ├── graph_api.py       ← GET /api/graph
│   │   └── news_api.py        ← GET /api/news + news cache manager
│   │
│   └── websocket/
│       ├── __init__.py
│       └── manager.py         ← ConnectionManager, broadcast(), Set[WebSocket]
│
└── frontend/
    ├── index.html             ← Entry HTML, mounts #root
    ├── vite.config.ts         ← Vite config with @vitejs/plugin-react
    ├── tsconfig.json          ← verbatimModuleSyntax, bundler mode
    ├── tailwind.config.js     ← Tailwind v3 config
    ├── postcss.config.js      ← PostCSS + autoprefixer
    ├── package.json           ← npm dependencies
    ├── vercel.json            ← Vercel SPA rewrites
    │
    └── src/
        ├── main.tsx           ← React 18 createRoot entry point
        ├── App.tsx            ← Root layout, TanStack queries, store updates
        ├── api.ts             ← API_BASE detection + URL builders
        ├── types.ts           ← TypeScript interfaces (GraphNode, RouteResult, etc.)
        ├── index.css          ← Obsidian design system, Leaflet overrides, animations
        │
        ├── store/
        │   └── routeStore.ts  ← Zustand store: route, nodes, edges, events, customer
        │
        ├── hooks/
        │   └── useRouteWebSocket.ts  ← WS hook: connect, auto-reconnect, ping, events
        │
        └── components/
            ├── Header.tsx           ← Brand, AQI legend (5 categories), WS indicator
            ├── KpiBar.tsx           ← 4-cell KPI strip, customer switcher buttons
            ├── MapPanel.tsx         ← Leaflet map, OSRM geometry, AQI circles, polylines
            ├── SidePanel.tsx        ← 4-tab panel (Route/AQI/Events/News)
            ├── SimulationControl.tsx ← Spike form: dropdown, AQI input, presets, buttons
            └── NewsPanel.tsx        ← Tavily news: summary + article cards
```

---

## 18. Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- A Neo4j AuraDB account (free tier works)
- CPCB API key from [data.gov.in](https://data.gov.in)
- Tavily API key from [tavily.com](https://tavily.com)

### Backend Setup

```bash
# Clone the repository
git clone <repo-url>
cd "Ignite with Delhi"

# Set up Python virtual environment
cd backend
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (macOS / Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env    # if .env.example exists
# Edit .env with your credentials (see Environment Variables section)

# Start the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend is live at:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health
- **ReDoc**: http://localhost:8000/redoc

### Frontend Setup

```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend is live at: **http://localhost:5173**

The frontend auto-detects `localhost` and connects to `http://localhost:8000` — no env file needed for local dev.

### Running Both Together

```bash
# Terminal 1 — Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173. The map should load immediately with the pre-seeded state, then live data arrives within 1–2 seconds.

### Verify Everything Is Working

```bash
# Test backend health
curl http://localhost:8000/health

# Test route API
curl "http://localhost:8000/api/route?customer=Connaught%20Place%20Delivery"

# Test graph API
curl http://localhost:8000/api/graph | python -m json.tool | head -30

# Test AQI live
curl http://localhost:8000/api/aqi/live

# Test spike simulation
curl -X POST http://localhost:8000/api/aqi/simulate \
  -H "Content-Type: application/json" \
  -d '{"neighborhood":"Anand Vihar","spike_value":487}'

# Reset it
curl -X POST http://localhost:8000/api/aqi/reset \
  -H "Content-Type: application/json" \
  -d '{"neighborhood":"Anand Vihar"}'
```

### Production Build

```bash
# Type-check and build frontend
cd frontend
npm run build

# Preview the production build locally
npm run preview
# → http://localhost:4173
```

---

## 19. Environment Variables

### Backend `.env`

```env
# Neo4j AuraDB connection
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USER=YOUR_INSTANCE_ID
NEO4J_PASSWORD=your-neo4j-password
NEO4J_DATABASE=YOUR_INSTANCE_ID

# CPCB Real-time AQI (data.gov.in)
CPCB_API_KEY=your-data-gov-in-api-key

# Tavily AI Search
TAVILY_API_KEY=tvly-your-tavily-api-key

# CORS — comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app

# Logging
LOG_LEVEL=INFO
```

### Frontend (optional `.env.local`)

```env
# Override API base URL (optional — auto-detected based on hostname)
VITE_API_URL=https://ecoroute-api-fg15.onrender.com
```

The `VITE_API_URL` env var is optional. If not set:
- On `localhost` → uses `http://localhost:8000`
- On any other host → uses `https://ecoroute-api-fg15.onrender.com`

---

## 20. Deployment Guide

### Backend → Render

The `render.yaml` in the repo root configures the Render web service:

```yaml
services:
  - type: web
    name: ecoroute-api
    runtime: python
    region: singapore
    plan: starter
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
    healthCheckPath: /health
    envVars:
      - key: NEO4J_URI
        sync: false         # Set in Render dashboard
      - key: NEO4J_USER
        sync: false
      - key: NEO4J_PASSWORD
        sync: false
      - key: NEO4J_DATABASE
        sync: false
      - key: CPCB_API_KEY
        sync: false
      - key: TAVILY_API_KEY
        sync: false
      - key: PYTHON_VERSION
        value: "3.11.9"
      - key: CORS_ORIGINS
        value: "http://localhost:5173,https://your-app.vercel.app"
```

**Steps:**
1. Connect GitHub repo in Render dashboard
2. Render auto-detects `render.yaml`
3. Set `NEO4J_PASSWORD`, `CPCB_API_KEY`, `TAVILY_API_KEY` as environment variables in the Render dashboard (these are `sync: false` — not in the YAML file)
4. Deploy — Render runs `pip install` then `uvicorn`
5. Verify at `https://your-render-app.onrender.com/health`

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Or connect GitHub repo in Vercel dashboard:
# - Root directory: frontend
# - Build command: npm run build
# - Output directory: dist
# - Environment variable: VITE_API_URL=https://your-render-app.onrender.com
```

**`vercel.json`** (already in frontend/):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

This ensures React Router (if added later) works correctly for client-side routing.

### Update CORS After Deployment

After Vercel assigns a URL, update the Render environment variable:
```
CORS_ORIGINS=http://localhost:5173,https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

---

## 21. Integration Status

| Service | Role | Status | Notes |
|---------|------|--------|-------|
| **Neo4j AuraDB** | Graph DB — nodes, roads, AQI state | ✅ Connected | `neo4j+s://96f11763.databases.neo4j.io` |
| **CPCB / data.gov.in** | Live AQI readings for Delhi NCR | ✅ Connected | Hourly sync via APScheduler |
| **Tavily** | AI news + spike context | ✅ Connected | News cached 2hr; spike context on-demand |
| **OSRM** | Real road geometry for route polylines | ✅ Connected | `router.project-osrm.org` public API |
| **Render** | Backend hosting (FastAPI) | ✅ Live | `https://ecoroute-api-fg15.onrender.com` |
| **Vercel** | Frontend hosting (React + Vite) | ✅ Live | Auto-deploy on git push to master |
| **Esri Tiles** | Map base layer (dark gray) | ✅ Working | No API key required |
| **WebSocket** | Real-time route push | ✅ End-to-end | Ping/pong keepalive, auto-reconnect |

---

## 22. Delhi NCR Graph — All Nodes & Roads

### Road Connections (43 edges)

| From | To | Distance (km) |
|------|----|--------------|
| Okhla Industrial Estate | Okhla Phase 2 | 2.1 |
| Okhla Phase 2 | Okhla Industrial Estate | 2.1 |
| Okhla Phase 2 | Nehru Nagar | 3.8 |
| Nehru Nagar | Okhla Phase 2 | 3.8 |
| Okhla Phase 2 | ITO | 7.2 |
| ITO | Okhla Phase 2 | 7.2 |
| Nehru Nagar | RK Puram | 4.5 |
| RK Puram | Nehru Nagar | 4.5 |
| Nehru Nagar | ITO | 5.1 |
| ITO | Nehru Nagar | 5.1 |
| ITO | Connaught Place | 3.9 |
| Connaught Place | ITO | 3.9 |
| ITO | Mandir Marg | 4.2 |
| Mandir Marg | ITO | 4.2 |
| ITO | Anand Vihar | 8.4 |
| Anand Vihar | ITO | 8.4 |
| Connaught Place | Mandir Marg | 2.1 |
| Mandir Marg | Connaught Place | 2.1 |
| Connaught Place | Shadipur | 6.8 |
| Shadipur | Connaught Place | 6.8 |
| RK Puram | Dwarka Sec 8 | 12.3 |
| Dwarka Sec 8 | RK Puram | 12.3 |
| RK Puram | Shadipur | 7.4 |
| Shadipur | RK Puram | 7.4 |
| Shadipur | Punjabi Bagh | 4.8 |
| Punjabi Bagh | Shadipur | 4.8 |
| Shadipur | Wazirpur | 5.2 |
| Wazirpur | Shadipur | 5.2 |
| Punjabi Bagh | Rohini | 9.1 |
| Rohini | Punjabi Bagh | 9.1 |
| Punjabi Bagh | Dwarka Sec 8 | 14.7 |
| Dwarka Sec 8 | Punjabi Bagh | 14.7 |
| Wazirpur | Jahangirpuri | 4.3 |
| Jahangirpuri | Wazirpur | 4.3 |
| Wazirpur | Rohini | 6.2 |
| Rohini | Wazirpur | 6.2 |
| Jahangirpuri | Rohini | 5.8 |
| Rohini | Jahangirpuri | 5.8 |
| Anand Vihar | Wazirpur | 11.3 |
| Wazirpur | Anand Vihar | 11.3 |
| Mandir Marg | Connaught Place Delivery | 1.8 |
| Connaught Place | Connaught Place Delivery | 0.9 |
| Rohini | Rohini Sector 18 Delivery | 1.2 |

---

## 23. AQI Standards (CPCB India)

India's Central Pollution Control Board (CPCB) defines 6 AQI categories:

| AQI Range | Category | Color | Health Impact | Routing Decision |
|-----------|----------|-------|---------------|-----------------|
| 0 – 50 | Good | Green `#00B050` | Minimal impact | ✅ Allow traversal |
| 51 – 100 | Satisfactory | Yellow-Green `#92D050` | Minor breathing discomfort | ✅ Allow traversal |
| 101 – 200 | Moderate | Yellow `#FFFF00` | Discomfort with prolonged exposure | ✅ Allow traversal |
| 201 – 300 | Poor | Orange `#FF9900` | Breathing discomfort on prolonged exposure | ✅ Allow traversal (warn) |
| 301 – 400 | Very Poor | Red `#FF0000` | Respiratory illness risk | ✅ Allow (flag as high-risk) |
| **> 400** | **Severe / Hazardous** | **Dark Red `#800000`** | **Serious health effects** | **❌ BLOCKED — route avoids** |

**EcoRoute threshold: AQI > 400 = ROAD CLOSED for routing purposes.**

This aligns with Delhi's official "Emergency" tier where outdoor work restrictions apply.

### Pollutants Monitored by CPCB

CPCB computes AQI from 8 pollutants. EcoRoute uses the max sub-index method:

| Pollutant | Significance in Delhi |
|-----------|----------------------|
| PM2.5 | Fine particles from vehicles, construction, crop burning |
| PM10 | Coarse particles from dust, road resuspension |
| NO₂ | Traffic-heavy corridors (ITO, Anand Vihar) |
| SO₂ | Industrial zones (Okhla, Wazirpur) |
| CO | High traffic intersections |
| O₃ | Secondary pollutant, peaks in afternoon |
| NH₃ | Landfills, cattle, open drains |
| Pb | Lead from old vehicles (legacy issue) |

---

## 24. Design System

### Color Palette (Obsidian)

```css
--obsidian:       #080808   /* Background — near black */
--silver:         #E2E8F0   /* Primary text */
--silver-dim:     #94A3B8   /* Secondary text */
--border:         rgba(255,255,255,0.08)   /* Subtle borders */
--border-hover:   rgba(255,255,255,0.20)   /* Hover borders */
--glass-bg:       rgba(255,255,255,0.02)   /* Glass card fill */

/* Accent colors */
--cyan:    #38BDF8   /* Primary action, Warehouse, WS live */
--rose:    #F43F5E   /* Customer / Delivery markers */
--emerald: #34D399   /* Safe route status */
--red:     #EF4444   /* Danger, blocked route */
--purple:  #A855F7   /* Alternative route */
```

### Typography

```css
font-family: 'Inter', system-ui, sans-serif;   /* Body text */
font-family: 'Geist Mono', monospace;          /* Labels, codes, KPIs */
font-family: 'DM Serif Display', Georgia, serif;  /* Display headings */
```

### Glass Cards

Every panel and card uses a consistent glass morphism style:
```css
.glass {
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1rem;
}
```

### Map Styling

- Base tiles: `brightness(0.25) saturate(0.2)` filter — renders Esri tiles as near-black
- AQI circles: 5-tier color scheme matching CPCB standards
- Route lines: dual-layer (glow at 35% opacity + crisp at 95% opacity) for depth
- Severe zone rings: animated dashed circle at 26px radius

---

## 25. Known Limitations

| Limitation | Impact | Notes |
|------------|--------|-------|
| 13 neighborhoods in graph | Partial Delhi coverage | Full Delhi has 100+ CPCB stations |
| Neighborhood-level routing | Not street-level | Routes between zones, not specific streets |
| Single warehouse | One dispatch origin | Real logistics needs multi-depot |
| OSRM for visualization only | Road geometry is post-hoc | Routing decisions are graph-level |
| AQI threshold hardcoded at 400 | Not configurable per user | Could expose as API param |
| No route history | Each query is stateless | Could persist routes in Neo4j |
| No authentication | Open API | Fine for demo; needs auth in production |
| CORS allow-all | Security risk in production | Restrict to specific origins before launch |
| Render cold starts | Backend may sleep on free tier | ~30s first request if idle |

---

## 26. V2 Roadmap

### Immediate (Sprint 1 — 2 weeks)

- [ ] Expand Delhi graph to 40+ neighborhoods (all CPCB stations)
- [ ] AQI exposure score per route (sum of AQI × distance for each segment)
- [ ] User-configurable AQI threshold (e.g., route avoids AQI > 300 instead of 400)
- [ ] Route comparison: show primary vs. alternative side-by-side with AQI exposure scores
- [ ] Mobile-responsive layout

### Near Term (Sprint 2–3 — 1 month)

- [ ] Multi-stop routing: Warehouse → Stop1 → Stop2 → ... → Base
- [ ] AQI forecast integration (predict tomorrow's routing using IMD/IQAir forecasts)
- [ ] Driver-facing mobile app (React Native) with turn-by-turn directions
- [ ] Fleet view: N vehicles, N routes, all on one map
- [ ] Historical route analytics: AQI exposure over time by driver

### Product Vision (V2 — 3 months)

- [ ] Other cities: Mumbai, Bangalore, Chennai AQI routing
- [ ] Business dashboard: total AQI exposure saved, estimated health cost saved
- [ ] API product: POST your stops → receive AQI-optimized route (monetizable)
- [ ] Integration with Delhivery, Dunzo, Zomato logistics APIs
- [ ] PM2.5-weighted routing (not just binary AQI threshold)

### Research / Advanced (V3)

- [ ] ML-predicted AQI: use historical patterns + weather to pre-reroute before spikes
- [ ] Graph embeddings: use Neo4j GDS `node2vec` or `FastRP` for AQI pattern clustering
- [ ] Dynamic graph: real-time traffic + AQI combined routing weight function
- [ ] Digital twin: simulate entire Delhi logistics network with AQI-aware routing

---

## 27. Tech Choices — Why We Picked These

### Why Neo4j?

**Shortest path is graph-native.** SQL needs recursive CTEs or Dijkstra implementations. Python NetworkX works but loses real-time data updates. Neo4j gives us:
- `shortestPath()` built-in, optimized, depth-limited
- `WHERE all(n IN nodes(p) ...)` — filter paths by node properties during traversal, not after
- `UNWIND` for bulk updates — update all 13 AQI values in one query
- Live, stateful graph — AQI updates in Neo4j instantly affect the next route query
- AuraDB — managed, no ops, auto-backups

### Why FastAPI?

- Async-first: all Neo4j calls are non-blocking, handling many concurrent WS + REST
- Native WebSocket support
- pydantic-settings for env var management
- Auto-generated OpenAPI docs at `/docs`
- Python ecosystem: httpx, APScheduler, neo4j, tavily all integrate cleanly

### Why React + Vite + Zustand?

- Vite 8: instant HMR, fast builds
- Zustand: minimal boilerplate for shared state; direct mutation-style APIs
- TanStack Query: polling, caching, retry logic out of the box
- react-leaflet: Leaflet.js in React — mature, well-documented, OSRM-compatible

### Why OSRM for Road Geometry?

- Free, no API key, open-source routing engine based on OpenStreetMap
- Returns GeoJSON geometry — standard format, easy to convert for Leaflet
- Public demo server at `router.project-osrm.org` — perfect for hackathon
- Fallback-safe: if unreachable, we draw straight lines (not a crash)

### Why Tavily?

- Designed for AI agents — returns pre-summarized content, not raw HTML
- `include_answer=True` gives a direct paragraph answer to the query
- Domain filtering ensures authoritative sources (ToI, HT, The Hindu)
- Free dev tier is sufficient for hackathon use

### Why APScheduler?

- In-process scheduler — no separate Celery/Redis/worker needed
- `AsyncIOScheduler` integrates with FastAPI's asyncio event loop
- Cron-like intervals (`hours=1`, `hours=2`) — simple and readable

---

## 28. Team

**Team KAZE** — PS-1A Neo4j Hackathon submission

> *"The wind doesn't care about roads. But delivery drivers do — and so does their health."*

---

<div align="center">

**EcoRoute KAZE — Because every delivery shouldn't cost a driver their lungs.**

Built with Neo4j AuraDB · FastAPI · React · real CPCB data · and a belief that routing should optimize for health, not just distance.

<br />

<img src="Logo.png" alt="KAZE" width="100" />

<br />

**[Live Demo](https://kaze-igniteroom-coral.vercel.app)** · **[API Health](https://ecoroute-api-fg15.onrender.com/health)** · **[API Docs](https://ecoroute-api-fg15.onrender.com/docs)**

</div>
