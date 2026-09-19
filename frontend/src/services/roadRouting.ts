/**
 * Real Road Routing Engine (Google Maps style road geometries)
 * Uses OSRM open-source routing to follow exact road curves, highways, and turns of Delhi NCR.
 * Overlays seamlessly with Neo4j topological decision nodes.
 */

export interface LatLng {
  lat: number
  lon: number
}

const cache = new Map<string, [number, number][]>()

export async function fetchRealRoadGeometry(
  waypoints: { lat: number; lon: number; name?: string }[],
): Promise<[number, number][]> {
  if (!waypoints || waypoints.length < 2) return []

  const key = waypoints.map((w) => `${w.lat.toFixed(4)},${w.lon.toFixed(4)}`).join(';')
  if (cache.has(key)) {
    return cache.get(key)!
  }

  try {
    // OSRM coordinates are formatted as {lon},{lat}
    const coordsStr = waypoints.map((w) => `${w.lon},${w.lat}`).join(';')
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error(`OSRM status ${res.status}`)

    const data = await res.json()
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // OSRM GeoJSON geometry is [ [lon, lat], ... ]
      // Leaflet requires [ [lat, lon], ... ]
      const rawCoords: [number, number][] = data.routes[0].geometry.coordinates
      const leafletCoords: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon])

      cache.set(key, leafletCoords)
      return leafletCoords
    }
  } catch (err) {
    console.warn('Real road routing fallback to direct waypoint vectors:', err)
  }

  // Graceful fallback to direct topological vectors
  const fallback = waypoints.map((w) => [w.lat, w.lon] as [number, number])
  cache.set(key, fallback)
  return fallback
}

/**
 * Calculate bearing (angle in degrees) between two coordinate points
 */
export function calculateBearing(startLat: number, startLon: number, destLat: number, destLon: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI

  const y = Math.sin(toRad(destLon - startLon)) * Math.cos(toRad(destLat))
  const x =
    Math.cos(toRad(startLat)) * Math.sin(toRad(destLat)) -
    Math.sin(toRad(startLat)) * Math.cos(toRad(destLat)) * Math.cos(toRad(destLon - startLon))

  const brng = toDeg(Math.atan2(y, x))
  return (brng + 360) % 360
}
