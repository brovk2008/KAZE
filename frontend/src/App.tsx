import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { Header } from './components/Header'
import { KpiBar } from './components/KpiBar'
import { MapPanel } from './components/MapPanel'
import { SidePanel } from './components/SidePanel'
import { useRouteWebSocket } from './hooks/useRouteWebSocket'
import { useRouteStore } from './store/routeStore'
import { API } from './api'
import type { GraphNode, GraphEdge, RouteResult } from './types'

export function App() {
  const { selectedCustomer, setNodes, setEdges, setRoute } = useRouteStore()
  useRouteWebSocket()

  const { data: graphData } = useQuery<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    queryKey: ['graph'],
    queryFn: async () => {
      const r = await fetch(API.graph)
      if (!r.ok) throw new Error('Graph fetch failed')
      return r.json()
    },
    refetchInterval: 60_000,
    retry: 2,
  })

  const { data: routeData } = useQuery<RouteResult>({
    queryKey: ['route', selectedCustomer],
    queryFn: async () => {
      const r = await fetch(API.route(selectedCustomer))
      if (!r.ok) throw new Error('Route fetch failed')
      return r.json()
    },
    refetchInterval: 30_000,
    retry: 2,
  })

  const { data: health } = useQuery<{ last_aqi_sync: string }>({
    queryKey: ['health'],
    queryFn: async () => {
      const r = await fetch(API.health)
      if (!r.ok) throw new Error('Health check failed')
      return r.json()
    },
    refetchInterval: 10_000,
    retry: 1,
  })

  useEffect(() => {
    if (graphData?.nodes && graphData.nodes.length > 0) setNodes(graphData.nodes)
    if (graphData?.edges && graphData.edges.length > 0) setEdges(graphData.edges)
  }, [graphData, setNodes, setEdges])

  useEffect(() => {
    if (routeData && routeData.waypoints) setRoute(routeData)
  }, [routeData, setRoute])

  return (
    <div className="flex flex-col h-screen bg-[#080808] select-none">
      <Header lastSync={health?.last_aqi_sync} />
      <KpiBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MapPanel />
        </div>
        <SidePanel />
      </div>
      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            background: 'rgba(8,8,8,0.95)',
            color: '#E2E8F0',
            border: '1px solid rgba(255,255,255,0.12)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: 12,
          },
        }}
      />
    </div>
  )
}
