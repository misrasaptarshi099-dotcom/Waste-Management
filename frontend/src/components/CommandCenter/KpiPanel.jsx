import React from 'react';
import { TrendingDown, Fuel, IndianRupee, Leaf, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function KpiPanel({ savings, isLoading }) {
  if (!savings && !isLoading) {
    return (
      <div className="w-full text-center py-8 text-slate-500 font-mono text-sm">
        Optimization data unavailable. Select a date to run the CVRP solver.
      </div>
    );
  }

  const metrics = savings || {
    distance_saved_km: 0,
    distance_saved_pct: 0,
    diesel_saved_litres: 0,
    total_cost_saved_inr: 0,
    co2_avoided_kg: 0,
    stops_skipped: 0,
    overflow_delta: 0,
    static_stops: 0,
    dynamic_stops: 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {/* 1. Distance Saved */}
      <div className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-300 relative overflow-hidden group shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Distance Saved
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
            {isLoading ? '...' : `${metrics.distance_saved_km || 0}`}
          </span>
          <span className="text-xs font-mono text-slate-400">km</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            -{metrics.distance_saved_pct || 0}% vs Static
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Route Delta</span>
        </div>
      </div>

      {/* 2. Diesel Saved */}
      <div className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-300 relative overflow-hidden group shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Diesel Fuel Saved
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Fuel className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
            {isLoading ? '...' : `${metrics.diesel_saved_litres || 0}`}
          </span>
          <span className="text-xs font-mono text-slate-400">Litres</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            5.5 km/L Baseline
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Urban Stop-Go</span>
        </div>
      </div>

      {/* 3. Cost Saved in INR */}
      <div className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-300 relative overflow-hidden group shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            Municipal Cost Saved
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-mono text-emerald-400 font-bold">₹</span>
          <span className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
            {isLoading ? '...' : Number(metrics.total_cost_saved_inr || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs font-mono text-slate-400">/day</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Fuel + Driver
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">₹94.72/L</span>
        </div>
      </div>

      {/* 4. CO2 Avoided */}
      <div className="bg-[#0F172A] border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-300 relative overflow-hidden group shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
            CO₂ Avoided
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Leaf className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 tracking-tight">
            {isLoading ? '...' : `${metrics.co2_avoided_kg || 0}`}
          </span>
          <span className="text-xs font-mono text-slate-400">kg CO₂e</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            IPCC 2.68 kg/L
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Green ULB</span>
        </div>
      </div>
    </div>
  );
}
