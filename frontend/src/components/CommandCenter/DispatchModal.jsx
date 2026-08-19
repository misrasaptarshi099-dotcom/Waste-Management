import React from 'react';
import { Truck, CheckCircle2, X, Route, Fuel, IndianRupee, Leaf } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DispatchModal({ isOpen, onClose, routesData, currentDate, dispatchPayload }) {
  if (!isOpen) return null;

  const handleConfirmDispatch = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#C25E4B', '#9A402F', '#6B8E7B', '#8B7E76']
    });
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  const selectedWards = dispatchPayload?.selectedWards;
  const dynamicTripsCount = dispatchPayload?.dynamicTripsCount;
  const isDynamicActive = dispatchPayload?.isDynamicActive ?? true;

  const savings = dispatchPayload?.metrics || ((routesData && routesData.city_savings) ? routesData.city_savings : {
    distance_saved_km: 64.01,
    diesel_saved_litres: 11.64,
    total_cost_saved_inr: 1646.45,
    co2_avoided_kg: 31.19,
    stops_skipped: 103,
  });

  const scopeLabel = selectedWards && selectedWards.length < 15
    ? `${selectedWards.length} Wards (${dynamicTripsCount || 8} Active Trips)`
    : 'All 15 Wards (Full City Fleet)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background-cream border border-outline-variant/50 rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative flex flex-col gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-taupe hover:text-on-background p-1.5 rounded-full hover:bg-surface-sand transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
              Dispatch Verification
            </span>
            <h3 className="font-editorial text-2xl font-bold text-on-background">
              Confirm Route Manifest
            </h3>
            <p className="text-xs text-muted-taupe font-mono">Date: {currentDate} • {scopeLabel}</p>
          </div>
        </div>

        {/* Manifest Stats Grid */}
        <div className="bg-surface-sand rounded-2xl p-5 flex flex-col gap-3 font-mono text-xs border border-outline-variant/30">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <span className="text-muted-taupe">CVRP Optimization Algorithm</span>
            <span className="text-secondary font-bold">Google OR-Tools</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
              <span className="text-muted-taupe text-[10px] block">
                {isDynamicActive ? 'Distance Saved' : 'Static Distance'}
              </span>
              <span className="text-terracotta font-bold text-base">
                {isDynamicActive ? `${savings.distance_saved_km} km` : `${savings.static_distance_km} km`}
              </span>
            </div>

            <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
              <span className="text-muted-taupe text-[10px] block">
                {isDynamicActive ? 'Diesel Saved' : 'Fuel Consumed'}
              </span>
              <span className="text-secondary font-bold text-base">
                {isDynamicActive ? `${savings.diesel_saved_litres} Litres` : `${savings.static_diesel_litres} Litres`}
              </span>
            </div>

            <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
              <span className="text-muted-taupe text-[10px] block">
                {isDynamicActive ? 'Cost Saved' : 'Operating Cost'}
              </span>
              <span className="text-primary font-bold text-base">
                ₹{Math.round(isDynamicActive ? savings.total_cost_saved_inr : (savings.static_cost_inr || savings.total_cost_saved_inr))}
              </span>
            </div>

            <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
              <span className="text-muted-taupe text-[10px] block">
                {isDynamicActive ? 'Skipped Bins' : 'Total Stops'}
              </span>
              <span className="text-on-background font-bold text-base">
                {isDynamicActive ? `${savings.stops_skipped} stops` : `${savings.total_stops} stops`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-full text-xs font-mono text-muted-taupe hover:text-on-background hover:bg-surface-sand transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmDispatch}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Transmit Route Manifests</span>
          </button>
        </div>
      </div>
    </div>
  );
}
