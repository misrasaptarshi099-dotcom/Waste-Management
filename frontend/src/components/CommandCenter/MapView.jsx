import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  CircleMarker, 
  Tooltip, 
  Polyline, 
  useMap 
} from 'react-leaflet';
import { 
  Route, 
  Fuel, 
  IndianRupee, 
  Leaf, 
  ArrowRight, 
  Flame, 
  ShoppingBag, 
  Sparkles,
  Calendar,
  Layers,
  Eye,
  EyeOff,
  Info,
  CheckSquare,
  Square,
  MapPin,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Sliders,
  Check,
  RotateCcw
} from 'lucide-react';

const PUNE_CENTER = [18.5204, 73.8567];
const DEFAULT_ZOOM = 12;

const ALL_15_WARDS = [
  { id: 'PUNE_W01', name: 'Aundh-Baner' },
  { id: 'PUNE_W02', name: 'Ghole Road-Shivajinagar' },
  { id: 'PUNE_W03', name: 'Kothrud-Bavdhan' },
  { id: 'PUNE_W04', name: 'Warje-Karvenagar' },
  { id: 'PUNE_W05', name: 'Dhole Patil Road' },
  { id: 'PUNE_W06', name: 'Yerawada-Kalas-Dhanori' },
  { id: 'PUNE_W07', name: 'Bhavani Peth' },
  { id: 'PUNE_W08', name: 'Kasba-Vishrambaugwada' },
  { id: 'PUNE_W09', name: 'Tilak Road-Sinhagad' },
  { id: 'PUNE_W10', name: 'Bibwewadi' },
  { id: 'PUNE_W11', name: 'Sahakarnagar' },
  { id: 'PUNE_W12', name: 'Dhankawadi-Sahakarnagar' },
  { id: 'PUNE_W13', name: 'Hadapsar-Mundhwa' },
  { id: 'PUNE_W14', name: 'Wanowrie-Ramtekdi' },
  { id: 'PUNE_W15', name: 'Nagar Road-Vadgaonsheri' },
];

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || DEFAULT_ZOOM, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ 
  zonesData, 
  stopsData, 
  routesData, 
  savings, 
  currentDate, 
  onDateChange,
  isLoading,
  onDispatchFleet 
}) {
  // Extract all available ward IDs from zonesData or fallback
  const availableWards = useMemo(() => {
    if (zonesData && zonesData.features && zonesData.features.length > 0) {
      return zonesData.features.map(f => ({
        id: f.properties.zone_id,
        name: f.properties.name || f.properties.zone_id,
        centroid: f.properties.centroid_lat ? [f.properties.centroid_lat, f.properties.centroid_lon] : null
      }));
    }
    return ALL_15_WARDS;
  }, [zonesData]);

  const allWardIds = useMemo(() => availableWards.map(w => w.id), [availableWards]);

  // Selected Wards State: Array of active ward IDs (defaults to ALL 15 wards)
  const [selectedWards, setSelectedWards] = useState(allWardIds);
  const [isWardFilterOpen, setIsWardFilterOpen] = useState(false);

  // Sync selected wards if availableWards loads later
  useEffect(() => {
    if (selectedWards.length === 0 && allWardIds.length > 0) {
      setSelectedWards(allWardIds);
    }
  }, [allWardIds]);

  const [showStaticRoute, setShowStaticRoute] = useState(true);
  const [showDynamicRoute, setShowDynamicRoute] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [activeStop, setActiveStop] = useState(null);
  const [mapCenter, setMapCenter] = useState(PUNE_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // Ward Selection Helper Functions
  const toggleWard = (wId) => {
    setSelectedWards(prev => {
      if (prev.includes(wId)) {
        return prev.filter(id => id !== wId);
      } else {
        return [...prev, wId];
      }
    });
  };

  const selectAllWards = () => setSelectedWards(allWardIds);
  const deselectAllWards = () => setSelectedWards([]);
  const selectOnlyWard = (wId) => {
    setSelectedWards([wId]);
    const w = availableWards.find(x => x.id === wId);
    if (w && w.centroid) {
      setMapCenter(w.centroid);
      setMapZoom(13.5);
    }
  };

  // ─── DYNAMIC MULTI-WARD KPI AGGREGATION ───
  const metrics = useMemo(() => {
    if (!selectedWards || selectedWards.length === 0) {
      return {
        distance_saved_km: 0,
        distance_saved_pct: 0,
        diesel_saved_litres: 0,
        total_cost_saved_inr: 0,
        co2_avoided_kg: 0,
        stops_skipped: 0,
        static_distance_km: 0,
        dynamic_distance_km: 0,
        static_diesel_litres: 0,
        static_cost_inr: 0,
        static_co2_kg: 0,
        total_stops: 0,
        active_stops: 0,
      };
    }

    if (routesData && routesData.ward_results) {
      let static_km = 0;
      let dynamic_km = 0;
      let static_stops = 0;
      let dynamic_stops = 0;
      let diesel_saved = 0;
      let cost_saved = 0;
      let co2_saved = 0;
      let skipped = 0;

      selectedWards.forEach(wId => {
        const wData = routesData.ward_results[wId];
        if (wData && wData.savings) {
          const s = wData.savings;
          static_km += s.static_distance_km || 0;
          dynamic_km += s.dynamic_distance_km || 0;
          static_stops += s.static_stops || 0;
          dynamic_stops += s.dynamic_stops || 0;
          diesel_saved += s.diesel_saved_litres || 0;
          cost_saved += s.total_cost_saved_inr || 0;
          co2_saved += s.co2_avoided_kg || 0;
          skipped += s.stops_skipped || 0;
        }
      });

      const saved_km = Math.max(0, static_km - dynamic_km);
      const saved_pct = static_km > 0 ? (saved_km / static_km) * 100 : 0;
      const static_diesel = static_km / 5.5;
      const static_cost = (static_diesel * 94.72) + (static_km * 8.5);
      const static_co2 = static_diesel * 2.68;

      return {
        distance_saved_km: Number(saved_km.toFixed(2)),
        distance_saved_pct: Number(saved_pct.toFixed(1)),
        diesel_saved_litres: Number(diesel_saved.toFixed(2)),
        total_cost_saved_inr: Number(cost_saved.toFixed(2)),
        co2_avoided_kg: Number(co2_saved.toFixed(2)),
        stops_skipped: skipped,
        static_distance_km: Number(static_km.toFixed(2)),
        dynamic_distance_km: Number(dynamic_km.toFixed(2)),
        static_diesel_litres: Number(static_diesel.toFixed(2)),
        static_cost_inr: Number(static_cost.toFixed(2)),
        static_co2_kg: Number(static_co2.toFixed(2)),
        total_stops: static_stops,
        active_stops: dynamic_stops,
      };
    }

    // Pending — return zeros so KPI cards show 0 instead of invented metrics
    return {
      distance_saved_km: 0,
      distance_saved_pct: 0,
      diesel_saved_litres: 0,
      total_cost_saved_inr: 0,
      co2_avoided_kg: 0,
      stops_skipped: 0,
      static_distance_km: 0,
      dynamic_distance_km: 0,
      static_diesel_litres: 0,
      static_cost_inr: 0,
      static_co2_kg: 0,
      total_stops: 0,
      active_stops: 0,
    };
  }, [selectedWards, routesData]);

  // Filter stops by selected wards (handles both array and {stops: []} format)
  const visibleStops = useMemo(() => {
    if (!stopsData) return [];
    const list = Array.isArray(stopsData) ? stopsData : (stopsData.stops || []);
    if (!list || list.length === 0) return [];
    if (!selectedWards || selectedWards.length === 0) return [];
    return list.filter(s => selectedWards.includes(s.zone_id));
  }, [stopsData, selectedWards]);

  // Extract polylines from route data for selected wards
  const routePolylines = useMemo(() => {
    if (!routesData || !routesData.ward_results) return { staticPaths: [], dynamicPaths: [] };

    const staticPaths = [];
    const dynamicPaths = [];

    selectedWards.forEach(wId => {
      const wData = routesData.ward_results[wId];
      if (!wData) return;

      if (wData.static_route && wData.static_route.ordered_stops) {
        const coords = wData.static_route.ordered_stops.map(s => [s.lat, s.lon]);
        if (coords.length > 1) staticPaths.push({ wardId: wId, coords });
      }

      if (wData.dynamic_route && wData.dynamic_route.routes) {
        wData.dynamic_route.routes.forEach(vRoute => {
          if (vRoute.stops && vRoute.stops.length > 0) {
            const coords = vRoute.stops.map(s => [s.lat, s.lon]);
            if (coords.length > 1) {
              dynamicPaths.push({ 
                wardId: wId, vehicleId: vRoute.vehicle_id, coords,
                loadKg: vRoute.load_kg, distanceKm: vRoute.distance_km 
              });
            }
          }
        });
      }
    });

    return { staticPaths, dynamicPaths };
  }, [routesData, selectedWards]);

  // Ward polygon styles (highlights selected wards, dims unselected)
  const wardStyle = (feature) => {
    const isSelected = selectedWards.includes(feature.properties.zone_id);
    return {
      fillColor: isSelected ? '#C25E4B' : '#8B7E76',
      weight: isSelected ? 2.2 : 1,
      opacity: isSelected ? 0.9 : 0.4,
      color: isSelected ? '#9A402F' : '#CBD5E1',
      fillOpacity: isSelected ? 0.30 : 0.08,
    };
  };

  const onEachWard = (feature, layer) => {
    const p = feature.properties;
    layer.on({
      mouseover: (e) => {
        if (selectedWards.includes(p.zone_id)) {
          e.target.setStyle({ fillOpacity: 0.45, color: '#C25E4B', weight: 2.5 });
        }
      },
      mouseout: (e) => {
        const isSelected = selectedWards.includes(p.zone_id);
        e.target.setStyle({ 
          fillOpacity: isSelected ? 0.30 : 0.08, 
          color: isSelected ? '#9A402F' : '#CBD5E1', 
          weight: isSelected ? 2.2 : 1 
        });
      },
      click: () => {
        toggleWard(p.zone_id);
        if (p.centroid_lat && p.centroid_lon) {
          setMapCenter([p.centroid_lat, p.centroid_lon]);
          setMapZoom(13.5);
        }
      },
    });
  };

  const getStopColor = (stop) => {
    if (stop.is_overflow_risk || stop.predicted_fill_pct >= 80) return '#C25E4B';
    if (stop.predicted_fill_pct >= 65) return '#E07A5F';
    return '#6B8E7B';
  };

  // Surge detection
  const isGaneshSurge = currentDate === '2026-08-25';
  const isMandiSurge = currentDate === '2026-08-19';
  const isDiwaliSurge = currentDate === '2026-10-21';
  const isNormal = !isGaneshSurge && !isMandiSurge && !isDiwaliSurge;

  const isAllWardsSelected = selectedWards.length === allWardIds.length;

  return (
    <div className="w-full max-w-[1600px] mx-auto py-4 md:py-8 flex flex-col lg:flex-row gap-8 lg:gap-12 relative z-10">
      {/* ── LEFT PANEL: Sticky Editorial Column ── */}
      <section className="w-full lg:w-5/12 flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
              Live Overview • Pune PMC
            </span>
          </div>
          <h2 className="font-editorial text-3xl md:text-4xl text-on-background font-bold tracking-tight">
            AI Routing Intelligence Active.
          </h2>
          <p className="text-sm text-muted-taupe leading-relaxed">
            Dynamic CVRP vehicle routing optimization. Filter single or multiple wards below to inspect localized fuel and distance deltas.
          </p>
        </div>

        {/* ── MULTI-WARD SELECTION & FILTER ACCORDION ── */}
        <div className="bg-surface-sand rounded-[2rem] p-5 border border-outline-variant/40 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider text-on-background font-bold">
                Ward Filter ({selectedWards.length}/{allWardIds.length} Active)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={isAllWardsSelected ? deselectAllWards : selectAllWards}
                className="font-mono text-[11px] font-bold text-primary hover:underline"
              >
                {isAllWardsSelected ? 'Clear All' : 'Select All'}
              </button>
              <button
                onClick={() => setIsWardFilterOpen(!isWardFilterOpen)}
                className="p-1 text-muted-taupe hover:text-on-background rounded-md"
              >
                {isWardFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Ward Count Pill Row */}
          <div className="flex items-center justify-between text-xs font-mono text-muted-taupe">
            <span>{selectedWards.length === 0 ? 'No wards selected' : `${selectedWards.length} ward(s) contributing to metrics`}</span>
            {selectedWards.length > 0 && selectedWards.length < allWardIds.length && (
              <button
                onClick={selectAllWards}
                className="text-terracotta hover:underline font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to All</span>
              </button>
            )}
          </div>

          {/* Collapsible Ward Multi-Select Chips Grid */}
          {isWardFilterOpen && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 max-h-56 overflow-y-auto pr-1 border-t border-outline-variant/20">
              {availableWards.map(w => {
                const isChecked = selectedWards.includes(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWard(w.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-left font-mono text-[11px] transition-all border ${
                      isChecked 
                        ? 'bg-background-cream border-terracotta text-on-background font-bold shadow-xs' 
                        : 'bg-surface-sand/40 border-outline-variant/20 text-muted-taupe opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${
                      isChecked ? 'bg-terracotta text-white' : 'bg-surface-dim text-muted-taupe'
                    }`}>
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span className="truncate">{w.id.replace('PUNE_', '')}: {w.name.split('-')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── LAYER VISIBILITY & ROUTE ANALYSIS CONTROLS ── */}
        <div className="bg-surface-sand rounded-[2rem] p-5 border border-outline-variant/40 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <span className="font-mono text-xs uppercase tracking-wider text-on-background font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Route Layers & Analysis
            </span>
            <span className="font-mono text-[10px] text-muted-taupe">Click to Toggle</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* AI Dynamic Route Toggle */}
            <button
              onClick={() => setShowDynamicRoute(!showDynamicRoute)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                showDynamicRoute 
                  ? 'bg-background-cream border-terracotta shadow-sm' 
                  : 'bg-surface-sand/60 border-outline-variant/30 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${showDynamicRoute ? 'bg-terracotta text-white' : 'bg-surface-dim text-muted-taupe'}`}>
                  {showDynamicRoute ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-terracotta rounded-full"></span>
                    <span className="font-semibold text-xs text-on-background">AI Dynamic Route</span>
                  </div>
                  <span className="text-[11px] text-muted-taupe font-mono">CVRP Optimized • Only high-fill stops</span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta">
                {routePolylines.dynamicPaths.length} Active Trips
              </span>
            </button>

            {/* Static Baseline Route Toggle */}
            <button
              onClick={() => setShowStaticRoute(!showStaticRoute)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                showStaticRoute 
                  ? 'bg-background-cream border-muted-taupe shadow-sm' 
                  : 'bg-surface-sand/60 border-outline-variant/30 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${showStaticRoute ? 'bg-muted-taupe text-white' : 'bg-surface-dim text-muted-taupe'}`}>
                  {showStaticRoute ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 border-b-2 border-dashed border-[#8B7E76]"></span>
                    <span className="font-semibold text-xs text-on-background">Static Baseline</span>
                  </div>
                  <span className="text-[11px] text-muted-taupe font-mono">Fixed Schedule • All bins visited blindly</span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted-taupe/15 text-muted-taupe">
                Fixed 100%
              </span>
            </button>

            {/* Stops & Bins Toggle */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowStops(!showStops)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  showStops 
                    ? 'bg-background-cream border-secondary/60 shadow-sm' 
                    : 'bg-surface-sand/60 border-outline-variant/30 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center ${showStops ? 'bg-secondary text-white' : 'bg-surface-dim text-muted-taupe'}`}>
                  {showStops ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-on-background">Smart Bins</span>
                  <span className="text-[9px] text-muted-taupe font-mono">{visibleStops.length} Pins</span>
                </div>
              </button>

              <button
                onClick={() => setShowWards(!showWards)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  showWards 
                    ? 'bg-background-cream border-secondary/60 shadow-sm' 
                    : 'bg-surface-sand/60 border-outline-variant/30 opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center ${showWards ? 'bg-secondary text-white' : 'bg-surface-dim text-muted-taupe'}`}>
                  {showWards ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-on-background">Ward Polygons</span>
                  <span className="text-[9px] text-muted-taupe font-mono">{selectedWards.length} Active</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ── DYNAMIC MODE-AWARE KPI BLOCKS (Updates based on Wards & Checked Layers) ── */}
        <div className="flex flex-col gap-4">
          {showDynamicRoute ? (
            /* MODE 1: AI Dynamic Route Active (Shows Savings Deltas) */
            <>
              {/* Distance Saved */}
              <div className="bg-surface-sand rounded-organic p-6 md:p-8 flex flex-col gap-1.5 shadow-sm border border-outline-variant/30 hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-taupe font-semibold">
                    Distance Saved Delta (AI Optimized)
                  </span>
                  <Route className="w-5 h-5 text-tertiary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl md:text-5xl font-bold text-terracotta tracking-tight">
                    {isLoading ? '...' : `-${metrics.distance_saved_pct.toFixed(1)}%`}
                  </span>
                  <span className="font-mono text-xs text-muted-taupe">
                    ({metrics.distance_saved_km.toFixed(2)} km avoided across {selectedWards.length} wards)
                  </span>
                </div>
              </div>

              {/* Fuel & Cost cluster */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-sand rounded-organic-alt p-5 flex flex-col gap-1 shadow-sm border border-outline-variant/30 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between text-muted-taupe text-xs font-mono">
                    <span>Diesel Saved</span>
                    <Fuel className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-on-background mt-1">
                    {isLoading ? '...' : `${metrics.diesel_saved_litres.toFixed(2)} L`}
                  </div>
                  <span className="text-[10px] text-muted-taupe">5.5 km/L Baseline</span>
                </div>

                <div className="bg-surface-sand rounded-2xl p-5 flex flex-col gap-1 shadow-sm border border-outline-variant/30 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between text-muted-taupe text-xs font-mono">
                    <span>Cost Saved</span>
                    <IndianRupee className="w-4 h-4 text-primary" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-on-background mt-1">
                    ₹{isLoading ? '...' : Math.round(metrics.total_cost_saved_inr).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-muted-taupe">Fuel + Drivers</span>
                </div>
              </div>

              {/* CO2 bar */}
              <div className="bg-surface-sand rounded-2xl p-4 flex items-center justify-between shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-taupe block font-mono">CO₂ Emissions Avoided</span>
                    <span className="font-mono text-lg font-bold text-secondary">
                      {isLoading ? '...' : `${metrics.co2_avoided_kg.toFixed(1)} kg CO₂e`}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-secondary/15 text-secondary">
                  {metrics.stops_skipped} Bins Skipped
                </span>
              </div>
            </>
          ) : showStaticRoute ? (
            /* MODE 2: Static Baseline Only Active (Shows Legacy Fixed Cost) */
            <>
              {/* Static Total Distance */}
              <div className="bg-surface-sand rounded-organic p-6 md:p-8 flex flex-col gap-1.5 shadow-sm border border-muted-taupe/40 hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-taupe font-semibold">
                    Static Route Distance (Legacy Baseline)
                  </span>
                  <Route className="w-5 h-5 text-muted-taupe" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl md:text-5xl font-bold text-on-background tracking-tight">
                    {isLoading ? '...' : `${metrics.static_distance_km.toFixed(1)} km`}
                  </span>
                  <span className="font-mono text-xs text-muted-taupe">
                    (0% Saved • All {metrics.total_stops} bins visited blindly)
                  </span>
                </div>
              </div>

              {/* Static Fuel & Cost cluster */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-sand rounded-organic-alt p-5 flex flex-col gap-1 shadow-sm border border-outline-variant/30 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between text-muted-taupe text-xs font-mono">
                    <span>Diesel Consumed</span>
                    <Fuel className="w-4 h-4 text-muted-taupe" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-on-background mt-1">
                    {isLoading ? '...' : `${metrics.static_diesel_litres.toFixed(2)} L`}
                  </div>
                  <span className="text-[10px] text-muted-taupe">Total Fuel Burned</span>
                </div>

                <div className="bg-surface-sand rounded-2xl p-5 flex flex-col gap-1 shadow-sm border border-outline-variant/30 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between text-muted-taupe text-xs font-mono">
                    <span>Operating Cost</span>
                    <IndianRupee className="w-4 h-4 text-muted-taupe" />
                  </div>
                  <div className="font-mono text-2xl font-bold text-on-background mt-1">
                    ₹{isLoading ? '...' : Math.round(metrics.static_cost_inr).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-muted-taupe">Un-optimized Run</span>
                </div>
              </div>

              {/* Static CO2 bar */}
              <div className="bg-surface-sand rounded-2xl p-4 flex items-center justify-between shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted-taupe/15 flex items-center justify-center text-muted-taupe">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-taupe block font-mono">CO₂ Emissions Generated</span>
                    <span className="font-mono text-lg font-bold text-on-background">
                      {isLoading ? '...' : `${metrics.static_co2_kg.toFixed(1)} kg CO₂e`}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-muted-taupe/15 text-muted-taupe">
                  0 Bins Skipped (100% Visits)
                </span>
              </div>
            </>
          ) : (
            /* MODE 3: Neither Route Layer Active */
            <div className="bg-surface-sand rounded-[2rem] p-8 text-center border border-outline-variant/40 flex flex-col items-center gap-2">
              <EyeOff className="w-8 h-8 text-muted-taupe mb-1" />
              <h4 className="font-editorial text-lg font-bold text-on-background">Routing Layers Hidden</h4>
              <p className="text-xs text-muted-taupe font-mono max-w-xs">
                Check "AI Dynamic Route" or "Static Baseline" above to inspect comparative distance, fuel, and cost calculations.
              </p>
            </div>
          )}
        </div>

        {/* Dispatch CTA */}
        <div className="pt-1">
          <button
            onClick={() => onDispatchFleet && onDispatchFleet({
              metrics,
              selectedWards,
              dynamicTripsCount: routePolylines.dynamicPaths.length,
              isDynamicActive: showDynamicRoute
            })}
            disabled={isLoading || selectedWards.length === 0}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 px-8 rounded-full shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 group tracking-wide uppercase text-sm disabled:opacity-50 cursor-pointer"
          >
            <span>
              {isLoading 
                ? 'Optimizing CVRP...' 
                : showDynamicRoute 
                  ? `Dispatch AI Fleet (${routePolylines.dynamicPaths.length} Trips in ${selectedWards.length} Wards)` 
                  : 'Dispatch Static Schedule'}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── RIGHT PANEL: Editorial Map Container ── */}
      <section className="w-full lg:w-7/12 min-h-[640px] lg:min-h-[780px] relative flex flex-col">
        <div className="w-full h-full min-h-[620px] flex-1 bg-surface-sand rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative shadow-md border border-outline-variant/40">
          <MapContainer
            center={PUNE_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            attributionControl={false}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            {/* 15 Ward Boundary Polygons */}
            {showWards && zonesData && (
              <GeoJSON
                key={`wards-${selectedWards.join('-')}`}
                data={zonesData}
                style={wardStyle}
                onEachFeature={onEachWard}
              />
            )}

            {/* Static Baseline Polyline (Dashed Taupe) */}
            {showStaticRoute && routePolylines.staticPaths.map((p, idx) => (
              <Polyline
                key={`static-${p.wardId}-${idx}`}
                positions={p.coords}
                pathOptions={{ 
                  color: '#8B7E76', 
                  weight: 2.5, 
                  dashArray: '6, 8', 
                  opacity: 0.7 
                }}
              >
                <Tooltip sticky>
                  <div className="font-mono text-xs">
                    <strong>Static Baseline Route:</strong> {p.wardId}
                    <div className="text-muted-taupe text-[10px]">Visits all stops without fill awareness</div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

            {/* Dynamic AI CVRP Polyline (Solid Terracotta) */}
            {showDynamicRoute && routePolylines.dynamicPaths.map((p, idx) => (
              <Polyline
                key={`dynamic-${p.wardId}-${p.vehicleId}-${idx}`}
                positions={p.coords}
                pathOptions={{ 
                  color: '#C25E4B', 
                  weight: 4.5, 
                  opacity: 0.95 
                }}
              >
                <Tooltip sticky>
                  <div className="font-mono text-xs">
                    <span className="text-terracotta font-bold">AI Dynamic Truck #{p.vehicleId} ({p.wardId})</span>
                    <div>Distance: {p.distanceKm} km</div>
                    <div>Payload: {p.loadKg} kg / 5000 kg</div>
                  </div>
                </Tooltip>
              </Polyline>
            ))}

            {/* Stop Markers */}
            {showStops && visibleStops.map(stop => {
              const color = getStopColor(stop);
              const isCritical = stop.predicted_fill_pct >= 80;
              return (
                <CircleMarker
                  key={stop.stop_id}
                  center={[stop.lat, stop.lon]}
                  radius={isCritical ? 6.5 : 4.5}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: isCritical ? 2.5 : 1,
                  }}
                  eventHandlers={{ 
                    click: () => setActiveStop(stop) 
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]}>
                    <div className="font-mono text-[11px] leading-tight">
                      <div className="font-bold text-on-background">{stop.name}</div>
                      <div className="text-muted-taupe">{stop.ward_name} ({stop.zone_id})</div>
                      <div className={`font-bold ${isCritical ? 'text-terracotta' : 'text-secondary'}`}>
                        Fill: {stop.predicted_fill_pct}% ({stop.urgency})
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {/* ── TOP-LEFT OVERLAY: Quick Ward Focus Dropdown ── */}
          <div className="absolute top-4 left-4 z-10 bg-background-cream/95 backdrop-blur-md rounded-2xl p-3 shadow-md border border-outline-variant/40 flex flex-col gap-1.5 max-w-[260px]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-taupe font-bold flex items-center justify-between gap-1">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-primary" />
                Focus Single Ward
              </span>
              <button
                onClick={selectAllWards}
                className="text-[9px] text-terracotta hover:underline font-bold"
              >
                All 15 Wards
              </button>
            </span>
            <select
              value={selectedWards.length === 1 ? selectedWards[0] : selectedWards.length === allWardIds.length ? 'ALL' : 'CUSTOM'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  selectAllWards();
                  setMapCenter(PUNE_CENTER);
                  setMapZoom(DEFAULT_ZOOM);
                } else if (val !== 'CUSTOM') {
                  selectOnlyWard(val);
                }
              }}
              className="bg-surface-sand text-on-background text-xs font-semibold rounded-xl px-2.5 py-1.5 border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All 15 Wards (City Overview)</option>
              {selectedWards.length > 1 && selectedWards.length < allWardIds.length && (
                <option value="CUSTOM">Custom Selection ({selectedWards.length} Wards Active)</option>
              )}
              {availableWards.map(w => (
                <option key={w.id} value={w.id}>
                  {w.id} — {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── TOP-RIGHT OVERLAY: Quick Layer Visibility Toggles ── */}
          <div className="absolute top-4 right-4 z-10 bg-background-cream/95 backdrop-blur-md rounded-2xl p-2 shadow-md border border-outline-variant/40 flex items-center gap-1.5">
            <button
              onClick={() => setShowDynamicRoute(!showDynamicRoute)}
              title="Toggle AI Dynamic Route"
              className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                showDynamicRoute 
                  ? 'bg-terracotta text-white shadow-sm' 
                  : 'bg-surface-sand text-muted-taupe hover:text-on-background'
              }`}
            >
              <span className="w-2.5 h-1 bg-white rounded-full"></span>
              <span>AI Route</span>
            </button>

            <button
              onClick={() => setShowStaticRoute(!showStaticRoute)}
              title="Toggle Static Baseline"
              className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                showStaticRoute 
                  ? 'bg-[#8B7E76] text-white shadow-sm' 
                  : 'bg-surface-sand text-muted-taupe hover:text-on-background'
              }`}
            >
              <span className="w-2.5 h-0.5 border-b border-dashed border-white"></span>
              <span>Static</span>
            </button>

            <button
              onClick={() => setShowStops(!showStops)}
              title="Toggle Bins"
              className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 transition-all ${
                showStops 
                  ? 'bg-secondary text-white shadow-sm' 
                  : 'bg-surface-sand text-muted-taupe hover:text-on-background'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>Bins</span>
            </button>
          </div>

          {/* ── BOTTOM-RIGHT OVERLAY: Comprehensive Map Legend ── */}
          <div className="absolute bottom-28 md:bottom-24 right-4 z-10 max-w-[270px] bg-surface-sand/95 backdrop-blur-xl rounded-2xl border border-outline-variant/40 shadow-lg overflow-hidden transition-all">
            {/* Legend Header */}
            <button
              type="button"
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              aria-expanded={isLegendOpen}
              aria-label="Toggle map legend"
              className="w-full px-3.5 py-2.5 bg-background-cream/80 flex items-center justify-between cursor-pointer border-b border-outline-variant/30 hover:bg-background-cream text-left transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-on-background font-bold">
                  Map Legend
                </span>
              </div>
              <span className="text-muted-taupe hover:text-on-background">
                {isLegendOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </span>
            </button>

            {/* Legend Body */}
            {isLegendOpen && (
              <div className="p-3.5 flex flex-col gap-3 font-mono text-[11px]">
                {/* Route Types */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-taupe uppercase tracking-wider font-bold">Routes</span>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-1 bg-terracotta rounded-full flex-shrink-0"></span>
                    <span className="text-on-background text-[11px] font-semibold">AI Dynamic (CVRP)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 border-b-2 border-dashed border-[#8B7E76] flex-shrink-0"></span>
                    <span className="text-muted-taupe text-[11px]">Static Fixed Schedule</span>
                  </div>
                </div>

                {/* Bin Fill Urgency Levels */}
                <div className="flex flex-col gap-1.5 border-t border-outline-variant/20 pt-2">
                  <span className="text-[10px] text-muted-taupe uppercase tracking-wider font-bold">Bin Urgency (Fill %)</span>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-terracotta flex-shrink-0 ring-2 ring-terracotta/30"></span>
                    <span className="text-on-background text-[11px]">
                      &ge; 80% Critical Overflow
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] flex-shrink-0"></span>
                    <span className="text-muted-taupe text-[11px]">65%&ndash;79% High Urgency</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary flex-shrink-0"></span>
                    <span className="text-muted-taupe text-[11px]">&lt; 65% Normal (Skipped)</span>
                  </div>
                </div>

                {/* Ward Layer */}
                <div className="flex items-center gap-2 border-t border-outline-variant/20 pt-2">
                  <div className="w-3.5 h-3.5 rounded border border-secondary/70 bg-secondary/20 flex-shrink-0"></div>
                  <span className="text-muted-taupe text-[11px]">{selectedWards.length} Selected of 15 Wards</span>
                </div>
              </div>
            )}
          </div>

          {/* ── FLOATING STOP INSPECTOR CARD (When Stop is Clicked) ── */}
          {activeStop && (
            <div className="absolute top-20 left-4 z-20 bg-background-cream/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-primary/30 max-w-[280px] animate-in fade-in duration-200">
              <div className="flex justify-between items-start pb-2 border-b border-outline-variant/30">
                <div className="flex items-center gap-1.5 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Stop Details</span>
                </div>
                <button 
                  onClick={() => setActiveStop(null)}
                  className="text-muted-taupe hover:text-on-background p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <h4 className="font-bold text-sm text-on-background leading-tight">
                  {activeStop.name}
                </h4>
                <div className="text-xs text-muted-taupe font-mono">
                  Ward: {activeStop.ward_name} ({activeStop.zone_id})
                </div>

                <div className="bg-surface-sand p-2.5 rounded-xl flex items-center justify-between font-mono text-xs mt-1">
                  <span className="text-muted-taupe">Predicted Fill</span>
                  <span className={`font-bold ${activeStop.predicted_fill_pct >= 80 ? 'text-terracotta' : 'text-secondary'}`}>
                    {activeStop.predicted_fill_pct}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-muted-taupe">Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    activeStop.predicted_fill_pct >= 80 
                      ? 'bg-terracotta/15 text-terracotta' 
                      : activeStop.predicted_fill_pct >= 65 
                        ? 'bg-[#E07A5F]/15 text-[#E07A5F]' 
                        : 'bg-secondary/15 text-secondary'
                  }`}>
                    {activeStop.urgency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── BOTTOM SIMULATION CONTROLLER ── */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-surface-sand/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg border border-outline-variant/40 flex flex-col gap-2.5 w-[95%] max-w-[640px]">
            {/* Row 1: Surge Preset Buttons */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
              <button
                onClick={() => onDateChange('2026-08-20')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isNormal ? 'bg-primary text-white font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-dim'
                }`}
              >
                Normal Day
              </button>

              <button
                onClick={() => onDateChange('2026-08-25')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isGaneshSurge ? 'bg-terracotta text-white font-bold shadow-sm' : 'text-terracotta hover:bg-terracotta/10'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Ganesh Utsav 3.2×</span>
              </button>

              <button
                onClick={() => onDateChange('2026-08-19')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isMandiSurge ? 'bg-secondary text-white font-bold shadow-sm' : 'text-secondary hover:bg-secondary/10'
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Subzi Mandi 2.2×</span>
              </button>

              <button
                onClick={() => onDateChange('2026-10-21')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all cursor-pointer ${
                  isDiwaliSurge ? 'bg-[#D97706] text-white font-bold shadow-sm' : 'text-[#D97706] hover:bg-[#D97706]/10'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Diwali 3.5×</span>
              </button>
            </div>

            {/* Row 2: Date Picker Input */}
            <div className="flex items-center gap-3 border-t border-outline-variant/30 pt-2">
              <Calendar className="w-4 h-4 text-muted-taupe flex-shrink-0" />
              <label className="font-mono text-[10px] text-muted-taupe uppercase tracking-wider font-bold whitespace-nowrap">
                Custom Date
              </label>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="flex-1 bg-background-cream text-on-background text-xs font-mono font-bold rounded-lg px-2.5 py-1 border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
