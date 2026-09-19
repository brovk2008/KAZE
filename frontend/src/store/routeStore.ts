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

const INITIAL_NODES: GraphNode[] = [
  { name: 'Okhla Industrial Estate', lat: 28.5398, lon: 77.2706, aqi: 0, category: 'N/A', hex: '#FFFFFF', last_updated: '', type: 'warehouse' },
  { name: 'Connaught Place Delivery', lat: 28.6295, lon: 77.2205, aqi: 0, category: 'N/A', hex: '#FFFFFF', last_updated: '', type: 'customer' },
  { name: 'Rohini Sector 18 Delivery', lat: 28.7293, lon: 77.1210, aqi: 0, category: 'N/A', hex: '#FFFFFF', last_updated: '', type: 'customer' },
  { name: 'Okhla Phase 2', lat: 28.5280, lon: 77.2736, aqi: 187, category: 'Moderate', hex: '#FFFF00', last_updated: '', type: 'neighborhood' },
  { name: 'Nehru Nagar', lat: 28.5673, lon: 77.2536, aqi: 220, category: 'Poor', hex: '#FF9900', last_updated: '', type: 'neighborhood' },
  { name: 'ITO', lat: 28.6328, lon: 77.2402, aqi: 312, category: 'Very Poor', hex: '#FF0000', last_updated: '', type: 'neighborhood' },
  { name: 'Connaught Place', lat: 28.6329, lon: 77.2195, aqi: 195, category: 'Moderate', hex: '#FFFF00', last_updated: '', type: 'neighborhood' },
  { name: 'RK Puram', lat: 28.5672, lon: 77.1878, aqi: 198, category: 'Moderate', hex: '#FFFF00', last_updated: '', type: 'neighborhood' },
  { name: 'Shadipur', lat: 28.6540, lon: 77.1445, aqi: 264, category: 'Poor', hex: '#FF9900', last_updated: '', type: 'neighborhood' },
  { name: 'Punjabi Bagh', lat: 28.6681, lon: 77.1280, aqi: 301, category: 'Very Poor', hex: '#FF0000', last_updated: '', type: 'neighborhood' },
  { name: 'Anand Vihar', lat: 28.6469, lon: 77.3152, aqi: 264, category: 'Poor', hex: '#FF9900', last_updated: '', type: 'neighborhood' },
  { name: 'Wazirpur', lat: 28.6908, lon: 77.1587, aqi: 342, category: 'Very Poor', hex: '#FF0000', last_updated: '', type: 'neighborhood' },
  { name: 'Jahangirpuri', lat: 28.7300, lon: 77.1665, aqi: 388, category: 'Very Poor', hex: '#FF0000', last_updated: '', type: 'neighborhood' },
  { name: 'Rohini', lat: 28.7293, lon: 77.1210, aqi: 195, category: 'Moderate', hex: '#FFFF00', last_updated: '', type: 'neighborhood' },
  { name: 'Dwarka Sec 8', lat: 28.5823, lon: 77.0637, aqi: 220, category: 'Poor', hex: '#FF9900', last_updated: '', type: 'neighborhood' },
  { name: 'Mandir Marg', lat: 28.6430, lon: 77.2021, aqi: 178, category: 'Moderate', hex: '#FFFF00', last_updated: '', type: 'neighborhood' },
]

const INITIAL_EDGES: GraphEdge[] = [
  { from_node: 'Okhla Industrial Estate', to_node: 'Okhla Phase 2', distance: 2.1 },
  { from_node: 'Okhla Phase 2', to_node: 'Nehru Nagar', distance: 3.8 },
  { from_node: 'Okhla Phase 2', to_node: 'ITO', distance: 7.2 },
  { from_node: 'Nehru Nagar', to_node: 'RK Puram', distance: 4.5 },
  { from_node: 'Nehru Nagar', to_node: 'ITO', distance: 5.1 },
  { from_node: 'ITO', to_node: 'Connaught Place', distance: 3.9 },
  { from_node: 'ITO', to_node: 'Mandir Marg', distance: 4.2 },
  { from_node: 'ITO', to_node: 'Anand Vihar', distance: 8.4 },
  { from_node: 'Connaught Place', to_node: 'Mandir Marg', distance: 2.1 },
  { from_node: 'Connaught Place', to_node: 'Shadipur', distance: 6.8 },
  { from_node: 'RK Puram', to_node: 'Dwarka Sec 8', distance: 12.3 },
  { from_node: 'RK Puram', to_node: 'Shadipur', distance: 7.4 },
  { from_node: 'Shadipur', to_node: 'Punjabi Bagh', distance: 4.8 },
  { from_node: 'Shadipur', to_node: 'Wazirpur', distance: 5.2 },
  { from_node: 'Punjabi Bagh', to_node: 'Rohini', distance: 9.1 },
  { from_node: 'Punjabi Bagh', to_node: 'Dwarka Sec 8', distance: 14.7 },
  { from_node: 'Wazirpur', to_node: 'Jahangirpuri', distance: 4.3 },
  { from_node: 'Wazirpur', to_node: 'Rohini', distance: 6.2 },
  { from_node: 'Jahangirpuri', to_node: 'Rohini', distance: 5.8 },
  { from_node: 'Anand Vihar', to_node: 'Wazirpur', distance: 11.3 },
  { from_node: 'Mandir Marg', to_node: 'Connaught Place Delivery', distance: 1.8 },
  { from_node: 'Connaught Place', to_node: 'Connaught Place Delivery', distance: 0.9 },
  { from_node: 'Rohini', to_node: 'Rohini Sector 18 Delivery', distance: 1.2 },
]

export const useRouteStore = create<RouteStore>((set) => ({
  route: null,
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
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
        ...state.events.slice(0, 49),
      ],
    })),

  updateNodeAqi: (name, aqi, category, hex) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.name === name ? { ...n, aqi, category, hex } : n,
      ),
    })),
}))
