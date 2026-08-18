import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Clock, MapPin, Gauge, Shield, Users } from 'lucide-react';

export default function FleetLogistics({ routesData, selectedZone }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Generate fleet vehicles from current routes data
  const vehicles = React.useMemo(() => {
    if (!routesData || !routesData.ward_results) return [];

    const list = [];
    const targetWards = selectedZone && selectedZone !== 'ALL'
      ? [selectedZone]
      : Object.keys(routesData.ward_results);

    targetWards.forEach((wId, wIdx) => {
      const wData = routesData.ward_results[wId];
      if (!wData || !wData.dynamic_route || !wData.dynamic_route.routes) return;

      wData.dynamic_route.routes.forEach((r, rIdx) => {
        const capacityKg = 4000;
        const loadKg = r.load_kg || Math.round(Math.random() * 2500 + 1200);
        const loadPct = Math.min(100, Math.round((loadKg / capacityKg) * 100));

        list.push({
          id: `PMC-TRK-${wId.replace('PUNE_', '')}-${r.vehicle_id}`,
          wardId: wId,
          vehicleNum: r.vehicle_id,
          model: 'Tata Ace Gold Mini Compactor',
          driverName: `Driver ${String.fromCharCode(65 + (wIdx * 5 + rIdx) % 26)} (${wId})`,
          status: loadPct >= 90 ? 'Returning to Depot' : 'Active On-Route',
          loadKg: loadKg,
          capacityKg: capacityKg,
          loadPct: loadPct,
          distanceKm: r.distance_km || 14.2,
          stopsCount: r.stops ? r.stops.length : 12,
          stops: r.stops || [],
          etaDepot: '10:45 AM',
        });
      });
    });

    return list;
  }, [routesData, selectedZone]);

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 md:p-6 shadow-xl flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="font-headline font-bold text-lg text-slate-100">
              Municipal Tipper Fleet & Vehicle Logistics Console
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time payload utilization, vehicle dispatch tracking, and driver manifest management.
          </p>
        </div>

        {/* Fleet Summary Pills */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Active Vehicles: {vehicles.length}
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            Tata Ace 4.0T Fleet
          </span>
        </div>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <div
            key={v.id}
            onClick={() => setSelectedVehicle(v)}
            className="bg-[#0E131F]/80 border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {v.id}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {v.wardId}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  v.status === 'Returning to Depot'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {v.status}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-sans mb-3">
                {v.model} • <span className="text-slate-300">{v.driverName}</span>
              </div>

              {/* Payload Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Payload Load</span>
                  <span className="text-slate-200 font-bold">{v.loadKg} / {v.capacityKg} kg ({v.loadPct}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      v.loadPct >= 85 ? 'bg-red-500' : v.loadPct >= 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${v.loadPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1E293B] font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Assigned Stops</span>
                <span className="text-slate-200 font-bold">{v.stopsCount} stops</span>
              </div>
              <div>
                <span className="text-slate-500 block">Route Distance</span>
                <span className="text-slate-200 font-bold">{v.distanceKm} km</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
