import { useState } from 'react'
import { useRouteStore } from '../store/routeStore'
import { SimulationControl } from './SimulationControl'
import { NewsPanel } from './NewsPanel'

type Tab = 'route' | 'aqi' | 'events' | 'news'

export function SidePanel() {
  const [tab, setTab] = useState<Tab>('route')
  const { route, nodes, events } = useRouteStore()

  const neighborhoods = nodes.filter((n) => n.type === 'neighborhood')

  return (
    <div className="w-80 flex flex-col border-l border-white/[0.06] overflow-hidden flex-shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06] flex-shrink-0">
        {(['route', 'aqi', 'events', 'news'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 mono-label text-[8px] transition-colors ${
              tab === t
                ? 'text-white border-b border-white/50 -mb-px'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* ── ROUTE TAB ─────────────────────────────────────── */}
        {tab === 'route' && (
          <>
            <div className="glass p-4 space-y-3">
              <p className="mono-label text-[9px]">Current Route</p>

              {route ? (
                <>
                  {/* Stats */}
                  <div className="flex gap-3">
                    <div className="flex-1 border border-white/[0.06] rounded-lg p-3 text-center">
                      <p className="text-2xl font-light text-white">{route.total_km}</p>
                      <p className="mono-label text-[8px] text-white/40">KM</p>
                    </div>
                    <div className="flex-1 border border-white/[0.06] rounded-lg p-3 text-center">
                      <p className="text-2xl font-light text-white">{route.hops}</p>
                      <p className="mono-label text-[8px] text-white/40">HOPS</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div
                    className={`rounded-lg px-3 py-2 text-center ${
                      route.status === 'ok'
                        ? 'bg-emerald-900/20 border border-emerald-500/20'
                        : 'bg-red-900/20 border border-red-500/20'
                    }`}
                  >
                    <p
                      className={`mono-label text-[9px] ${
                        route.status === 'ok' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {route.status === 'ok' ? '✓ SAFE ROUTE FOUND' : '✗ NO SAFE ROUTE'}
                    </p>
                  </div>

                  {/* Waypoints */}
                  {route.waypoints.length > 0 && (
                    <div className="space-y-1">
                      <p className="mono-label text-[8px] text-white/40">WAYPOINTS</p>
                      {route.waypoints.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 py-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: w.hex || '#94A3B8' }}
                          />
                          <span className="text-xs text-white/70 flex-1 truncate">{w.name}</span>
                          {w.type !== 'neighborhood' && (
                            <span className="mono-label text-[7px] text-white/30 ml-auto">
                              {w.type}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Avoided */}
                  {route.avoided.length > 0 && (
                    <div className="space-y-1">
                      <p className="mono-label text-[8px] text-red-400/60">AVOIDED (AQI &gt; 400)</p>
                      {route.avoided.map((name) => (
                        <div key={name} className="flex items-center gap-2 py-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                          <span className="text-xs text-red-400/70">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-white/30 text-center py-4">Loading route...</p>
              )}
            </div>

            <SimulationControl />
          </>
        )}

        {/* ── AQI TAB ───────────────────────────────────────── */}
        {tab === 'aqi' && (
          <div className="glass p-4">
            <p className="mono-label text-[9px] mb-3">
              Live AQI — {neighborhoods.length} nodes
            </p>
            <div className="space-y-0.5">
              {neighborhoods
                .slice()
                .sort((a, b) => b.aqi - a.aqi)
                .map((n) => (
                  <div
                    key={n.name}
                    className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: n.hex || '#94A3B8' }}
                    />
                    <span className="text-xs text-white/70 flex-1 truncate">{n.name}</span>
                    <span
                      className="mono-label text-[9px]"
                      style={{ color: n.hex || '#94A3B8' }}
                    >
                      {n.aqi}
                    </span>
                    <span className="mono-label text-[7px] text-white/30 w-16 text-right truncate">
                      {n.category}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── EVENTS TAB ────────────────────────────────────── */}
        {tab === 'events' && (
          <div className="glass p-4">
            <p className="mono-label text-[9px] mb-3">Event Log</p>
            {events.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-6">
                Waiting for events...
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className={`border-l-2 pl-3 py-1 ${
                      ev.type === 'spike'
                        ? 'border-red-500/40'
                        : ev.type === 'sync'
                          ? 'border-emerald-500/30'
                          : 'border-white/10'
                    }`}
                  >
                    <p className="text-[10px] text-white/60 leading-relaxed">{ev.detail}</p>
                    <p className="mono-label text-[7px] text-white/25 mt-0.5">
                      {new Date(ev.time).toLocaleTimeString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEWS TAB ──────────────────────────────────────── */}
        {tab === 'news' && <NewsPanel />}
      </div>
    </div>
  )
}
