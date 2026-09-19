import { useRouteStore } from '../store/routeStore'

interface Props {
  lastSync?: string
}

export function Header({ lastSync }: Props) {
  const { liveConnected } = useRouteStore()

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] z-10 relative flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <img
          src="/logo.png"
          alt="KAZE"
          className="h-10 w-auto flex-shrink-0"
          style={{ filter: 'invert(1) brightness(0.92) contrast(0.95)' }}
        />
        <div>
          <p className="mono-label text-[9px] tracking-[0.5em]">PS-1A · NEO4J HACKATHON</p>
          <h1 className="serif-italic silver-text text-2xl leading-none mt-0.5">EcoRoute</h1>
        </div>
        <div className="h-8 w-px bg-white/10 hidden sm:block" />
        <p className="mono-label hidden sm:block text-[9px]">Delhi NCR · Air Quality Routing Engine</p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4">
        {/* AQI legend */}
        <div className="hidden lg:flex items-center gap-3">
          {[
            { label: 'Good', color: '#00B050' },
            { label: 'Moderate', color: '#FFFF00' },
            { label: 'Poor', color: '#FF9900' },
            { label: 'V.Poor', color: '#FF0000' },
            { label: 'Severe', color: '#800000' },
          ].map((cat) => (
            <div key={cat.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
              <span className="mono-label text-[8px]">{cat.label}</span>
            </div>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10 hidden lg:block" />

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full blink ${liveConnected ? 'bg-emerald-400' : 'bg-red-500'}`}
          />
          <span className="mono-label text-[9px]">{liveConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {lastSync && (
          <>
            <div className="h-5 w-px bg-white/10" />
            <span className="mono-label text-[8px] text-white/30">
              sync {new Date(lastSync).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
            </span>
          </>
        )}
      </div>
    </header>
  )
}
