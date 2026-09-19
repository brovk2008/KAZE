import { useState } from 'react'
import { useRouteStore } from '../store/routeStore'
import { SimulationControl } from './SimulationControl'
import { NewsPanel } from './NewsPanel'
import { API } from '../api'
import {
  Navigation,
  Activity,
  Radio,
  Newspaper,
  ShieldAlert,
  CheckCircle2,
  MapPin,
  Flame,
  Clock,
  RefreshCw,
  GitBranch,
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'route' | 'aqi' | 'events' | 'news'

export function SidePanel() {
  const [tab, setTab] = useState<Tab>('route')
  const [recomputing, setRecomputing] = useState(false)
  const { route, nodes, events, selectedCustomer, setRoute, appendEvent } = useRouteStore()

  const neighborhoods = nodes.filter((n) => n.type === 'neighborhood')
  const sortedNeighborhoods = [...neighborhoods].sort((a, b) => b.aqi - a.aqi)

  // Estimated driving time in Delhi traffic (~28 km/h avg)
  const estMins = route?.total_km ? Math.round((route.total_km / 28) * 60) : 0

  const handleManualRecalculate = async () => {
    setRecomputing(true)
    try {
      const res = await fetch(API.route(selectedCustomer))
      if (res.ok) {
        const data = await res.json()
        setRoute(data)
        appendEvent({
          type: 'info',
          time: new Date().toISOString(),
          detail: `Manual Cypher route recalculation: ${data.total_km} km, ${data.hops} hops`,
        })
        toast.success('Route updated from Neo4j Aura')
      } else {
        toast.error('Could not compute route')
      }
    } catch {
      toast.error('Network error reaching route engine')
    } finally {
      setRecomputing(false)
    }
  }

  return (
    <div className="w-96 flex flex-col border-l border-white/[0.08] bg-[#0b0c10]/95 backdrop-blur-xl overflow-hidden flex-shrink-0 shadow-2xl">
      {/* Tab Bar */}
      <div className="flex border-b border-white/[0.08] flex-shrink-0 bg-black/40">
        {[
          { id: 'route', label: 'Route', icon: Navigation },
          { id: 'aqi', label: 'AQI Grid', icon: Activity },
          { id: 'events', label: 'Log', icon: Radio },
          { id: 'news', label: 'Intel', icon: Newspaper },
        ].map((item) => {
          const Icon = item.icon
          const isActive = tab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as Tab)}
              className={`flex-1 py-3 font-mono text-[9px] font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/[0.04]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label.toUpperCase()}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── ROUTE TAB ─────────────────────────────────────── */}
        {tab === 'route' && (
          <>
            {/* Active Route Card */}
            <div className="glass p-4 rounded-2xl border border-white/10 space-y-3.5 bg-gradient-to-b from-white/[0.03] to-transparent shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> LOGISTICS CORRIDOR
                </span>
                <div className="flex items-center gap-1.5">
                  {route?.status === 'ok' && (
                    <span className="font-mono text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      CYPHER OPTIMAL
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleManualRecalculate}
                    disabled={recomputing}
                    title="Recalculate path"
                    className="p-1 rounded-md text-white/40 hover:text-cyan-400 hover:bg-white/[0.05] transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${recomputing ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                </div>
              </div>

              {route ? (
                <>
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-white/10 rounded-xl p-2.5 text-center bg-white/[0.02]">
                      <p className="text-xl font-mono font-bold text-white">{route.total_km}</p>
                      <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest mt-0.5">
                        DISTANCE (KM)
                      </p>
                    </div>
                    <div className="border border-white/10 rounded-xl p-2.5 text-center bg-white/[0.02]">
                      <p className="text-xl font-mono font-bold text-white">{route.hops}</p>
                      <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest mt-0.5">
                        HOPS
                      </p>
                    </div>
                    <div className="border border-white/10 rounded-xl p-2.5 text-center bg-white/[0.02]">
                      <p className="text-xl font-mono font-bold text-cyan-300">~{estMins}</p>
                      <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest mt-0.5 flex items-center justify-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> MINS
                      </p>
                    </div>
                  </div>

                  {/* Status Clearance Badge */}
                  <div
                    className={`rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2 ${
                      route.status === 'ok'
                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-sm'
                        : 'bg-red-950/40 border border-red-500/30 text-red-400 animate-pulse'
                    }`}
                  >
                    {route.status === 'ok' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span className="font-mono text-[10px] font-bold tracking-wider">
                          ENVIRONMENTALLY SAFE CORRIDOR
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span className="font-mono text-[10px] font-bold tracking-wider">
                          NO SAFE ROUTE (AQI &gt; 400 LOCKOUT)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Alternative Route Comparison */}
                  {route.alternative_waypoints && route.alternative_waypoints.length > 0 && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-purple-300 text-[9px] font-bold">
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" /> SECONDARY CONTINGENCY PATH
                        </span>
                        <span>{route.alternative_total_km} KM</span>
                      </div>
                      <p className="text-[10px] text-white/60">
                        Provides {route.alternative_hops} hops via alternate corridors if primary route experiences unexpected congestion.
                      </p>
                    </div>
                  )}

                  {/* Waypoint Step Sequence */}
                  {route.waypoints.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[8px] text-white/40 tracking-widest uppercase">
                          TURN-BY-TURN WAYPOINTS ({route.waypoints.length})
                        </p>
                        <span className="font-mono text-[8px] text-white/30">Okhla &rarr; Dest</span>
                      </div>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {route.waypoints.map((w, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
                          >
                            <span className="font-mono text-[9px] w-4 text-white/30 text-right">
                              {i + 1}.
                            </span>
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                              style={{ background: w.hex || '#94A3B8' }}
                            />
                            <span className="text-xs text-white/90 font-medium flex-1 truncate">
                              {w.name}
                            </span>
                            {w.type === 'neighborhood' && (
                              <span
                                className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: `${w.hex}22`, color: w.hex }}
                              >
                                AQI {w.aqi}
                              </span>
                            )}
                            {w.type !== 'neighborhood' && (
                              <span
                                className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                  w.type === 'warehouse'
                                    ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
                                    : 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                                }`}
                              >
                                {w.type}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Avoided Neighborhoods */}
                  {route.avoided.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <p className="font-mono text-[8px] text-red-400/80 tracking-widest uppercase flex items-center gap-1">
                        <Flame className="w-3 h-3 text-red-400" /> AVOIDED TOXIC ZONES (AQI &gt; 400)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {route.avoided.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-950/40 border border-red-500/30 font-mono text-[9px] text-red-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs font-mono text-white/40 text-center py-4">Initializing route engine...</p>
              )}
            </div>

            {/* Simulation Controls Component */}
            <SimulationControl />
          </>
        )}

        {/* ── AQI GRID TAB ─────────────────────────────────────── */}
        {tab === 'aqi' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[9px] font-bold text-white/50 tracking-widest uppercase">
                DELHI AQI SENSORS ({neighborhoods.length})
              </span>
              <span className="font-mono text-[8px] text-cyan-400">DPCC CPCB SYNC</span>
            </div>

            <div className="space-y-2">
              {sortedNeighborhoods.map((n) => {
                const isSevere = n.aqi > 400
                return (
                  <div
                    key={n.name}
                    className={`p-3 rounded-xl border transition-all ${
                      isSevere
                        ? 'bg-red-950/30 border-red-500/40'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-white/40" />
                        {n.name}
                      </span>
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${n.hex}22`, color: n.hex }}
                      >
                        AQI {n.aqi}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (n.aqi / 500) * 100)}%`,
                          backgroundColor: n.hex,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[9px] font-mono text-white/40">
                      <span>{n.category}</span>
                      {isSevere && <span className="text-red-400 font-bold">🚫 BLOCKED</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ─────────────────────────────────────── */}
        {tab === 'events' && (
          <div className="space-y-3">
            <span className="font-mono text-[9px] font-bold text-white/50 tracking-widest uppercase px-1">
              DISPATCH AUDIT TRAIL ({events.length})
            </span>

            {events.length === 0 ? (
              <p className="text-xs font-mono text-white/30 text-center py-8">
                No events logged yet. Trigger a simulation spike to see updates.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((ev, idx) => (
                  <div
                    key={ev.id || `${ev.time}-${idx}`}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between text-[9px] text-white/40">
                      <span className="text-cyan-400 font-bold uppercase">{ev.type}</span>
                      <span>{new Date(ev.time).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <p className="text-white/80 leading-snug">{ev.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEWS TAB ─────────────────────────────────────── */}
        {tab === 'news' && <NewsPanel />}
      </div>
    </div>
  )
}
