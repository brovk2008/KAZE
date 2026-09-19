import { create } from 'zustand'
import type { RouteResult, GraphNode, GraphEdge, EventLogEntry } from '../types'

interface RouteStore {
  route: RouteResult | null
  nodes: GraphNode[]
  edges: GraphEdge[]
  liveConnected: boolean
  events: EventLogEntry[]
  setRoute: (r: RouteResult) => void
  setNodes: (n: GraphNode[]) => void
  setEdges: (e: GraphEdge[]) => void
  setLiveConnected: (v: boolean) => void
  appendEvent: (e: Omit<EventLogEntry, 'id'>) => void
  updateNodeAqi: (name: string, aqi: number, category: string, hex: string) => void
}

export const useRouteStore = create<RouteStore>((set) => ({
  route: null,
  nodes: [],
  edges: [],
  liveConnected: false,
  events: [],

  setRoute: (r) => set({ route: r }),
  setNodes: (n) => set({ nodes: n }),
  setEdges: (e) => set({ edges: e }),
  setLiveConnected: (v) => set({ liveConnected: v }),

  appendEvent: (e) =>
    set((state) => ({
      events: [
        { ...e, id: `${Date.now()}-${Math.random()}` },
        ...state.events.slice(0, 49), // keep last 50
      ],
    })),

  updateNodeAqi: (name, aqi, category, hex) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.name === name ? { ...n, aqi, category, hex } : n,
      ),
    })),
}))
