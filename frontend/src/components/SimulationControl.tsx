import { useState } from 'react'
import toast from 'react-hot-toast'
import { API } from '../api'
import { useRouteStore } from '../store/routeStore'
import { Zap, RotateCcw, Sparkles, Loader2 } from 'lucide-react'

export function SimulationControl() {
  const { nodes, setRoute, appendEvent } = useRouteStore()
  const [selected, setSelected] = useState('')
  const [spikeValue, setSpikeValue] = useState(487)
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [context, setContext] = useState('')

  const neighborhoods = nodes.filter((n) => n.type === 'neighborhood')

  const triggerSpike = async () => {
    if (!selected) {
      toast.error('Select a neighborhood first')
      return
    }
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
        toast.success(`⚡ Spiked ${selected} to AQI ${spikeValue}`)
      } else {
        toast.error(data.error || 'Simulation failed')
      }
    } catch (e) {
      toast.error('API connection error during simulation')
    }
    setLoading(false)
  }

  const resetSpike = async () => {
    if (!selected) {
      toast.error('Select a neighborhood first')
      return
    }
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
        toast.success(`↩ Restored ${selected} to live CPCB data`)
      }
    } catch (e) {
      toast.error('Reset failed')
    }
    setResetting(false)
  }

  return (
    <div className="glass p-4 rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-950/20 to-black/40 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-400">
          <Zap className="w-4 h-4" />
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase">
            SIMULATE AQI SPIKE
          </span>
        </div>
        <span className="font-mono text-[8px] text-red-400/60 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
          DEMO ENGINE
        </span>
      </div>

      {/* Select Neighborhood */}
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-[#08090d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white/90 focus:outline-none focus:border-red-500/50 cursor-pointer"
      >
        <option value="" style={{ background: '#080808' }}>— Select Target Neighborhood —</option>
        {neighborhoods.map((n) => (
          <option key={n.name} value={n.name} style={{ background: '#080808' }}>
            {n.name} (Current: AQI {n.aqi})
          </option>
        ))}
      </select>

      {/* Quick Presets */}
      <div className="space-y-1">
        <span className="font-mono text-[8px] text-white/40 tracking-wider">HIGH RISK PRESETS:</span>
        <div className="flex gap-1.5 flex-wrap">
          {['Anand Vihar', 'Punjabi Bagh', 'Jahangirpuri'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setSelected(preset)
                setSpikeValue(487)
              }}
              className="font-mono text-[9px] px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-white/70 border border-white/10 transition-all"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Spike Value Input */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="font-mono text-[8px] text-white/40 block mb-1">TARGET AQI (50-999)</label>
          <input
            type="number"
            value={spikeValue}
            min={50}
            max={999}
            onChange={(e) => setSpikeValue(Number(e.target.value))}
            className="w-full bg-[#08090d] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={triggerSpike}
          disabled={loading || !selected}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-mono text-[10px] font-bold tracking-wider transition-all shadow-lg shadow-red-950/50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          TRIGGER SPIKE
        </button>

        <button
          type="button"
          onClick={resetSpike}
          disabled={resetting || !selected}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 disabled:opacity-40 text-white/80 font-mono text-[10px] font-bold tracking-wider border border-white/10 transition-all"
        >
          {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          RESET DATA
        </button>
      </div>

      {/* Tavily AI Context */}
      {context && (
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[9px]">
            <Sparkles className="w-3.5 h-3.5" /> AI SPIKE INTELLIGENCE (TAVILY)
          </div>
          <p className="text-white/70 leading-relaxed text-[11px]">{context}</p>
        </div>
      )}
    </div>
  )
}
