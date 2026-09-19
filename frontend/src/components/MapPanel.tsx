import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip, Marker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useRouteStore } from '../store/routeStore'
import type { GraphNode } from '../types'
import { fetchRealRoadGeometry, calculateBearing } from '../services/roadRouting'
import {
  Package,
  Target,
  AlertTriangle,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Layers,
  Zap,
} from 'lucide-react'

const DELHI_CENTER: [number, number] = [28.6139, 77.2090]

function aqiCircleRadius(aqi: number): number {
  if (aqi > 400) return 16
  if (aqi > 300) return 13
  if (aqi > 200) return 10
  return 8
}

function aqiBorderWeight(aqi: number): number {
  return aqi > 400 ? 3 : 1.5
}

interface NodeCircleProps {
  node: GraphNode
  isOnRoute: boolean
  isAvoided: boolean
}

function NodeCircle({ node, isOnRoute, isAvoided }: NodeCircleProps) {
  const isSpecial = node.type === 'warehouse' || node.type === 'customer'
  const isSevere = node.aqi > 400

  const radius = isSpecial ? 12 : aqiCircleRadius(node.aqi)

  const color = node.type === 'warehouse'
    ? '#38BDF8' // Cyan
    : node.type === 'customer'
      ? '#F43F5E' // Rose
      : node.hex || '#94A3B8'

  const opacity = isAvoided ? 0.95 : isOnRoute ? 1.0 : 0.65

  return (
    <>
      {/* Outer Pulse Ring for Severe AQI > 400 */}
      {isSevere && (
        <CircleMarker
          center={[node.lat, node.lon]}
          radius={28}
          pathOptions={{
            color: '#FF0000',
            fillColor: '#FF0000',
            fillOpacity: 0.2,
            weight: 1.5,
            dashArray: '3,4',
          }}
        />
      )}

      {/* Main Node Circle */}
      <CircleMarker
        center={[node.lat, node.lon]}
        radius={radius}
        pathOptions={{
          color: isSevere ? '#FF0000' : color,
          fillColor: color,
          fillOpacity: opacity,
          weight: aqiBorderWeight(node.aqi),
          opacity: 1,
        }}
      >
        <Popup className="custom-leaflet-popup">
          <div className="p-3 bg-[#0c0d12] text-white rounded-xl border border-white/10 shadow-2xl min-w-[210px]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">
                {node.type}
              </span>
              {node.type === 'neighborhood' && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                  style={{ backgroundColor: `${node.hex}22`, color: node.hex }}
                >
                  {node.category}
                </span>
              )}
            </div>

            <h3 className="font-serif italic text-lg text-white mb-2 leading-tight">
              {node.name}
            </h3>

            {node.type === 'neighborhood' && (
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/60">AQI Index:</span>
                  <strong className="text-sm font-bold" style={{ color: node.hex }}>
                    {node.aqi}
                  </strong>
                </div>

                {isSevere ? (
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 text-[10px] font-mono mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>NEO4J BLOCKED (AQI &gt; 400)</span>
                  </div>
                ) : isOnRoute ? (
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>ON ACTIVE SAFE CORRIDOR</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Popup>

        {isSpecial && (
          <Tooltip permanent direction="top" offset={[0, -10]} className="custom-tooltip">
            <span className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-black/85 text-white border border-white/20 flex items-center gap-1 shadow-lg">
              {node.type === 'warehouse' ? (
                <>
                  <Package className="w-3 h-3 text-cyan-400 inline" /> WAREHOUSE
                </>
              ) : (
                <>
                  <Target className="w-3 h-3 text-rose-400 inline" /> DELIVERY
                </>
              )}
            </span>
          </Tooltip>
        )}
      </CircleMarker>
    </>
  )
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 11)
  }, [center, map])
  return null
}

export function MapPanel() {
  const { route, nodes, edges } = useRouteStore()

  const routeNames = new Set(route?.waypoints.map((w) => w.name) ?? [])
  const avoidedNames = new Set(route?.avoided ?? [])

  // Real road street geometry fetched from OSRM
  const [roadLatLngs, setRoadLatLngs] = useState<[number, number][]>([])
  const [altRoadLatLngs, setAltRoadLatLngs] = useState<[number, number][]>([])
  const [showGraphEdges, setShowGraphEdges] = useState(true)
  const [showRealStreetFlow, setShowRealStreetFlow] = useState(true)

  // Animated courier vehicle state
  const [vehicleIndex, setVehicleIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [bearing, setBearing] = useState(0)

  // Fetch real road street geometry
  useEffect(() => {
    if (!route?.waypoints || route.waypoints.length < 2) {
      setRoadLatLngs([])
      return
    }
    fetchRealRoadGeometry(route.waypoints).then((coords) => {
      if (coords && coords.length > 0) {
        setRoadLatLngs(coords)
        setVehicleIndex(0)
      }
    })
  }, [route?.waypoints])

  useEffect(() => {
    if (!route?.alternative_waypoints || route.alternative_waypoints.length < 2) {
      setAltRoadLatLngs([])
      return
    }
    fetchRealRoadGeometry(route.alternative_waypoints).then((coords) => {
      if (coords && coords.length > 0) setAltRoadLatLngs(coords)
    })
  }, [route?.alternative_waypoints])

  // Vehicle animation loop
  useEffect(() => {
    if (!isPlaying || roadLatLngs.length < 2) return

    const interval = setInterval(() => {
      setVehicleIndex((prev) => {
        const next = (prev + 1 * speedMultiplier) % roadLatLngs.length
        const currentPt = roadLatLngs[Math.floor(prev)]
        const nextPt = roadLatLngs[Math.min(Math.floor(next) + 1, roadLatLngs.length - 1)]
        if (currentPt && nextPt) {
          const brng = calculateBearing(currentPt[0], currentPt[1], nextPt[0], nextPt[1])
          setBearing(brng)
        }
        return next
      })
    }, 45)

    return () => clearInterval(interval)
  }, [isPlaying, roadLatLngs, speedMultiplier])

  // Current interpolated vehicle position
  const currentVehiclePos = useMemo<[number, number] | null>(() => {
    if (roadLatLngs.length < 2) return null
    const idx = Math.min(Math.floor(vehicleIndex), roadLatLngs.length - 1)
    return roadLatLngs[idx] || roadLatLngs[0]
  }, [roadLatLngs, vehicleIndex])

  // Custom Vehicle Leaflet DivIcon
  const vehicleIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="transform: rotate(${bearing}deg); transition: transform 0.15s ease-out;" class="courier-marker-container">
          <div style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #080a10;
            border: 2px solid #38BDF8;
            box-shadow: 0 0 16px rgba(56, 189, 248, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
          " class="courier-pulse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#38BDF8" stroke="#080a10" stroke-width="1.5">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    })
  }, [bearing])

  const nodeMap = new Map(nodes.map((n) => [n.name, n]))
  const progressPercent = roadLatLngs.length > 0 ? Math.round((vehicleIndex / roadLatLngs.length) * 100) : 0

  return (
    <div className="relative w-full h-full bg-[#080808]">
      <MapContainer
        center={DELHI_CENTER}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController center={DELHI_CENTER} />

        {/* Esri World Dark Gray Base — Ultra clean, crisp, 100% watermark-free */}
        <TileLayer
          url="https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri &mdash; OpenStreetMap contributors'
          maxZoom={16}
        />

        {/* Neo4j Graph Topology Layer: subtle dark vectors */}
        {showGraphEdges &&
          edges.map((e) => {
            const a = nodeMap.get(e.from_node)
            const b = nodeMap.get(e.to_node)
            if (!a || !b) return null
            return (
              <Polyline
                key={`edge-${e.from_node}-${e.to_node}`}
                positions={[[a.lat, a.lon], [b.lat, b.lon]]}
                pathOptions={{
                  color: 'rgba(255,255,255,0.08)',
                  weight: 1.5,
                  dashArray: '3,6',
                }}
              />
            )
          })}

        {/* Alternative secondary route (OSRM street curve + dashed purple) */}
        {altRoadLatLngs.length > 1 && (
          <>
            <Polyline
              positions={altRoadLatLngs}
              pathOptions={{
                color: '#A855F7',
                weight: 6,
                opacity: 0.25,
              }}
            />
            <Polyline
              positions={altRoadLatLngs}
              className="animated-alt-route"
              pathOptions={{
                color: '#C084FC',
                weight: 3,
                opacity: 0.8,
              }}
            />
          </>
        )}

        {/* Primary Safe Route (OSRM street curves + animated flowing neon cyan) */}
        {roadLatLngs.length > 1 && (
          <>
            {/* Outer ambient glow */}
            <Polyline
              positions={roadLatLngs}
              pathOptions={{
                color: route?.status === 'no_safe_route' ? '#EF4444' : '#0284C7',
                weight: 10,
                opacity: 0.35,
              }}
            />

            {/* Base road route line */}
            <Polyline
              positions={roadLatLngs}
              pathOptions={{
                color: route?.status === 'no_safe_route' ? '#EF4444' : '#0EA5E9',
                weight: 4.5,
                opacity: 0.9,
              }}
            />

            {/* Google Maps style animated traffic dash flow */}
            {showRealStreetFlow && route?.status !== 'no_safe_route' && (
              <Polyline
                positions={roadLatLngs}
                className="animated-flowing-route"
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 2.5,
                  opacity: 0.95,
                }}
              />
            )}
          </>
        )}

        {/* Animated Courier Delivery Vehicle Marker */}
        {currentVehiclePos && route?.status === 'ok' && (
          <Marker position={currentVehiclePos} icon={vehicleIcon}>
            <Popup className="custom-leaflet-popup">
              <div className="p-2.5 bg-[#0a0b0e] text-white rounded-xl border border-cyan-500/40 shadow-xl font-mono text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>ECO-DISPATCH UNIT #1</span>
                </div>
                <p className="text-white/70 text-[10px]">
                  Real-time GPS following Neo4j safe air corridor
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                  <span className="text-white/50">Speed:</span>
                  <span className="text-emerald-400 font-bold">36 KM/H</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* All spatial nodes (Neo4j Graph Layer) */}
        {nodes.map((node) => (
          <NodeCircle
            key={node.name}
            node={node}
            isOnRoute={routeNames.has(node.name)}
            isAvoided={avoidedNames.has(node.name)}
          />
        ))}
      </MapContainer>

      {/* Floating Google Maps Live Navigation Cockpit HUD */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Navigation Card */}
        <div className="glass px-4 py-3 rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl shadow-2xl flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            <Compass className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold tracking-widest text-cyan-400 uppercase">
                REAL-TIME ROUTE SIMULATION
              </span>
              <span className="font-mono text-[8px] px-1.5 py-0.2 rounded bg-white/[0.06] text-white/70">
                OSRM + NEO4J
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-semibold text-white font-mono">
                {progressPercent}% EN ROUTE
              </span>
              <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-white/10" />

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause' : 'Play'}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/15 text-white border border-white/10 transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
            </button>
            <button
              type="button"
              onClick={() => setVehicleIndex(0)}
              title="Reset to Origin"
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSpeedMultiplier((s) => (s === 1 ? 2 : s === 2 ? 4 : 1))}
              className="px-2 py-1 rounded-xl bg-white/[0.05] hover:bg-white/15 text-[9px] font-mono font-bold text-cyan-300 border border-white/10 transition-all"
            >
              {speedMultiplier}X
            </button>
          </div>
        </div>

        {/* Layer Controls Pill */}
        <div className="glass px-3 py-1.5 rounded-xl border border-white/10 bg-black/80 backdrop-blur-md flex items-center gap-3 w-fit">
          <div className="flex items-center gap-1.5 text-white/40 font-mono text-[9px]">
            <Layers className="w-3 h-3" /> LAYERS:
          </div>
          <button
            type="button"
            onClick={() => setShowRealStreetFlow(!showRealStreetFlow)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
              showRealStreetFlow
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                : 'text-white/40 border-white/5 hover:text-white/70'
            }`}
          >
            Street Flow
          </button>
          <button
            type="button"
            onClick={() => setShowGraphEdges(!showGraphEdges)}
            className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
              showGraphEdges
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                : 'text-white/40 border-white/5 hover:text-white/70'
            }`}
          >
            Neo4j Grid
          </button>
        </div>
      </div>

      {/* Route Legend Indicator */}
      <div className="absolute bottom-6 left-6 z-[1000] glass px-4 py-2.5 rounded-xl border border-white/10 bg-black/85 backdrop-blur-md flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-1.5 rounded bg-cyan-400 shadow-sm" />
          <span className="font-mono text-[9px] text-white/90 font-bold">REAL ROAD SAFE CORRIDOR</span>
        </div>
        {altRoadLatLngs.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 rounded bg-purple-400 border border-purple-400 border-dashed" />
            <span className="font-mono text-[9px] text-purple-300 font-bold">
              ALT CONTINGENCY ({route?.alternative_total_km} KM)
            </span>
          </div>
        )}
      </div>

      {/* No-safe-route alert overlay */}
      {route?.status === 'no_safe_route' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] glass px-6 py-4 rounded-2xl flex items-center gap-4 border border-red-500/40 shadow-2xl bg-black/90 backdrop-blur-md animate-pulse">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-mono text-xs font-bold tracking-widest text-red-400 uppercase">
              NO SAFE ROUTE FOUND
            </p>
            <p className="text-xs text-white/70 mt-0.5">
              All physical pathways pass through Hazardous zones (AQI &gt; 400). Manual dispatch required.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
