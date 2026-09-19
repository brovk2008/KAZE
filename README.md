<div align="center">
  <img src="Logo.png" alt="KAZE" width="180" />
  <h1>EcoRoute — KAZE</h1>
  <p><strong>AQI-Aware Logistics Routing for Delhi NCR</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Neo4j-AuraDB-00857E?style=flat-square&logo=neo4j" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" />
    <img src="https://img.shields.io/badge/PS--1A-Neo4j%20Hackathon-FF6B6B?style=flat-square" />
  </p>
</div>

---

## What Is This?

**EcoRoute** is a real-time logistics dashboard that routes delivery vehicles through Delhi NCR while avoiding neighborhoods with hazardous air quality (AQI > 400). Built as a production-grade submission for the **PS-1A Neo4j Hackathon**.

### Key Features

| Feature | Details |
|---|---|
| **AQI-Constrained Routing** | Pure Cypher `shortestPath` on Neo4j — no external GDS needed |
| **Live AQI Data** | Hourly ingestion from CPCB via [data.gov.in](https://data.gov.in) |
| **Real-Time Updates** | WebSocket push — route recalculates instantly on AQI spike |
| **Spike Simulation** | Trigger AQI emergencies for demo; reset to live data |
| **AI News Context** | Tavily search explains *why* a zone is spiking |
| **Dark Dashboard** | Modern Obsidian design — Leaflet map, AQI circles, event log |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                     │
│   React 19 · Vite 8 · react-leaflet · Zustand · TanStack   │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  Header  │   │   MapPanel   │   │     SidePanel      │  │
│  │ KAZE logo│   │ Leaflet map  │   │ Route·AQI·Events·  │  │
│  │ AQI key  │   │ AQI circles  │   │ News tabs          │  │
│  └──────────┘   │ Route line   │   └────────────────────┘  │
│                 └──────────────┘                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                     BACKEND (Render)                         │
│              FastAPI · Python 3.11 · Uvicorn                │
│                                                             │
│  /api/route      ← AQI-constrained shortestPath Cypher      │
│  /api/aqi/live   ← Live node AQI values                    │
│  /api/aqi/simulate ← Spike a zone for demo                 │
│  /api/aqi/reset  ← Restore real AQI                        │
│  /api/graph      ← All nodes + edges                       │
│  /api/news       ← Tavily news cache                       │
│  /ws/route-updates ← WebSocket broadcast                   │
│                                                             │
│  APScheduler → hourly CPCB AQI sync                        │
└──────────┬──────────────────┬───────────────────────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼──────────┐
│  Neo4j AuraDB   │  │  External APIs    │
│  15 nodes       │  │                   │
│  20+ ROAD edges │  │  CPCB data.gov.in │
│  shortestPath   │  │  Tavily Search    │
│  Cypher query   │  │                   │
└─────────────────┘  └───────────────────┘
```

---

## Integration Status

| Service | Purpose | Status |
|---|---|---|
| **Neo4j AuraDB** | Graph DB — nodes, roads, AQI state | ✅ Connected |
| **CPCB / data.gov.in** | Live AQI readings for Delhi NCR | ✅ Connected |
| **Tavily** | AI news + spike context search | ✅ Connected |
| **Render** | Backend hosting (FastAPI) | ✅ Configured via `render.yaml` |
| **Vercel** | Frontend hosting (React) | ✅ Deploy-ready (`npm run build`) |
| **WebSocket** | Real-time route push to UI | ✅ Wired end-to-end |

---

## Delhi Graph

**15 Neighborhood nodes** + Warehouse (Rohini) + Delivery (Connaught Place)

Neighborhoods: Anand Vihar · Ashok Vihar · Chandni Chowk · Connaught Place · Dwarka · INA · Jahangirpuri · Lodhi Road · Mayur Vihar · Narela · Pitampura · Punjabi Bagh · RK Puram · Rohini · Sahibabad

AQI thresholds: Good ≤50 · Moderate ≤100 · Poor ≤200 · Very Poor ≤300 · Severe ≤400 · **Hazardous >400 → route avoided**

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in your credentials
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Deployment

### Backend → Render

```bash
# render.yaml is already configured
# Just connect the GitHub repo in Render dashboard → set NEO4J_PASSWORD env var
```

### Frontend → Vercel

```bash
cd frontend
npm run build
# Point Vercel to the `frontend/` directory
# Set VITE_API_URL=https://your-render-app.onrender.com
```

---

## Project Structure

```
KAZE/
├── Logo.png
├── README.md
├── render.yaml              ← Render deploy config
├── backend/
│   ├── main.py              ← FastAPI app + WebSocket
│   ├── config.py            ← pydantic-settings
│   ├── scheduler.py         ← APScheduler hourly AQI sync
│   ├── database/
│   │   ├── neo4j_client.py  ← Async Neo4j driver singleton
│   │   └── schema.py        ← Constraints + indexes bootstrap
│   ├── seed/
│   │   └── delhi_graph.py   ← 15 nodes + 20+ roads seed data
│   ├── services/
│   │   ├── route_engine.py  ← shortestPath Cypher
│   │   ├── aqi_ingestion.py ← CPCB fetch + bulk UNWIND
│   │   ├── graph_mapper.py  ← CPCB station → neighborhood
│   │   └── tavily_news.py   ← News search + spike context
│   ├── routes/
│   │   ├── route_api.py
│   │   ├── aqi_api.py
│   │   ├── graph_api.py
│   │   └── news_api.py
│   └── websocket/
│       └── manager.py       ← ConnectionManager broadcast
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── src/
    │   ├── App.tsx           ← Root layout + data loading
    │   ├── main.tsx          ← React 19 entry
    │   ├── api.ts            ← API URL builder
    │   ├── types.ts          ← Shared TypeScript types
    │   ├── index.css         ← Modern Obsidian design system
    │   ├── store/
    │   │   └── routeStore.ts ← Zustand global state
    │   ├── hooks/
    │   │   └── useRouteWebSocket.ts ← WS with auto-reconnect
    │   └── components/
    │       ├── Header.tsx
    │       ├── MapPanel.tsx
    │       ├── SidePanel.tsx
    │       ├── SimulationControl.tsx
    │       └── NewsPanel.tsx
```

---

## How the Routing Works

```cypher
MATCH (warehouse:Warehouse), (customer:Customer {name: $customer_name})
MATCH p = shortestPath((warehouse)-[:ROAD*]-(customer))
WHERE all(n IN nodes(p)
          WHERE n.aqi <= 400 OR n:Warehouse OR n:Customer)
WITH p, reduce(dist=0, r IN relationships(p) | dist + r.distance) AS total_km
RETURN waypoints, total_km, length(p) AS hops
ORDER BY total_km LIMIT 1
```

If **all paths pass through AQI > 400 zones**, the API returns `no_safe_route` and the dashboard shows a red overlay — manual dispatch required.

---

<div align="center">
  <p>Built with ❤️ for the PS-1A Neo4j Hackathon — Team KAZE</p>
  <img src="Logo.png" alt="KAZE" width="80" />
</div>
