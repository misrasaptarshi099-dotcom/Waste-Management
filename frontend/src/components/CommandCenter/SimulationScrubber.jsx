import React from 'react';
import { Calendar, Sparkles, Flame, ShoppingBag, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function SimulationScrubber({ 
  currentDate, 
  onDateChange, 
  isLoading,
  onDispatchFleet 
}) {
  const PRESETS = [
    {
      id: 'normal',
      label: 'Normal Day',
      date: '2026-08-20',
      description: 'Baseline accumulation (18-32%/day)',
      icon: Calendar,
      badge: '1.0x Baseline',
      color: 'border-slate-700 hover:border-slate-500 text-slate-300',
    },
    {
      id: 'mandi',
      label: 'Subzi Mandi Haat',
      date: '2026-08-19', // Wednesday
      description: 'Weekly Market Day (+2.2x Surge in core market stops)',
      icon: ShoppingBag,
      badge: '2.2x Mandi Surge',
      color: 'border-amber-500/40 hover:border-amber-500 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'ganesh',
      label: 'Ganesh Utsav',
      date: '2026-08-25',
      description: 'Pune Ganpati Festival (+3.2x Organic waste surge)',
      icon: Flame,
      badge: '3.2x Festival Surge',
      color: 'border-red-500/40 hover:border-red-500 bg-red-500/10 text-red-300',
    },
    {
      id: 'diwali',
      label: 'Diwali Week',
      date: '2026-10-30',
      description: 'Diwali Festive peak (+3.5x Surge across all wards)',
      icon: Sparkles,
      badge: '3.5x Diwali Surge',
      color: 'border-orange-500/40 hover:border-orange-500 bg-orange-500/10 text-orange-300',
    },
  ];

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 md:p-5 shadow-lg w-full flex flex-col gap-4">
      {/* Top Header: Scrubber Title + Date Navigator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Time & Surge Simulation Scrubber
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
              Poisson Dynamic Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test AI route adaptation under cultural festival surges and weekly vegetable markets.
          </p>
        </div>

        {/* Date Stepper Controls */}
        <div className="flex items-center gap-2 bg-[#030712] p-1.5 rounded-xl border border-[#1E293B]">
          <button
            onClick={handlePrevDay}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 font-mono text-xs font-bold text-slate-100">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-slate-100 font-mono text-xs border-none focus:outline-none focus:ring-0 cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Quick-Triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = currentDate === preset.date;
          return (
            <button
              key={preset.id}
              onClick={() => onDateChange(preset.date)}
              disabled={isLoading}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : preset.color
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="font-headline font-bold text-xs text-slate-100">
                    {preset.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-black/40">
                  {preset.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</p>
              <span className="text-[10px] font-mono text-slate-500 mt-1">{preset.date}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Action: Dispatch Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>CVRP Solver: <strong>Google OR-Tools</strong> (Cheapest Arc + Guided Local Search)</span>
        </div>

        <button
          onClick={onDispatchFleet}
          disabled={isLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-headline font-bold text-xs tracking-wide uppercase transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>{isLoading ? 'Solving CVRP...' : 'Dispatch AI Fleet'}</span>
        </button>
      </div>
    </div>
  );
}
