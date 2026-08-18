import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  BarChart3, 
  Truck, 
  Smartphone, 
  Radio, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Header({ activeTab, setActiveTab, healthStatus }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isOnline = healthStatus && healthStatus.status === 'ok';

  return (
    <header className="w-full bg-[#0E131F]/95 backdrop-blur-md border-b border-[#1E293B] px-4 md:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
      {/* Brand & City Identification */}
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-headline font-bold text-lg shadow-sm">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-bold text-lg text-slate-100 tracking-tight">
              SwachhRoute AI
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OR-Tools CVRP
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Pune Municipal Corporation</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
            <span>15 Admin Wards</span>
          </p>
        </div>
      </div>

      {/* Navigation Switcher Tabs */}
      <nav className="flex items-center bg-[#030712] p-1 rounded-xl border border-[#1E293B] shadow-inner overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('gis')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'gis'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>GIS Command Map</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Ward Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'fleet'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fleet Logistics</span>
        </button>

        <button
          onClick={() => setActiveTab('citizen')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'citizen'
              ? 'bg-terracotta text-white shadow-sm font-semibold'
              : 'text-amber-300 hover:text-white hover:bg-amber-500/10'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Citizen PWA</span>
        </button>
      </nav>

      {/* Telemetry Clock & API Live Status */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="font-mono text-xs text-slate-200 tracking-wider">
            {formattedTime} <span className="text-slate-500 text-[10px]">IST</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {formattedDate}
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#030712] border border-[#1E293B] text-xs">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-slate-300 text-[11px] font-mono">
            {isOnline ? 'API 200 OK' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
}
