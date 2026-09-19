import { useRouteStore } from '../store/routeStore'
import { Radio, RefreshCw, Cpu } from 'lucide-react'

interface Props {
  lastSync?: string
}

export function Header({ lastSync }: Props) {
  const { liveConnected } = useRouteStore()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-[#0a0b0e]/90 backdrop-blur-md z-10 relative flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 shadow-lg">
          <Cpu className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.4em] text-cyan-400 font-semibold uppercase">
              PS-1A · NEO4J AURA
            </span>
          </div>
          <h1 className="font-serif italic text-2xl text-white font-light tracking-wide leading-none mt-0.5">
            EcoRoute <span className="text-xs font-mono not-italic text-white/40">KAZE</span>
          </h1>
        </div>

        <div className="h-8 w-px bg-white/10 hidden sm:block" />
        <p className="font-mono hidden sm:block text-[10px] text-white/50 tracking-wider">
          Delhi NCR · Dynamic Environmental Routing Engine
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-5">
        {/* AQI CPCB Legend */}
        <div className="hidden lg:flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          {[
            { label: 'Good', color: '#00B050' },
            { label: 'Moderate', color: '#FFFF00' },
            { label: 'Poor', color: '#FF9900' },
            { label: 'V.Poor', color: '#FF0000' },
            { label: 'Severe (>400)', color: '#800000' },
          ].map((cat) => (
            <div key={cat.label} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-sm"
                style={{ background: cat.color }}
              />
              <span className="font-mono text-[9px] text-white/70">{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10 hidden lg:block" />

        {/* WebSocket Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
          <Radio className={`w-3.5 h-3.5 ${liveConnected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
          <span className={`font-mono text-[10px] font-bold tracking-wider ${liveConnected ? 'text-emerald-400' : 'text-red-400'}`}>
            {liveConnected ? 'WS LIVE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Sync Timestamp */}
        {lastSync && (
          <div className="hidden sm:flex items-center gap-1.5 text-white/40 font-mono text-[9px]">
            <RefreshCw className="w-3 h-3 text-white/30" />
            <span>
              SYNC {new Date(lastSync).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
