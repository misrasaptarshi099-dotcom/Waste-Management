import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Map as MapIcon, 
  BarChart3, 
  Truck, 
  Smartphone, 
  Radio, 
  Bell,
  Settings,
  Search
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
  });

  const isOnline = healthStatus && healthStatus.status === 'ok';

  return (
    <header className="bg-background-cream/90 backdrop-blur-md border-b border-outline-variant/30 text-on-background w-full px-6 md:px-12 py-4 flex justify-between items-center z-40 sticky top-0 transition-all duration-500">
      {/* Brand / Municipality Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-editorial text-lg md:text-xl font-bold text-primary tracking-tight">
              SwachhRoute AI
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full bg-surface-sand text-primary border border-outline-variant/40">
              Pune PMC
            </span>
          </div>
          <p className="text-[11px] text-muted-taupe hidden sm:block">
            Autonomous Waste Routing & Civic Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Switcher (Stitch Pill Style) */}
      <nav className="flex items-center bg-surface-sand p-1 rounded-full border border-outline-variant/40 shadow-sm">
        <button
          onClick={() => setActiveTab('gis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
            activeTab === 'gis'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Command</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
            activeTab === 'analytics'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
            activeTab === 'fleet'
              ? 'bg-primary text-white shadow-md'
              : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fleet</span>
        </button>

        <a
          href="/citizen"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 text-terracotta hover:bg-terracotta/10 border border-terracotta/30"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Citizen App ↗</span>
        </a>
      </nav>

      {/* Live Clock & Status Badge */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block font-mono text-xs">
          <div className="text-primary font-bold">{formattedTime} <span className="text-muted-taupe text-[10px]">IST</span></div>
          <div className="text-[11px] text-muted-taupe">{formattedDate}</div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-sand border border-outline-variant/40 text-xs">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-secondary animate-pulse' : 'bg-status-caution'}`}></span>
          <span className="text-on-surface-variant text-[11px] font-mono font-medium">
            {isOnline ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
