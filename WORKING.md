# EcoRoute KAZE — Project Status & Working Document

> **For:** Hackathon judges, mentors, and team reference  
> **Last updated:** September 2026  
> **Status:** Production-deployed MVP, fully interactive demo live

---

## Vision

EcoRoute KAZE is **"Google Maps for Delhi NCR logistics, but with AQI as a first-class routing constraint."**

Google Maps routes delivery vehicles around traffic jams. EcoRoute routes them around neighborhoods with hazardous air quality (AQI > 400). A delivery van travelling from Okhla Industrial Estate to Connaught Place should not barrel through Anand Vihar or Jahangirpuri when those corridors are choking at AQI 480. It should take the cleaner route — even if it costs a few extra kilometers.

The insight: air quality is the **missing third dimension** of urban logistics routing. Today's routing engines optimize for:
1. Distance
2. Time (traffic)

EcoRoute adds:
3. **AQI exposure** — minimize driver health risk and corporate ESG liability

This is not just a visualization. It is a live routing engine backed by a real graph database, real CPCB sensor data, and real road geometry. The graph updates every hour from government APIs. Routes recompute automatically. Every connected dashboard reflects changes within seconds via WebSocket push.

**Broader vision:** A SaaS platform where any logistics company in India — Delhivery, Blue Dart, Swiggy, Zomato — can plug in their delivery stops and receive routes optimized simultaneously for distance, time, AND air quality. Expand to Mumbai, Bangalore, Chennai. Expose an API so third-party fleet management systems can consume AQI-safe waypoints directly.

---

## Stack

| Layer | Technology |
|---|---|
| Backend runtime | Python 3.11, FastAPI 0.115 |
| Graph database | Neo4j AuraDB (cloud-managed) |
| Background jobs | APScheduler 3.10 (async) |
| Real-time | FastAPI WebSocket + custom ConnectionManager |
| AI context | Tavily Python SDK 0.5 |
| AQI data source | CPCB via data.gov.in API (real sensor telemetry) |
| Road geometry | OSRM public API (real turn-by-turn road coordinates) |
| Frontend framework | React 18 + Vite, TypeScript |
| State management | Zustand |
| Server state / caching | TanStack Query v5 |
| Map rendering | react-leaflet + Leaflet.js |
| Map tiles | Esri World Dark Gray Canvas (watermark-free) |
| Styling | Tailwind CSS |
| Deployment — backend | Render (Singapore region, starter plan) |
| Deployment — frontend | Vercel (auto-deploy on git push to master) |
| CI/CD | render.yaml + Vercel GitHub integration |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vercel)                      │
│                                                             │
│  React App                                                  │
│  ├── App.tsx          (TanStack Query: /api/graph, /api/route, /health)
│  ├── Header.tsx       (WS status, CPCB legend, sync time)   │
│  ├── KpiBar.tsx       (4 KPI cards: mission/AQI/safety/choke)│
│  ├── MapPanel.tsx     (Leaflet map, OSRM road geometry)     │
│  ├── SidePanel.tsx    (4 tabs: route/aqi/events/intel)      │
│  ├── SimulationControl.tsx  (spike + reset + Tavily AI)     │
│  ├── store/routeStore.ts   (Zustand: nodes, edges, route)   │
│  └── hooks/useRouteWebSocket.ts  (WS + ping/reconnect)      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Render)                        │
│                                                             │
│  FastAPI app                                                │
│  ├── GET  /api/route     → compute_route() [Neo4j Cypher]  │
│  ├── GET  /api/graph     → get_all_nodes() + get_all_edges()│
│  ├── POST /api/aqi/simulate  → spike Neo4j → broadcast WS  │
│  ├── POST /api/aqi/reset     → restore cache → broadcast WS│
│  ├── POST /api/aqi/sync      → pull CPCB → update Neo4j    │
│  ├── GET  /api/news      → Tavily cached articles           │
│  ├── GET  /health        → status + last_aqi_sync           │
│  └── WS   /ws/route-updates → push route+aqi events        │
│                                                             │
│  APScheduler                                                │
│  ├── hourly_aqi_sync  (60 min) → CPCB → Neo4j → WS push   │
│  └── news_refresh     (120 min) → Tavily → in-memory cache │
└────────────────────────┬────────────────────────────────────┘
                         │ bolt+s (async Neo4j driver)
┌────────────────────────▼────────────────────────────────────┐
│                   NEO4J AURADB (Cloud)                      │
│                                                             │
│  16 nodes: 1 Warehouse + 2 Customers + 13 Neighborhoods     │
│  43 ROAD relationships with real distance (km) properties   │
│  Cypher shortestPath with WHERE n.aqi <= 400 constraint     │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│               EXTERNAL DATA SOURCES                         │
│  data.gov.in   → CPCB real Delhi AQI sensor readings       │
│  OSRM router   → Real road coordinates for map polylines    │
│  Tavily AI     → Delhi AQI news + spike context             │
└─────────────────────────────────────────────────────────────┘
```

---

## What Is Fully Built and Working

### 1. Neo4j Graph — The Core Data Model

The entire routing domain lives in Neo4j AuraDB. The graph is seeded on first startup and never requires manual setup.

**Nodes (16 total):**

| Type | Count | Description |
|---|---|---|
| `Warehouse` | 1 | Okhla Industrial Estate — origin of all deliveries |
| `Customer` | 2 | Connaught Place Delivery, Rohini Sector 18 Delivery |
| `Neighborhood` | 13 | CPCB-monitored areas; each holds live `aqi`, `aqi_category`, `aqi_hex`, `lat`, `lon`, `station` |

**Neighborhoods in the graph:**

| Neighborhood | Mapped CPCB Station | Default AQI |
|---|---|---|
| Okhla Phase 2 | Okhla Phase-2, Delhi - DPCC | 187 |
| Nehru Nagar | — | 220 |
| ITO | ITO, Delhi - DPCC | 312 |
| Connaught Place | Mandir Marg, Delhi - DPCC | 195 |
| RK Puram | R.K. Puram, Delhi - DPCC | 198 |
| Shadipur | Shadipur, Delhi - DPCC | 264 |
| Punjabi Bagh | Punjabi Bagh, Delhi - DPCC | 301 |
| Anand Vihar | Anand Vihar, Delhi - DPCC | 264 |
| Wazirpur | Wazirpur, Delhi - DPCC | 342 |
| Jahangirpuri | Jahangirpuri, Delhi - DPCC | 388 |
| Rohini | Rohini, Delhi - DPCC | 195 |
| Dwarka Sec 8 | Dwarka-Sector 8, Delhi - DPCC | 220 |
| Mandir Marg | Mandir Marg, Delhi - DPCC | 178 |

**Edges:** 43 directed `ROAD` relationships with `distance` (km) properties encoding real road distances between adjacent neighborhoods.

**Constraints and indexes:** Bootstrapped via `schema.py` on startup — uniqueness constraints on node names, indexes on `aqi` for fast filtering.

---

### 2. Cypher Routing Engine — No GDS Required

The routing logic lives in `backend/services/route_engine.py`. It uses pure Cypher — no Graph Data Science plugin, no external routing library.

**Primary route query:**

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
       name: x.name, lat: x.lat, lon: x.lon,
       aqi: coalesce(x.aqi, 0),
       category: coalesce(x.aqi_category, 'N/A'),
       hex: coalesce(x.aqi_hex, '#FFFFFF'),
       type: CASE WHEN x:Warehouse THEN 'warehouse'
                  WHEN x:Customer  THEN 'customer'
                  ELSE 'neighborhood' END
     }] AS waypoints
RETURN waypoints, total_km, length(p) AS hops,
       [x IN nodes(p) WHERE x:Neighborhood AND x.aqi > 300 | x.name] AS high_risk_zones
ORDER BY total_km ASC
LIMIT 1;
```

The `WHERE all(n IN nodes(p) WHERE n.aqi <= 400 OR n:Warehouse OR n:Customer)` clause is the AQI gate: any neighborhood currently reading above 400 is **removed from the traversal graph at query time**. No pre-processing required. The moment a neighborhood's `aqi` property crosses 400 in Neo4j, the next route computation will route around it.

**Alternative route query:** A second Cypher query finds the cheapest path that does not share the same waypoint sequence as the primary route. This provides the purple dashed "contingency corridor" shown on the map.

**No-safe-route detection:** When all paths from warehouse to customer pass through at least one AQI > 400 node, the primary query returns no records. The engine returns `status: "no_safe_route"`, triggering a red alert overlay on the dashboard and an animated pulse on the map.

**API response shape:**

```json
{
  "status": "ok",
  "waypoints": [{ "name": "...", "lat": ..., "lon": ..., "aqi": ..., "hex": "...", "type": "..." }],
  "total_km": 14.9,
  "hops": 4,
  "avoided": ["Anand Vihar", "Jahangirpuri"],
  "high_risk_zones": ["ITO"],
  "alternative_waypoints": [...],
  "alternative_total_km": 17.2,
  "alternative_hops": 4
}
```

---

### 3. Live AQI Data Pipeline

**Source:** `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`  
This is the CPCB real-time air quality dataset published by India's Central Pollution Control Board on the government open data portal.

**How it works:**

1. `sync_aqi_from_cpcb()` fetches all Delhi station records from data.gov.in
2. Records are grouped by station name; AQI = `max(pollutant_avg)` across all pollutants at that station — matching CPCB's own methodology (the "dominant pollutant" approach)
3. Station names are translated to graph node names via a deterministic mapping in `graph_mapper.py` (e.g., `"Anand Vihar, Delhi - DPCC"` → `"Anand Vihar"`)
4. A single bulk Cypher `UNWIND` query updates all matched nodes in one Neo4j transaction
5. Updated values are cached in `_real_aqi_cache` (an in-memory dict) so spike simulations can be reset to real values

**Scheduling:**
- Hourly sync: APScheduler `interval(minutes=60)` job
- On each successful sync that updates ≥ 1 node: route is recomputed and broadcast via WebSocket

**AQI category thresholds (CPCB scale):**

| AQI Range | Category | Hex Color |
|---|---|---|
| 0 – 50 | Good | `#00B050` |
| 51 – 100 | Satisfactory | `#92D050` |
| 101 – 200 | Moderate | `#FFFF00` |
| 201 – 300 | Poor | `#FF9900` |
| 301 – 400 | Very Poor | `#FF0000` |
| > 400 | Severe | `#800000` |

---

### 4. Real-Time WebSocket Pipeline

The full event flow from data change to dashboard update:

```
CPCB sync / spike / reset
       ↓
Neo4j AQI property updated
       ↓
compute_route() → new route dict
       ↓
manager.broadcast(payload)          ← ConnectionManager fans out to all sockets
       ↓
Each connected client: onmessage()
       ↓
setRoute() → Zustand store update
       ↓
React re-render: map + side panel + KPI bar update
```

**WebSocket endpoint:** `wss://ecoroute-api-fg15.onrender.com/ws/route-updates`

**Client implementation (`useRouteWebSocket.ts`):**
- Auto-reconnect: 3-second retry on disconnect
- Keepalive: `ping` sent every 25 seconds; server responds with `{"event":"pong"}`
- Three event types handled: `aqi_update` (spike), `aqi_sync` (hourly), `aqi_reset`
- Each event type appends to the Events Log in the side panel and updates the Zustand node store

**Server-side broadcast:** `ConnectionManager.broadcast()` fans out to all active WebSocket connections. Dead connections (broken sockets) are silently pruned from the active set on each broadcast.

---

### 5. Interactive Leaflet Map

The map renders in `MapPanel.tsx` using react-leaflet with the following layers (back to front):

| Layer | Description |
|---|---|
| Base tiles | Esri World Dark Gray Canvas — clean dark basemap, no watermarks at standard zoom |
| Graph topology edges | Dashed white polylines (`opacity: 0.08`) for all 43 ROAD relationships |
| Alternative route | Purple dashed polyline following real OSRM road coordinates |
| Primary route glow | Cyan/white wide polyline (opacity 0.35) for soft glow effect |
| Primary route line | Cyan/white solid polyline (weight 3.5) on real OSRM road geometry |
| Neighborhood circles | AQI-colored `CircleMarker` per node; radius scales with AQI severity |
| Severe zone rings | Outer dashed dark-red pulse ring for AQI > 400 nodes |
| Warehouse marker | Cyan circle (radius 12) with permanent "WAREHOUSE" tooltip |
| Customer marker | Rose/pink circle (radius 12) with permanent "DELIVERY" tooltip |

**OSRM real road geometry:** The `fetchRoadGeometry()` function calls the public OSRM routing API with the route waypoints as coordinates, receiving GeoJSON road geometry. The resulting `[lat, lon]` array is used for both the primary and alternative polylines. A 6-second timeout with AbortSignal falls back to straight lines between waypoints if OSRM is unavailable.

**Clickable popups:** Each node circle opens a Leaflet popup showing name, type, AQI index, category badge, and a status line (TRAVERSAL BLOCKED or ON ACTIVE SAFE ROUTE) where applicable.

**No-safe-route state:** When `route.status === "no_safe_route"`, the primary polyline changes to red and dashed, and a centered overlay banner animates with a pulse.

---

### 6. AQI Spike Simulation (Demo Engine)

Located in `SimulationControl.tsx` (frontend) and `POST /api/aqi/simulate` (backend).

**What happens on "Trigger Spike":**
1. Frontend sends `POST /api/aqi/simulate` with `{ neighborhood, spike_value }`
2. Backend writes new AQI to Neo4j: `SET n.aqi = $aqi, n.aqi_category = $category, n.aqi_hex = $hex`
3. `compute_route()` re-runs the Cypher shortestPath — if the spiked node is now above 400, it is excluded from paths
4. `fetch_spike_context(neighborhood, aqi)` queries Tavily: *"Why is {neighborhood} Delhi AQI high pollution causes {aqi} 2026"* — returns a plain-English paragraph
5. `manager.broadcast()` pushes `{ event: "aqi_update", spiked_node, previous_aqi, new_aqi, route, context }` to all clients
6. All connected dashboards update simultaneously

**On "Reset Data":**
1. `POST /api/aqi/reset` restores the neighborhood's AQI from `_real_aqi_cache` (the real CPCB value saved during the last sync)
2. If the cache is empty (no sync has run yet), falls back to AQI 180 / Moderate as a safe neutral
3. Route is recomputed and broadcast

**Preset buttons:** Anand Vihar, Punjabi Bagh, Jahangirpuri — historically the highest-AQI stations in Delhi NCR. All three preset to AQI 487 (Severe).

---

### 7. Side Panel — Four Tabs

**Route Tab:**
- Key stats: distance (km), hops, estimated drive time (distance ÷ 28 km/h Delhi average)
- Status badge: ENVIRONMENTALLY SAFE CORRIDOR (green) or NO SAFE ROUTE / AQI > 400 LOCKOUT (red, pulsing)
- Secondary contingency path: distance and hops for the alternative route
- Turn-by-turn waypoint list: numbered, color-coded by AQI, labeled by type
- Avoided toxic zones: list of neighborhood names with AQI > 400 that were bypassed
- Manual recalculate button: hits `/api/route` on demand, shows toast confirmation

**AQI Grid Tab:**
- All 13 neighborhoods ranked by current AQI (highest first)
- Each row: name, AQI badge (colored), category label, progress bar (AQI / 500)
- Severe zones (> 400) show a BLOCKED badge with red background

**Events Log Tab:**
- Timestamped audit trail (newest first, capped at 50 entries)
- Event types: `system`, `sync`, `spike`, `reset`, `info`
- Populated by both WebSocket messages and manual user actions

**Intel Tab (News):**
- Tavily-curated Delhi AQI news articles
- AI-generated summary paragraph for current Delhi air quality situation
- Refreshed every 2 hours by the scheduler; also warmed on backend startup
- Source domains: Times of India, Hindustan Times, The Hindu, NDTV, India Today, IQAir, aqi.in

---

### 8. KPI Bar (Four Cards)

| Card | What It Shows |
|---|---|
| Active Mission | Current delivery target, route distance (km), hop count, customer switcher buttons (CP Central / Rohini North) |
| Delhi NCR Mean AQI | Average across all 13 neighborhood nodes, category label (Moderate/Poor/Very Poor), peak station name and value |
| Safety Clearance | OPTIMAL (green shield) when a safe route exists; BLOCKED (red octagon) when `status === "no_safe_route"` |
| Chokepoint Watch | Count of severe + very-poor zones; count of zones avoided by the Cypher query |

---

### 9. Instant Load / Zero-Spinner Design

The Zustand store is initialized with **hardcoded seed values** matching the Neo4j graph: 16 nodes, 23 display edges, and a pre-computed initial route for Connaught Place. This means the map renders with a complete, correct-looking graph on the first paint — before any API call completes. When the real API data arrives (typically 1–2 seconds on Render cold start), it silently replaces the seed values. To a judge watching the demo, the dashboard appears instant.

---

### 10. Production Deployment

**Backend (Render):**
- URL: `https://ecoroute-api-fg15.onrender.com`
- Region: Singapore (ap-southeast-1)
- Runtime: Python 3.11.9, single uvicorn worker
- Health check: `GET /health` returns Neo4j URI, last sync time, active WebSocket count
- Config: `render.yaml` in repo root — zero-downtime redeploys on push

**Frontend (Vercel):**
- Auto-deploy from `master` branch
- Build: `vite build` in `frontend/`
- Environment: `VITE_API_BASE` set to Render backend URL

**API base URL resolution (`frontend/src/api.ts`):**

```typescript
const API_BASE = import.meta.env.VITE_API_BASE
  ?? 'https://ecoroute-api-fg15.onrender.com'

const WS_BASE = API_BASE.replace(/^https?/, 'wss').replace(/^http/, 'ws')

export const API = {
  graph: `${API_BASE}/api/graph`,
  route: (c: string) => `${API_BASE}/api/route?customer=${encodeURIComponent(c)}`,
  health: `${API_BASE}/health`,
  aqiSimulate: `${API_BASE}/api/aqi/simulate`,
  aqiReset: `${API_BASE}/api/aqi/reset`,
  news: `${API_BASE}/api/news`,
  ws: `${WS_BASE}/ws/route-updates`,
}
```

---

## What the Live Demo Shows

A recommended walkthrough for judges, step by step:

**Step 1 — Open the dashboard**
The map immediately renders with the full Delhi NCR graph. No loading spinner. 16 nodes, topology edges, initial route (Okhla → Connaught Place via Nehru Nagar and Mandir Marg, 14.9 km). KPI bar shows route stats. This is the Zustand seed data.

**Step 2 — API data loads (~1–2 seconds)**
Graph nodes fetch from `/api/graph`. AQI circles recolor to reflect real current CPCB readings. Some nodes may shift from seed values. The route simultaneously fetches from `/api/route` and updates if the live AQI changes the optimal path.

**Step 3 — OSRM road geometry snaps in**
The route polyline, initially straight lines between waypoints, "snaps" to follow real Delhi streets via OSRM. You can see the route hugging NH 48, Ring Road, or Mathura Road depending on the computed path.

**Step 4 — WebSocket goes live**
The header indicator changes from `DISCONNECTED` (red) to `WS LIVE` (green pulsing radio icon). All future route changes will push to the map in real time without page refresh.

**Step 5 — Simulate an AQI spike**
In the Route tab → Simulation panel:
1. Click preset **Anand Vihar** (auto-fills AQI 487)
2. Click **TRIGGER SPIKE**
3. Watch: Anand Vihar circle turns dark red with a pulse ring
4. Route recomputes around Anand Vihar — if it was on a path, the map immediately shows a new corridor
5. Events log: spike event appears with previous and new AQI values
6. Tavily AI context panel appears below the simulation controls with a paragraph explaining why Anand Vihar AQI might be elevated (nearby industrial zones, traffic, weather inversion)

**Step 6 — Escalate to no-safe-route**
Spike multiple neighborhoods to AQI > 400 simultaneously (e.g., ITO + Mandir Marg + Nehru Nagar). The route engine finds no path that avoids all of them. Map shows a red dashed line, centered banner reads "NO SAFE ROUTE FOUND — All physical pathways pass through Hazardous zones. Manual dispatch required." KPI Safety Clearance card flips to BLOCKED.

**Step 7 — Reset and restore**
Click **RESET DATA** on a spiked neighborhood. AQI restores from the real CPCB cache. Route recomputes. Map updates. The green safe-route corridor reappears.

**Step 8 — Switch delivery target**
In the KPI bar, click **Rohini North**. The route refetches for `Rohini Sector 18 Delivery`. The map shows a new longer route heading north through Wazirpur/Jahangirpuri corridor if AQI permits, or via Shadipur/Punjabi Bagh/Rohini if the eastern corridor is blocked. All KPI stats update for the new destination.

**Step 9 — Check AQI Grid tab**
Switch to AQI Grid tab. See all 13 stations ranked by real AQI with progress bars. Any spiked station shows at the top with a BLOCKED label and red highlight.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| Graph coverage | 13 neighborhoods; Delhi NCR has 100+ CPCB stations and 500+ distinct areas |
| Routing granularity | Neighborhood-level graph, not street-level (Google Maps style turn-by-turn) |
| OSRM geometry | Road polyline is for visualization only — the routing decision is made at graph level |
| AQI threshold | 400 is hardcoded; should be configurable per-route or per-customer |
| Single warehouse | Multi-depot routing (multiple origin points) not yet supported |
| Single-vehicle | No fleet management; routes one vehicle per computation |
| No authentication | Dashboard is publicly accessible; no user accounts or access control |
| No route history | No persistent storage of past deliveries or route decisions |
| Tavily latency | Spike context fetch adds ~1–2 seconds to simulate endpoint response time |
| Render cold start | Free tier sleeps after inactivity; first request after sleep takes ~15 seconds |
| OSRM public rate limits | OSRM public endpoint may throttle under high load; no API key fallback |

---

## What Could Be Built Next (V2 Roadmap)

### Immediate Improvements (1–2 weeks)

- **Expand graph to 50+ neighborhoods:** Add all CPCB stations in Delhi-NCR, Gurugram, Noida, Faridabad, Ghaziabad. CPCB station → node mapping already architected in `graph_mapper.py` — adding new entries requires only extending the dictionary and seeding the Neo4j nodes
- **Configurable AQI threshold:** API parameter `?max_aqi=300` allows stricter or looser routing depending on cargo type or company policy
- **Route history:** Persist each computed route (warehouse → customer, timestamp, AQI profile, distance) to Neo4j or a time-series database for analytics
- **AQI exposure score per route:** Instead of binary allow/block, compute a cumulative AQI exposure integral across the route. Route A at AQI 195 for 8 km vs. Route B at AQI 90 for 11 km — which is actually healthier?

### Near-Term Features (1–2 months)

- **Multi-stop routing (TSP with AQI constraints):** A logistics vehicle typically delivers to 5–15 stops, not one. The route engine needs to solve a Travelling Salesman Problem variant where the "cost" of each edge accounts for AQI exposure, not just distance. Neo4j GDS library provides Dijkstra and A* implementations that could be adapted
- **AQI forecast routing:** Delhi's air quality follows predictable seasonal patterns (worst October–February). Integrate IMD or third-party AQI forecast APIs to route based on predicted AQI at delivery time, not current AQI
- **Driver mobile app:** React Native application for delivery drivers. Shows turn-by-turn directions, current AQI along the route, and can alert drivers in real time when their current corridor spikes above threshold
- **Fleet view:** Track multiple vehicles simultaneously. Each vehicle has its own WebSocket subscription and route. Dispatcher sees all vehicles on one map

### Strategic Extensions (3–6 months)

- **Other Indian cities:** Bangalore (KSPCB stations), Mumbai (MPCB), Chennai (TNPCB). The architecture is city-agnostic — seed a new city's graph, map its CPCB stations, and the routing engine works identically
- **Business intelligence dashboard:** What percentage of deliveries required rerouting this month? What is the estimated health cost saved (PM2.5 exposure avoided × population at risk metric)? CO2 efficiency metrics comparing AQI-routed vs. shortest-path distance
- **Driver health tracking:** Cumulative daily AQI exposure per driver over time. Flag drivers exceeding occupational exposure limits. Feed into HR wellness programs
- **API-first product:** Expose `POST /v1/route` as a commercial API. Input: origin, destinations, vehicle type. Output: AQI-safe waypoints, estimated exposure score, alternative routes. Logistics SaaS companies embed this directly into dispatch systems
- **Neo4j GDS integration:** Graph Data Science plugin enables betweenness centrality to identify the most critical corridor nodes (single points of failure when AQI spikes), Louvain community detection to find "clean air clusters," and streaming weighted shortest paths for real-time fleet reoptimization

---

## Key Technical Decisions & Rationale

**Why Neo4j instead of PostgreSQL + PostGIS?**  
The routing problem is inherently a graph problem — shortest path with node-level constraints. Cypher's `shortestPath` with an `ALL` predicate over nodes maps exactly to the domain. A SQL implementation would require recursive CTEs or a separate graph engine layer. Neo4j AuraDB is also free-tier cloud-managed, eliminating ops overhead for a hackathon.

**Why pure Cypher instead of Neo4j GDS?**  
Neo4j GDS requires an additional library installation and a different API surface (in-memory projections, algorithm procedures). Pure Cypher `shortestPath` handles the AQI constraint elegantly with no extra dependencies. The constraint is applied at traversal time, not post-processing.

**Why Zustand with seed data instead of loading states?**  
Hackathon demos cannot afford loading spinners. The seed data strategy ensures the dashboard is visually complete and interactive from the first frame. Judges see a working product immediately, not a spinner. Real data overlays seamlessly.

**Why OSRM for road geometry if routing is done in Neo4j?**  
The Neo4j graph operates at neighborhood granularity — its "edges" are not individual roads but connections between districts. OSRM provides actual road coordinates between those district centroids, making the route polyline look realistic on the map. The two systems do different jobs: Neo4j decides which neighborhoods to include; OSRM draws the road between them.

**Why Tavily for AQI context instead of static text?**  
Static explanations ("Anand Vihar is near a truck depot") are not credible in a live demo. Tavily fetches real, current news articles and synthesizes a grounded answer. When a judge watches the spike and sees the AI respond with a reference to a specific industrial event or weather pattern that actually happened recently, it validates the product's real-world relevance.

---

## Repository Structure

```
Ignite with Delhi/
├── render.yaml                    # Render deployment config (backend)
├── WORKING.md                     # This document
│
├── backend/
│   ├── main.py                    # FastAPI app, lifespan, WebSocket endpoint
│   ├── config.py                  # Pydantic settings (env vars / .env)
│   ├── scheduler.py               # APScheduler: hourly AQI sync, 2h news refresh
│   ├── requirements.txt           # Python dependencies (pinned)
│   ├── Dockerfile                 # Container build (optional; Render uses requirements.txt)
│   │
│   ├── database/
│   │   ├── neo4j_client.py        # AsyncDriver singleton, connection pool
│   │   └── schema.py              # Bootstrap: indexes + uniqueness constraints
│   │
│   ├── seed/
│   │   └── delhi_graph.py         # Warehouse, 2 customers, 13 neighborhoods, 43 roads
│   │
│   ├── services/
│   │   ├── aqi_ingestion.py       # CPCB fetch, AQI computation, bulk Neo4j update, cache
│   │   ├── graph_mapper.py        # CPCB station name → graph node name mapping
│   │   ├── route_engine.py        # Cypher queries: primary + alt route, all nodes/edges
│   │   └── tavily_news.py         # Delhi AQI news + spike context via Tavily
│   │
│   ├── routes/
│   │   ├── route_api.py           # GET /api/route
│   │   ├── graph_api.py           # GET /api/graph
│   │   ├── aqi_api.py             # GET /api/aqi/live, POST /api/aqi/simulate|reset|sync
│   │   └── news_api.py            # GET /api/news, refresh_news_cache()
│   │
│   └── websocket/
│       └── manager.py             # ConnectionManager: connect, disconnect, broadcast
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── package.json
    │
    └── src/
        ├── main.tsx               # React root, QueryClientProvider
        ├── App.tsx                # TanStack Query: graph + route + health polling
        ├── api.ts                 # Centralized API URL builder
        ├── types.ts               # TypeScript interfaces: GraphNode, RouteResult, WsMessage
        │
        ├── store/
        │   └── routeStore.ts      # Zustand: nodes, edges, route, events, liveConnected
        │                          # Includes seed data for instant first render
        │
        ├── hooks/
        │   └── useRouteWebSocket.ts  # WebSocket hook with auto-reconnect + ping
        │
        ├── components/
        │   ├── Header.tsx         # Brand, CPCB legend, WS status indicator, sync time
        │   ├── KpiBar.tsx         # 4 KPI cards: mission / mean AQI / safety / chokes
        │   ├── MapPanel.tsx       # Leaflet map, OSRM geometry, all node/edge layers
        │   ├── SidePanel.tsx      # 4-tab panel: route / AQI grid / events / intel
        │   ├── SimulationControl.tsx  # Spike UI + Tavily context display
        │   └── NewsPanel.tsx      # Tavily news articles + AI summary
        │
        └── services/
            └── roadRouting.ts     # (utility, referenced in MapPanel)
```

---

## Deployed URLs

| Service | URL |
|---|---|
| Backend API | `https://ecoroute-api-fg15.onrender.com` |
| Health check | `https://ecoroute-api-fg15.onrender.com/health` |
| API docs | `https://ecoroute-api-fg15.onrender.com/docs` |
| WebSocket | `wss://ecoroute-api-fg15.onrender.com/ws/route-updates` |
| Frontend (Vercel) | Vercel project URL (set as CORS origin in render.yaml) |
| Neo4j AuraDB | `neo4j+s://96f11763.databases.neo4j.io` |

---

*EcoRoute KAZE — Delhi NCR Dynamic Environmental Routing Engine*  
*Built for PS-1A: Neo4j Hackathon — "Graph the City"*
