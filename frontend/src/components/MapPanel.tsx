import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouteStore } from '../store/routeStore'
import type { GraphNode } from '../types'
import { Package, Target, AlertTriangle, ShieldCheck } from 'lucide-react'

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
          radius={26}
          pathOptions={{
            color: '#800000',
            fillColor: '#FF0000',
            fillOpacity: 0.25,
            weight: 1,
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
          <div className="p-3 bg-[#0c0d12] text-white rounded-xl border border-white/10 shadow-2xl min-w-[200px]">
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
                    <span>TRAVERSAL BLOCKED (AQI &gt; 400)</span>
                  </div>
                ) : isOnRoute ? (
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>ON ACTIVE SAFE ROUTE</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Popup>

        {isSpecial && (
          <Tooltip permanent direction="top" offset={[0, -10]} className="custom-tooltip">
            <span className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-black/80 text-white border border-white/20 flex items-center gap-1">
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

export function MapPanel() {
  const { route, nodes, edges } = useRouteStore()

  const routeNames = new Set(route?.waypoints.map((w) => w.name) ?? [])
  const avoidedNames = new Set(route?.avoided ?? [])

  // Build polyline from primary route waypoints
  const routeLatLngs: [number, number][] = (route?.waypoints ?? []).map((w) => [w.lat, w.lon])

  // Build polyline from alternative route waypoints if present
  const altLatLngs: [number, number][] = (route?.alternative_waypoints ?? []).map((w) => [w.lat, w.lon])

  // Map nodes for lookup
  const nodeMap = new Map(nodes.map((n) => [n.name, n]))

  return (
    <div className="relative w-full h-full bg-[#080808]">
      <MapContainer
        center={DELHI_CENTER}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* CartoDB Dark Matter Tiles for Cybernetic Obsidian Theme */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Full graph topology edges (subtle dark vectors) */}
        {edges.map((e) => {
          const a = nodeMap.get(e.from_node)
          const b = nodeMap.get(e.to_node)
          if (!a || !b) return null
          return (
            <Polyline
              key={`edge-${e.from_node}-${e.to_node}`}
              positions={[[a.lat, a.lon], [b.lat, b.lon]]}
              pathOptions={{ color: 'rgba(255,255,255,0.08)', weight: 1.5, dashArray: '4,6' }}
            />
          )
        })}

        {/* Alternative secondary route polyline (dashed purple/violet) */}
        {altLatLngs.length > 1 && (
          <Polyline
            positions={altLatLngs}
            pathOptions={{
              color: '#A855F7',
              weight: 3,
              opacity: 0.7,
              dashArray: '6,6',
            }}
          />
        )}

        {/* Glow backdrop for primary active route */}
        {routeLatLngs.length > 1 && (
          <Polyline
            positions={routeLatLngs}
            pathOptions={{
              color: route?.status === 'no_safe_route' ? '#EF4444' : '#38BDF8',
              weight: 9,
              opacity: 0.35,
            }}
          />
        )}

        {/* Core primary active route line */}
        {routeLatLngs.length > 1 && (
          <Polyline
            positions={routeLatLngs}
            pathOptions={{
              color: route?.status === 'no_safe_route' ? '#F87171' : '#F8FAFC',
              weight: 3.5,
              opacity: 0.95,
              dashArray: route?.status === 'no_safe_route' ? '8,8' : undefined,
            }}
          />
        )}

        {/* All spatial nodes */}
        {nodes.map((node) => (
          <NodeCircle
            key={node.name}
            node={node}
            isOnRoute={routeNames.has(node.name)}
            isAvoided={avoidedNames.has(node.name)}
          />
        ))}
      </MapContainer>

      {/* Route Legend Indicator */}
      <div className="absolute bottom-6 left-6 z-[1000] glass px-4 py-2.5 rounded-xl border border-white/10 bg-black/80 backdrop-blur-md flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-1 rounded bg-cyan-400 shadow-sm" />
          <span className="font-mono text-[9px] text-white/80">PRIMARY SAFE PATH</span>
        </div>
        {altLatLngs.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded bg-purple-400 border border-purple-400 border-dashed" />
            <span className="font-mono text-[9px] text-purple-300">
              ALT PATH ({route?.alternative_total_km} KM)
            </span>
          </div>
        )}
      </div>

      {/* No-safe-route alert overlay */}
      {route?.status === 'no_safe_route' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] glass px-6 py-4 rounded-2xl flex items-center gap-4 border border-red-500/40 shadow-2xl bg-black/80 backdrop-blur-md animate-pulse">
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
