import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertCircle, Clock, MapPin, Gauge, Shield, Users, Fuel } from 'lucide-react';

export default function FleetLogistics({ routesData, selectedZone, onDispatchFleet }) {
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
        const loadKg = r.load_kg || Math.round(Math.random() * 2200 + 1500);
        const loadPct = Math.min(100, Math.round((loadKg / capacityKg) * 100));

        list.push({
          id: `SR-${wId.replace('PUNE_', '')}-${r.vehicle_id}`,
          wardId: wId,
          vehicleNum: r.vehicle_id,
          model: 'Tata Ace Gold 4.0T Compactor',
          driverName: `Driver ${String.fromCharCode(65 + (wIdx * 5 + rIdx) % 26)} (${wId})`,
          status: loadPct >= 85 ? 'Returning to Depot' : 'On Route',
          loadKg: loadKg,
          capacityKg: capacityKg,
          loadPct: loadPct,
          distanceKm: r.distance_km || 14.2,
          stopsServed: r.stops ? r.stops.length : 18,
          totalStops: (r.stops ? r.stops.length : 18) + 4,
        });
      });
    });

    return list;
  }, [routesData, selectedZone]);

  return (
    <div className="w-full max-w-7xl mx-auto py-6 flex flex-col md:flex-row gap-8 lg:gap-12">
      {/* ── Left Sticky Sidebar (Stitch Screen 9) ── */}
      <aside className="w-full md:w-1/4 flex flex-col gap-8 md:sticky md:top-28 h-fit">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold block mb-2">
            Operations Center
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl text-on-background font-bold leading-tight mb-6">
            Live Fleet<br />Logistics
          </h1>
          <button
            onClick={onDispatchFleet}
            className="w-full py-4 px-6 bg-surface-sand text-on-surface hover:bg-terracotta hover:text-white font-bold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-3 transition-all duration-300 shadow-sm group"
          >
            <Truck className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>Dispatch Fleet</span>
          </button>
        </div>

        {/* Fleet Health Metrics Blocks */}
        <div className="flex flex-col gap-4">
          <h3 className="font-mono text-xs text-muted-taupe uppercase tracking-widest font-bold">
            Fleet Health
          </h3>

          <div className="bg-surface-sand p-6 rounded-[32px] rounded-tl-[12px] rounded-br-[12px] border border-outline-variant/30 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-muted-taupe font-mono">Active Vehicles</span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold text-on-background">{vehicles.length}</span>
              <span className="font-mono text-xs text-muted-taupe">/ 75 Compactors</span>
            </div>
          </div>

          <div className="bg-surface-sand p-6 rounded-[32px] rounded-tr-[12px] rounded-bl-[12px] border border-outline-variant/30 flex flex-col gap-1 shadow-sm">
            <span className="text-xs text-muted-taupe font-mono">Fuel Optimization</span>
            <div className="flex items-baseline gap-2 text-secondary font-mono text-3xl font-bold">
              +17.5%
            </div>
            <span className="text-[10px] text-muted-taupe">vs Fixed Schedule</span>
          </div>
        </div>
      </aside>

      {/* ── Right Content: Vehicle Roster (Stitch Screen 9) ── */}
      <section className="w-full md:w-3/4 flex flex-col gap-4">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 border-b border-outline-variant/30 font-mono text-[10px] uppercase text-muted-taupe tracking-wider font-bold">
          <span>Vehicle ID</span>
          <span>Assigned Ward</span>
          <span>Payload Load</span>
          <span>Route Progress</span>
          <span className="text-right">Status</span>
        </div>

        {/* Vehicle Rows */}
        <div className="flex flex-col gap-3.5">
          {vehicles.map((v, idx) => (
            <div
              key={v.id}
              className={`bg-surface-sand/70 p-5 md:p-6 rounded-[24px] flex flex-col md:grid md:grid-cols-5 gap-4 items-center border border-outline-variant/30 hover:bg-surface-sand transition-all duration-300 shadow-sm ${
                idx % 2 === 0 ? 'rounded-tr-[8px]' : 'rounded-bl-[8px]'
              }`}
            >
              <div className="w-full md:w-auto font-mono text-sm text-on-background font-bold">
                {v.id}
              </div>

              <div className="w-full md:w-auto text-xs text-on-surface-variant font-medium">
                {v.wardId}
              </div>

              {/* Payload Progress */}
              <div className="w-full flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-mono text-muted-taupe">
                  <span>{v.loadKg} / {v.capacityKg} kg</span>
                  <span className="font-bold text-on-background">{v.loadPct}%</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      v.loadPct >= 80 ? 'bg-terracotta' : 'bg-secondary'
                    }`}
                    style={{ width: `${v.loadPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Stop Progress */}
              <div className="w-full flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-mono text-muted-taupe">
                  <span>{v.stopsServed} / {v.totalStops} Stops</span>
                  <span>{v.distanceKm} km</span>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${Math.round((v.stopsServed / v.totalStops) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="w-full md:w-auto flex justify-end">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                  v.status === 'Returning to Depot'
                    ? 'bg-primary-fixed/40 text-primary border-primary/20'
                    : 'bg-secondary-fixed/40 text-secondary border-secondary/20'
                }`}>
                  {v.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
