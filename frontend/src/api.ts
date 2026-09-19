const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
const API_BASE = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8000' : 'https://ecoroute-api-fg15.onrender.com')

export const API = {
  route: (customer?: string) =>
    `${API_BASE}/api/route${customer ? `?customer=${encodeURIComponent(customer)}` : ''}`,
  graph: `${API_BASE}/api/graph`,
  aqiLive: `${API_BASE}/api/aqi/live`,
  aqiSync: `${API_BASE}/api/aqi/sync`,
  aqiSimulate: `${API_BASE}/api/aqi/simulate`,
  aqiReset: `${API_BASE}/api/aqi/reset`,
  news: `${API_BASE}/api/news`,
  health: `${API_BASE}/health`,
  ws: `${(API_BASE.replace('https://', 'wss://').replace('http://', 'ws://'))}/ws/route-updates`,
}

