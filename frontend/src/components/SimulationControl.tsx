import { useState } from 'react'
import toast from 'react-hot-toast'
import { API } from '../api'
import { useRouteStore } from '../store/routeStore'

export function SimulationControl() {
  const { nodes, setRoute, appendEvent } = useRouteStore()
  const [selected, setSelected] = useState('')
  const [spikeValue, setSpikeValue] = useState(487)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [context, setContext] = useState('')

  const neighborhoods = nodes.filter((n) => n.type === 'neighborhood')

  const triggerSpike = async () => {
    if (!selected) return
    setLoading(true)
    setContext('')
    try {
      const res = await fetch(API.aqiSimulate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neighborhood: selected, spike_value: spikeValue }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.route) setRoute(data.route)
        if (data.context) setContext(data.context)
        appendEvent({
          type: 'spike',
          time: new Date().toISOString(),
          detail: `🚨 Simulated: ${selected} → AQI ${spikeValue}`,
        })
        // WebSocket will also broadcast — toast shown there
      } else {
        toast.error(data.error || 'Simulation failed')
      }
    } catch (e) {
      toast.error('API error during simulation')
    }
    setLoading(false)
  }

  const resetSpike = async () => {
    if (!selected) return
    setResetting(true)
    setContext('')
    try {
      const res = await fetch(API.aqiReset, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neighborhood: selected }),
      })
      const data = await res.json()
      if (data.success && data.route) {
        setRoute(data.route)
        toast.success(`↩ ${selected} restored to live AQI`)
      }
    } catch (e) {
      toast.error('Reset failed')
    }
    setResetting(false)
  }

  return (
    <div className="glass p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-red-400">⚡</span>
        <p className="mono-label text-red-400/80">Simulate AQI Spike</p>
      </div>

      {/* Node selector */}
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-white/30 cursor-pointer"
        style={{ fontFamily: 'Geist Mono, monospace', fontSize: 11 }}
      >
        <option value="" style={{ background: '#080808' }}>— Select Neighbourhood —</option>
        {neighborhoods.map((n) => (
          <option key={n.name} value={n.name} style={{ background: '#080808' }}>
            {n.name} (AQI {n.aqi})
          </option>
        ))}
      </select>

      {/* Spike value */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="mono-label text-[8px] mb-1">Spike Value</p>
          <input
            type="number"
            value={spikeValue}
            min={50}
            max={999}
            onChange={(e) => setSpikeValue(Number(e.target.value))}
            className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white/30"
            style={{ fontFamily: 'Geist Mono, monospace', fontSize: 13 }}
          />
        </div>
        <div className="mt-5">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: spikeValue > 400 ? '#800000'
                : spikeValue > 300 ? '#FF0000'
                : spikeValue > 200 ? '#FF9900'
                : spikeValue > 100 ? '#FFFF00'
                : '#00B050',
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          className="danger-btn flex-1 text-[9px]"
          onClick={triggerSpike}
          disabled={!selected || loading}
        >
          {loading ? '...' : '🚨 TRIGGER SPIKE'}
        </button>
        <button
          className="silver-btn text-[9px]"
          onClick={resetSpike}
          disabled={!selected || resetting}
        >
          {resetting ? '...' : '↩ RESET'}
        </button>
      </div>

      {/* Tavily Context */}
      {context && (
        <div className="border border-white/[0.06] rounded-lg p-3 mt-1">
          <p className="mono-label text-[8px] text-white/40 mb-1">📰 TAVILY CONTEXT</p>
          <p className="text-xs text-white/60 leading-relaxed">{context}</p>
        </div>
      )}
    </div>
  )
}
