export type NodeType = 'warehouse' | 'customer' | 'neighborhood'

export interface GraphNode {
  name: string
  lat: number
  lon: number
  aqi: number
  category: string
  hex: string
  last_updated: string
  type: NodeType
}

export interface GraphEdge {
  from_node: string
  to_node: string
  distance: number
}

export interface Waypoint {
  name: string
  lat: number
  lon: number
  aqi: number
  category: string
  hex: string
  type: NodeType
}

export interface RouteResult {
  status: 'ok' | 'no_safe_route' | 'error'
  waypoints: Waypoint[]
  total_km: number
  hops: number
  avoided: string[]
  high_risk_zones?: string[]
  alternative_waypoints?: Waypoint[]
  alternative_total_km?: number
  alternative_hops?: number
  message?: string
}

export interface EventLogEntry {
  type: 'spike' | 'sync' | 'reset' | 'info' | 'system'
  time: string
  detail: string
}

export interface NewsArticle {
  title: string
  url: string
  snippet: string
  source: string
  score: number
}

export interface NewsResult {
  summary: string
  articles: NewsArticle[]
  fetched_at: string
}

export interface WsMessage {
  event: 'aqi_update' | 'aqi_sync' | 'aqi_reset' | 'pong'
  route?: RouteResult
  spiked_node?: string
  previous_aqi?: number
  new_aqi?: number
  updated_nodes?: number
  neighborhood?: string
  restored_aqi?: number
  context?: string
  timestamp?: string
}
