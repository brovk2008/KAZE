import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { Header } from './components/Header'
import { MapPanel } from './components/MapPanel'
import { SidePanel } from './components/SidePanel'
import { useRouteWebSocket } from './hooks/useRouteWebSocket'
import { useRouteStore } from './store/routeStore'
import { API } from './api'
import type { GraphNode, GraphEdge, RouteResult } from './types'

export function App() {
  const { setNodes, setEdges, setRoute } = useRouteStore()
  useRouteWebSocket()

  const { data: graphData } = useQuery<{ nodes: GraphNode[]; edges: GraphEdge[] }>({
    queryKey: ['graph'],
    queryFn: () => fetch(API.graph).then((r) => r.json()),
    refetchInterval: 60_000,
  })

  const { data: routeData } = useQuery<RouteResult>({
    queryKey: ['route'],
    queryFn: () => fetch(API.route()).then((r) => r.json()),
    refetchInterval: 30_000,
  })

  const { data: health } = useQuery<{ last_aqi_sync: string }>({
    queryKey: ['health'],
    queryFn: () => fetch(API.health).then((r) => r.json()),
    refetchInterval: 10_000,
  })

  useEffect(() => {
    if (graphData?.nodes) setNodes(graphData.nodes)
    if (graphData?.edges) setEdges(graphData.edges)
  }, [graphData, setNodes, setEdges])

  useEffect(() => {
    if (routeData) setRoute(routeData)
  }, [routeData, setRoute])

  return (
    <div className="flex flex-col h-screen bg-[#080808]">
      <Header lastSync={health?.last_aqi_sync} />
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
