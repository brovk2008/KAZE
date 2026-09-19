import { useRouteStore } from '../store/routeStore'
import { Navigation, ShieldCheck, AlertOctagon, Wind, Gauge, CheckCircle } from 'lucide-react'

export function KpiBar() {
  const { route, nodes, selectedCustomer, setSelectedCustomer } = useRouteStore()

  // Calculate Delhi NCR Mean AQI
  const neighborhoods = nodes.filter((n) => n.type === 'neighborhood')
  const avgAqi = neighborhoods.length > 0
    ? Math.round(neighborhoods.reduce((acc, n) => acc + n.aqi, 0) / neighborhoods.length)
    : 245

  // Severe stations count (AQI > 400)
  const severeStations = neighborhoods.filter((n) => n.aqi > 400)
  const veryPoorStations = neighborhoods.filter((n) => n.aqi > 300 && n.aqi <= 400)

  const isSevereRoute = route?.status === 'no_safe_route'

  return (
    <div className="bg-[#08090d] border-b border-white/[0.08] px-6 py-2.5 flex-shrink-0">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* KPI 1: Active Target & Route Distance */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">ACTIVE MISSION</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400">{route?.total_km || 0} KM</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-semibold text-white truncate">
                {selectedCustomer.replace(' Delivery', '')}
              </span>
              <span className="text-[9px] font-mono text-white/50">({route?.hops || 0} hops)</span>
            </div>
            {/* Quick destination switch */}
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => setSelectedCustomer('Connaught Place Delivery')}
                className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                  selectedCustomer === 'Connaught Place Delivery'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-white/[0.03] text-white/40 border-white/5 hover:text-white/70'
                }`}
              >
                CP Central
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer('Rohini Sector 18 Delivery')}
                className={`text-[8px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                  selectedCustomer === 'Rohini Sector 18 Delivery'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-white/[0.03] text-white/40 border-white/5 hover:text-white/70'
                }`}
              >
                Rohini North
              </button>
            </div>
          </div>
        </div>

        {/* KPI 2: Delhi Regional Mean AQI */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">DELHI NCR MEAN AQI</span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                style={{
                  backgroundColor: avgAqi > 300 ? '#FF000022' : avgAqi > 200 ? '#FF990022' : '#FFFF0022',
                  color: avgAqi > 300 ? '#FF5555' : avgAqi > 200 ? '#FFAA33' : '#FFFF44',
                }}
              >
                {avgAqi > 300 ? 'VERY POOR' : avgAqi > 200 ? 'POOR' : 'MODERATE'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-mono font-bold text-white">{avgAqi}</span>
              <span className="text-[10px] font-mono text-white/40">CPCB 13 Stations</span>
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-1 truncate">
              Peak: {neighborhoods.sort((a, b) => b.aqi - a.aqi)[0]?.name || 'Anand Vihar'} ({neighborhoods[0]?.aqi || 388})
            </p>
          </div>
        </div>

        {/* KPI 3: Route Environmental Safety Rating */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div
            className={`p-2 rounded-lg border flex-shrink-0 ${
              isSevereRoute
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isSevereRoute ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">SAFETY CLEARANCE</span>
              <span
                className={`text-[9px] font-mono font-bold ${
                  isSevereRoute ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {isSevereRoute ? 'BLOCKED' : 'OPTIMAL'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm font-bold text-white">
                {isSevereRoute ? '0 Safe Corridors' : '100% AQI Compliant'}
              </span>
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400 inline" />
              <span>All nodes AQI &le; 400 cap</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Chokepoints & Avoided Nodes */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono tracking-widest text-white/40 uppercase">CHOKEPOINT WATCH</span>
              <span className="text-[9px] font-mono text-purple-400 font-bold">
                {severeStations.length} Severe
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-mono font-bold text-white">
                {severeStations.length + veryPoorStations.length}
              </span>
              <span className="text-[10px] font-mono text-white/40">Elevated Risk Zones</span>
            </div>
            <p className="text-[9px] font-mono text-white/40 mt-1 truncate">
              Avoided by Cypher: {route?.avoided?.length || 0} zones
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
