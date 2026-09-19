import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouteStore } from '../store/routeStore'
import type { GraphNode } from '../types'

const DELHI_CENTER: [number, number] = [28.6139, 77.2090]

function aqiCircleRadius(aqi: number): number {
  if (aqi > 400) return 18
  if (aqi > 300) return 14
  if (aqi > 200) return 11
  return 9
}

function aqiBorderWeight(aqi: number): number {
  return aqi > 400 ? 3 : 1
}

interface NodeCircleProps {
  node: GraphNode
  isOnRoute: boolean
  isAvoided: boolean
}

function NodeCircle({ node, isOnRoute, isAvoided }: NodeCircleProps) {
  const radius = node.type === 'warehouse' || node.type === 'customer'
    ? 10
    : aqiCircleRadius(node.aqi)

  const color = node.type === 'warehouse'
    ? '#FFFFFF'
    : node.type === 'customer'
      ? '#FFFFFF'
      : node.hex || '#94A3B8'

  const opacity = isAvoided ? 0.9 : isOnRoute ? 1.0 : 0.55

  return (
    <CircleMarker
      center={[node.lat, node.lon]}
      radius={radius}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: opacity,
        weight: aqiBorderWeight(node.aqi),
        opacity: 1,
      }}
    >
      <Popup>
        <div style={{ minWidth: 160 }}>
          <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4 }}>
            {node.type}
          </p>
          <p style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic', fontSize: 16, color: '#fff', marginBottom: 6 }}>
            {node.name}
          </p>
          {node.type === 'neighborhood' && (
            <>
              <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>
                AQI: <strong style={{ color: node.hex }}>{node.aqi}</strong>
              </p>
              <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11, color: node.hex, marginTop: 2 }}>
                {node.category}
              </p>
              {node.aqi > 400 && (
                <p style={{ fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#FF4444', marginTop: 6, letterSpacing: '0.1em' }}>
                  ⚠ ROUTE AVOIDS THIS ZONE
                </p>
              )}
            </>
          )}
        </div>
      </Popup>
      {(node.type === 'warehouse' || node.type === 'customer') && (
        <Tooltip permanent direction="top" offset={[0, -8]}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 9, letterSpacing: '0.2em' }}>
            {node.type === 'warehouse' ? '📦 WAREHOUSE' : '🎯 DELIVERY'}
          </span>
        </Tooltip>
      )}
    </CircleMarker>
  )
}

export function MapPanel() {
  const { route, nodes, edges } = useRouteStore()

  const routeNames = new Set(route?.waypoints.map((w) => w.name) ?? [])
  const avoidedNames = new Set(route?.avoided ?? [])

  // Build polyline from route waypoints
  const routeLatLngs: [number, number][] = (route?.waypoints ?? []).map((w) => [w.lat, w.lon])

  // Build edge lines for the full graph (dimmed)
  const nodeMap = new Map(nodes.map((n) => [n.name, n]))

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={DELHI_CENTER}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Full graph edges (very dim) */}
        {edges.map((e) => {
          const a = nodeMap.get(e.from_node)
          const b = nodeMap.get(e.to_node)
          if (!a || !b) return null
          return (
            <Polyline
              key={`edge-${e.from_node}-${e.to_node}`}
              positions={[[a.lat, a.lon], [b.lat, b.lon]]}
              pathOptions={{ color: 'rgba(255,255,255,0.06)', weight: 1, dashArray: '4,6' }}
            />
          )
        })}

        {/* Active route polyline */}
        {routeLatLngs.length > 1 && (
          <Polyline
            positions={routeLatLngs}
            pathOptions={{
              color: '#E2E8F0',
              weight: 3,
              opacity: 0.9,
              dashArray: route?.status === 'no_safe_route' ? '6,6' : undefined,
            }}
          />
        )}

        {/* All nodes */}
        {nodes.map((node) => (
          <NodeCircle
            key={node.name}
            node={node}
            isOnRoute={routeNames.has(node.name)}
            isAvoided={avoidedNames.has(node.name)}
          />
        ))}
      </MapContainer>

      {/* No-safe-route overlay */}
      {route?.status === 'no_safe_route' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] glass px-6 py-3 flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <div>
            <p className="mono-label text-red-400">NO SAFE ROUTE</p>
            <p className="text-xs text-white/60 mt-0.5">All paths blocked — manual dispatch required</p>
          </div>
        </div>
      )}
    </div>
  )
}
