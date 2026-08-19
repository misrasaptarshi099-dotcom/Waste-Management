import React, { useRef, useEffect, useCallback } from 'react';
import { Truck, CheckCircle2, X, Route, Fuel, IndianRupee, Leaf } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DispatchModal({ isOpen, onClose, routesData, currentDate, dispatchPayload }) {
  const dialogRef = useRef(null);
  const closeTimerRef = useRef(null);

  // Focus trap: move focus into dialog when it opens
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstFocusable = dialogRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      firstFocusable?.focus();
    }
    // Cleanup any pending close timer when modal closes or unmounts
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle Escape key to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    // Trap focus within dialog
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose]);

  if (!isOpen) return null;

  const handleConfirmDispatch = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#C25E4B', '#9A402F', '#6B8E7B', '#8B7E76']
    });
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 1600);
  };

  const selectedWards = dispatchPayload?.selectedWards;
  const dynamicTripsCount = dispatchPayload?.dynamicTripsCount;
  const isDynamicActive = dispatchPayload?.isDynamicActive ?? true;
  const totalWards = selectedWards ? selectedWards.length : 15;

  const hasSavingsData = !!(dispatchPayload?.metrics || (routesData && routesData.city_savings));
  const savings = dispatchPayload?.metrics || ((routesData && routesData.city_savings) ? routesData.city_savings : null);

  const scopeLabel = selectedWards && totalWards < 15
    ? `${totalWards} Wards (${dynamicTripsCount || 0} Active Trips)`
    : `All ${totalWards} Wards (Full City Fleet)`;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-modal-title"
        className="bg-background-cream border border-outline-variant/50 rounded-[2.5rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative flex flex-col gap-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
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
            <h3 id="dispatch-modal-title" className="font-editorial text-2xl font-bold text-on-background">
              Confirm Route Manifest
            </h3>
            <p className="text-xs text-muted-taupe font-mono">Date: {currentDate} • {scopeLabel}</p>
          </div>
        </div>

        {/* Manifest Stats Grid */}
        {hasSavingsData && savings ? (
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
                  {isDynamicActive ? `${savings.distance_saved_km ?? '—'} km` : `${savings.static_distance_km ?? '—'} km`}
                </span>
              </div>

              <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
                <span className="text-muted-taupe text-[10px] block">
                  {isDynamicActive ? 'Diesel Saved' : 'Fuel Consumed'}
                </span>
                <span className="text-secondary font-bold text-base">
                  {isDynamicActive ? `${savings.diesel_saved_litres ?? '—'} Litres` : `${savings.static_diesel_litres ?? '—'} Litres`}
                </span>
              </div>

              <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
                <span className="text-muted-taupe text-[10px] block">
                  {isDynamicActive ? 'Cost Saved' : 'Operating Cost'}
                </span>
                <span className="text-primary font-bold text-base">
                  ₹{Math.round(isDynamicActive ? (savings.total_cost_saved_inr ?? 0) : (savings.static_cost_inr || savings.total_cost_saved_inr || 0))}
                </span>
              </div>

              <div className="bg-background-cream p-3 rounded-xl border border-outline-variant/20">
                <span className="text-muted-taupe text-[10px] block">
                  {isDynamicActive ? 'Skipped Bins' : 'Total Stops'}
                </span>
                <span className="text-on-background font-bold text-base">
                  {isDynamicActive ? `${savings.stops_skipped ?? '—'} stops` : `${savings.total_stops ?? '—'} stops`}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-sand rounded-2xl p-5 text-center font-mono text-xs text-muted-taupe border border-outline-variant/30">
            Route manifest data is loading. Please wait for optimization to complete.
          </div>
        )}

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
            disabled={!hasSavingsData}
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Transmit Route Manifests</span>
          </button>
        </div>
      </div>
    </div>
  );
}
