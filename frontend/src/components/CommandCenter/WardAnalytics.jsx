import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Download, 
  ArrowUpRight, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle2
} from 'lucide-react';

export default function WardAnalytics({ routesData, zonesData, onSelectWard }) {
  const [searchTerm, setSearchTerm] = useState('');

  const wardRows = React.useMemo(() => {
    if (!zonesData || !zonesData.features) return [];
    
    return zonesData.features.map(f => {
      const p = f.properties;
      const wId = p.zone_id;
      const wResult = routesData && routesData.ward_results ? routesData.ward_results[wId] : null;
      const savings = wResult ? wResult.savings : null;

      return {
        zone_id: wId,
        name: p.name,
        day: p.day,
        cycle: p.cycle,
        area_sqkm: p.area_sqkm,
        density: p.population_density,
        total_stops: p.n_stops,
        active_stops: wResult ? wResult.active_stops_count : Math.round(p.n_stops * 0.75),
        static_km: savings ? savings.static_distance_km : 24.5,
        dynamic_km: savings ? savings.dynamic_distance_km : 19.2,
        saved_km: savings ? savings.distance_saved_km : 5.3,
        saved_pct: savings ? savings.distance_saved_pct : 21.6,
        cost_saved_inr: savings ? savings.total_cost_saved_inr : 110.5,
        diesel_saved_l: savings ? savings.diesel_saved_litres : 0.96,
        efficiency_pct: Math.min(96, Math.max(65, Math.round(100 - (savings ? savings.distance_saved_pct * 0.8 : 15)))),
      };
    });
  }, [zonesData, routesData]);

  const filteredWards = wardRows.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.zone_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.day.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Ward ID', 'Ward Name', 'Day', 'Area (sqkm)', 'Total Stops', 'Dispatched Stops', 'Static Distance (km)', 'Dynamic Distance (km)', 'Saved Distance (km)', 'Efficiency (%)', 'Cost Saved (INR)'];
    const rows = filteredWards.map(w => [
      w.zone_id,
      `"${w.name}"`,
      w.day,
      w.area_sqkm,
      w.total_stops,
      w.active_stops,
      w.static_km,
      w.dynamic_km,
      w.saved_km,
      w.efficiency_pct,
      w.cost_saved_inr
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pune_pmc_ward_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 flex flex-col md:flex-row gap-8 lg:gap-12">
      {/* ── Left Column: Editorial Sticky Sidebar (Stitch Screen 8) ── */}
      <div className="md:w-5/12 flex flex-col gap-8 md:sticky md:top-28 self-start">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold block mb-2">
            Zone Diagnostics
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl text-on-background font-bold leading-tight">
            Ward<br />Performance
          </h1>
          <p className="text-sm text-muted-taupe mt-3 leading-relaxed">
            Real-time fill heuristics, route skip efficiencies, and operational metrics across all 15 Pune municipal zones.
          </p>
        </div>

        {/* Hotspot Alerts Box (Stitch Screen 8) */}
        <div className="bg-surface-sand rounded-[2rem] p-6 flex flex-col gap-4 border border-outline-variant/30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h3 className="font-editorial text-lg font-bold text-on-background">
              Hotspot Alerts
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-3.5 rounded-2xl bg-background-cream border border-outline-variant/30 flex items-start gap-3 hover:scale-[1.01] transition-transform">
              <div className="w-2.5 h-2.5 rounded-full bg-terracotta mt-1.5 flex-shrink-0 animate-pulse"></div>
              <div>
                <h4 className="font-bold text-xs text-on-background">FC Road Corridor — Critical</h4>
                <p className="text-[11px] text-muted-taupe mt-0.5">Commercial bins at 88% capacity. Priority tipper dispatched.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-background-cream border border-outline-variant/30 flex items-start gap-3 hover:scale-[1.01] transition-transform">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary mt-1.5 flex-shrink-0"></div>
              <div>
                <h4 className="font-bold text-xs text-on-background">Kothrud Haat — Surging</h4>
                <p className="text-[11px] text-muted-taupe mt-0.5">Mandi haulage +2.2x. Second pass vehicle queued for 11:30 AM.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Export controls */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-taupe absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter ward or day..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-sand border border-outline-variant/40 rounded-full pl-10 pr-4 py-2 text-xs text-on-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-surface-sand hover:bg-surface-dim border border-outline-variant/40 text-xs font-semibold text-primary transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Export 15-Ward Municipal CSV</span>
          </button>
        </div>
      </div>

      {/* ── Right Column: Ward Cards & Table Stream (Stitch Screen 8) ── */}
      <div className="md:w-7/12 flex flex-col gap-6">
        {/* Top Highlight Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {filteredWards.slice(0, 3).map((w, idx) => (
            <div
              key={w.zone_id}
              className={`bg-surface-sand p-5 flex flex-col justify-between gap-3 shadow-sm border border-outline-variant/30 transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
                idx === 0 ? 'rounded-organic' : idx === 1 ? 'rounded-organic-alt' : 'rounded-[2rem]'
              }`}
              onClick={() => onSelectWard(w.zone_id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-taupe font-bold">
                  {w.zone_id}
                </span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>

              <div>
                <div className="font-mono text-3xl font-bold text-on-background">
                  {w.efficiency_pct}%
                </div>
                <div className="text-xs text-muted-taupe font-sans mt-0.5">{w.name}</div>
              </div>

              <div className="text-[11px] font-mono text-terracotta font-semibold">
                -{w.saved_pct.toFixed(1)}% Distance Delta
              </div>
            </div>
          ))}
        </div>

        {/* Full 15-Ward Interactive Grid */}
        <div className="bg-surface-sand rounded-[2rem] p-6 border border-outline-variant/30 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-lg font-bold text-on-background">
              All 15 Wards Roster
            </h3>
            <span className="text-xs font-mono text-muted-taupe">
              Showing {filteredWards.length} wards
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 text-muted-taupe text-[10px] uppercase tracking-wider">
                  <th className="py-2.5">ID</th>
                  <th className="py-2.5">Ward Name</th>
                  <th className="py-2.5">Schedule</th>
                  <th className="py-2.5 text-right">Stops</th>
                  <th className="py-2.5 text-right">Distance Saved</th>
                  <th className="py-2.5 text-right">Cost Saved</th>
                  <th className="py-2.5 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-sans">
                {filteredWards.map((w) => (
                  <tr 
                    key={w.zone_id}
                    className="hover:bg-background-cream/60 transition-colors"
                  >
                    <td className="py-3 font-mono font-bold text-primary">{w.zone_id}</td>
                    <td className="py-3 font-semibold text-slate-800">{w.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-background-cream text-muted-taupe text-[11px] border border-outline-variant/30">
                        {w.day}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-slate-700">
                      <span className="font-bold text-secondary">{w.active_stops}</span>/{w.total_stops}
                    </td>
                    <td className="py-3 text-right font-mono text-terracotta font-bold">
                      -{w.saved_pct.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right font-mono text-primary font-semibold">
                      ₹{Math.round(w.cost_saved_inr)}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => onSelectWard(w.zone_id)}
                        className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
                        title="Focus on GIS Map"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
