import React from 'react';
import { Truck, CheckCircle, ShieldCheck, Fuel, IndianRupee, MapPin, X, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DispatchModal({ isOpen, onClose, routesData, currentDate }) {
  if (!isOpen) return null;

  const handleConfirmDispatch = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#4EDEA3', '#F59E0B', '#3B82F6']
    });
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const savings = routesData ? routesData.city_savings : {
    distance_saved_km: 64.01,
    diesel_saved_litres: 11.64,
    total_cost_saved_inr: 1646.45,
    co2_avoided_kg: 31.19,
    stops_skipped: 103,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative flex flex-col gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Dispatch Verification
            </span>
            <h3 className="font-headline font-bold text-xl text-slate-100">
              Confirm Municipal Fleet Dispatch
            </h3>
            <p className="text-xs text-slate-400 font-mono">Date: {currentDate} (Pune PMC)</p>
          </div>
        </div>

        {/* Manifest Summary Card */}
        <div className="bg-[#030712] border border-[#1E293B] rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
            <span className="text-slate-400">CVRP Optimization Algorithm</span>
            <span className="text-emerald-400 font-bold">Google OR-Tools</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0E131F] p-2.5 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Distance Saved</span>
              <span className="text-emerald-400 font-bold text-base">
                {savings.distance_saved_km} km
              </span>
            </div>
            <div className="bg-[#0E131F] p-2.5 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Diesel Saved</span>
              <span className="text-emerald-400 font-bold text-base">
                {savings.diesel_saved_litres} Litres
              </span>
            </div>
            <div className="bg-[#0E131F] p-2.5 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Cost Saved</span>
              <span className="text-emerald-400 font-bold text-base">
                ₹{Math.round(savings.total_cost_saved_inr)}
              </span>
            </div>
            <div className="bg-[#0E131F] p-2.5 rounded-xl">
              <span className="text-slate-500 text-[10px] block">Skipped Stops</span>
              <span className="text-slate-200 font-bold text-base">
                {savings.stops_skipped} bins
              </span>
            </div>
          </div>
        </div>

        {/* Dispatch Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDispatch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-headline font-bold text-xs tracking-wider uppercase shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Transmit Route Manifests</span>
          </button>
        </div>
      </div>
    </div>
  );
}
