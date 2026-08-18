import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  CircleMarker, 
  Popup, 
  Tooltip, 
  Polyline, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { Layers, Eye, EyeOff, Navigation, AlertCircle, Info, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

// Center of Pune Municipal Corporation (PMC)
const PUNE_CENTER = [18.5204, 73.8567];
const DEFAULT_ZOOM = 12;

// Helper to center and zoom map dynamically
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
  selectedZone, 
  onSelectZone,
  filterUrgency,
  setFilterUrgency 
}) {
  const [showWards, setShowWards] = useState(true);
  const [showStaticRoute, setShowStaticRoute] = useState(true);
  const [showDynamicRoute, setShowDynamicRoute] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [activeStop, setActiveStop] = useState(null);
  const [mapCenter, setMapCenter] = useState(PUNE_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // Filter stops based on selected ward and urgency
  const visibleStops = useMemo(() => {
    if (!stopsData || !stopsData.stops) return [];
    let list = stopsData.stops;

    if (selectedZone && selectedZone !== 'ALL') {
      list = list.filter(s => s.zone_id === selectedZone);
    }

    if (filterUrgency === 'CRITICAL') {
      list = list.filter(s => s.urgency === 'CRITICAL' || s.is_overflow_risk);
    } else if (filterUrgency === 'HIGH') {
      list = list.filter(s => s.urgency === 'CRITICAL' || s.urgency === 'HIGH');
    }

    return list;
  }, [stopsData, selectedZone, filterUrgency]);

  // Extract polyline coordinate arrays for Static & Dynamic routes
  const routePolylines = useMemo(() => {
    if (!routesData || !routesData.ward_results) return { staticPaths: [], dynamicPaths: [] };

    const staticPaths = [];
    const dynamicPaths = [];

    const targetWards = selectedZone && selectedZone !== 'ALL' 
      ? [selectedZone] 
      : Object.keys(routesData.ward_results);

    targetWards.forEach(wId => {
      const wData = routesData.ward_results[wId];
      if (!wData) return;

      // 1. Static Route Path
      if (wData.static_route && wData.static_route.ordered_stops) {
        const coords = wData.static_route.ordered_stops.map(s => [s.lat, s.lon]);
        if (coords.length > 1) {
          staticPaths.push({ wardId: wId, coords });
        }
      }

      // 2. Dynamic AI Vehicle Routes
      if (wData.dynamic_route && wData.dynamic_route.routes) {
        wData.dynamic_route.routes.forEach(vRoute => {
          if (vRoute.stops && vRoute.stops.length > 0) {
            const coords = vRoute.stops.map(s => [s.lat, s.lon]);
            if (coords.length > 1) {
              dynamicPaths.push({ 
                wardId: wId, 
                vehicleId: vRoute.vehicle_id, 
                coords,
                loadKg: vRoute.load_kg,
                distanceKm: vRoute.distance_km 
              });
            }
          }
        });
      }
    });

    return { staticPaths, dynamicPaths };
  }, [routesData, selectedZone]);

  // Style GeoJSON ward polygons
  const wardStyle = (feature) => {
    const isSelected = selectedZone === feature.properties.zone_id;
    return {
      fillColor: isSelected ? '#10B981' : '#1E293B',
      weight: isSelected ? 2.5 : 1.2,
      opacity: 0.8,
      color: isSelected ? '#4EDEA3' : '#475569',
      fillOpacity: isSelected ? 0.35 : 0.15,
    };
  };

  // Ward polygon interactions
  const onEachWard = (feature, layer) => {
    const p = feature.properties;
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.4,
          color: '#10B981',
          weight: 2,
        });
      },
      mouseout: (e) => {
        const l = e.target;
        if (selectedZone !== p.zone_id) {
          l.setStyle({
            fillOpacity: 0.15,
            color: '#475569',
            weight: 1.2,
          });
        }
      },
      click: () => {
        onSelectZone(p.zone_id);
        if (p.centroid_lat && p.centroid_lon) {
          setMapCenter([p.centroid_lat, p.centroid_lon]);
          setMapZoom(13.5);
        }
      },
    });
  };

  // Stop marker color resolver
  const getStopMarkerColor = (stop) => {
    if (stop.is_overflow_risk || stop.predicted_fill_pct >= 80) return '#EF4444'; // Red
    if (stop.predicted_fill_pct >= 65) return '#F59E0B'; // Amber
    if (stop.predicted_fill_pct >= 50) return '#EAB308'; // Yellow
    return '#22C55E'; // Green
  };

  return (
    <div className="w-full h-full min-h-[580px] lg:min-h-[640px] relative rounded-2xl overflow-hidden border border-[#1E293B] shadow-2xl bg-[#030712]">
      {/* Interactive Map */}
      <MapContainer
        center={PUNE_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        attributionControl={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} />

        {/* CartoDB Dark Matter Base Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 15 PMC Ward Boundary Polygons */}
        {showWards && zonesData && (
          <GeoJSON
            key={`wards-${selectedZone || 'all'}`}
            data={zonesData}
            style={wardStyle}
            onEachFeature={onEachWard}
          />
        )}

        {/* Static Baseline Route Polylines (Dashed Gray) */}
        {showStaticRoute && routePolylines.staticPaths.map((p, idx) => (
          <Polyline
            key={`static-${p.wardId}-${idx}`}
            positions={p.coords}
            pathOptions={{
              color: '#64748B',
              weight: 2.2,
              dashArray: '6, 8',
              opacity: 0.6,
            }}
          >
            <Tooltip sticky>
              <div className="font-mono text-xs">
                <strong>Static Fixed Route:</strong> {p.wardId}
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Dynamic AI Optimized Route Polylines (Glowing Emerald) */}
        {showDynamicRoute && routePolylines.dynamicPaths.map((p, idx) => (
          <Polyline
            key={`dynamic-${p.wardId}-${p.vehicleId}-${idx}`}
            positions={p.coords}
            pathOptions={{
              color: '#10B981',
              weight: 3.8,
              opacity: 0.95,
              lineJoin: 'round',
            }}
          >
            <Tooltip sticky>
              <div className="font-mono text-xs">
                <span className="text-emerald-400 font-bold">AI Dynamic Truck #{p.vehicleId}</span>
                <div>Distance: {p.distanceKm} km</div>
                <div>Payload: {p.loadKg} kg</div>
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Collection Stops Circle Markers */}
        {showStops && visibleStops.map(stop => {
          const color = getStopMarkerColor(stop);
          const isCritical = stop.predicted_fill_pct >= 80;
          return (
            <CircleMarker
              key={stop.stop_id}
              center={[stop.lat, stop.lon]}
              radius={isCritical ? 7 : 5}
              pathOptions={{
                color: isCritical ? '#FFFFFF' : color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isCritical ? 2 : 1,
                className: isCritical ? 'pulse-critical' : '',
              }}
              eventHandlers={{
                click: () => setActiveStop(stop),
              }}
            >
              <Tooltip direction="top" offset={[0, -5]}>
                <div className="font-mono text-[11px] leading-tight">
                  <div className="font-bold text-slate-100">{stop.name}</div>
                  <div className="text-slate-300">Ward: {stop.zone_id} ({stop.ward_name})</div>
                  <div className={`font-semibold ${isCritical ? 'text-red-400 font-bold' : 'text-emerald-300'}`}>
                    Fill: {stop.predicted_fill_pct}% ({stop.urgency})
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Layer Toggles Pill */}
        <div className="bg-[#0F172A]/90 backdrop-blur-md p-2 rounded-xl border border-[#1E293B] shadow-lg flex flex-wrap gap-1.5 max-w-[280px] sm:max-w-none">
          <button
            onClick={() => setShowDynamicRoute(!showDynamicRoute)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              showDynamicRoute 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                : 'text-slate-500 hover:text-slate-300 bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>AI Dynamic</span>
          </button>

          <button
            onClick={() => setShowStaticRoute(!showStaticRoute)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              showStaticRoute 
                ? 'bg-slate-700 text-slate-200 border border-slate-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-300 bg-slate-800/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Static Baseline</span>
          </button>

          <button
            onClick={() => setShowWards(!showWards)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              showWards 
                ? 'bg-[#1E293B] text-slate-200 border border-[#334155]' 
                : 'text-slate-500 hover:text-slate-300 bg-slate-800/40'
            }`}
          >
            <span>Wards (15)</span>
          </button>

          <button
            onClick={() => setShowStops(!showStops)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              showStops 
                ? 'bg-[#1E293B] text-slate-200 border border-[#334155]' 
                : 'text-slate-500 hover:text-slate-300 bg-slate-800/40'
            }`}
          >
            <span>Stops ({visibleStops.length})</span>
          </button>
        </div>

        {/* Urgency Filter Bar */}
        <div className="bg-[#0F172A]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#1E293B] shadow-lg flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Urgency:</span>
          <button
            onClick={() => setFilterUrgency('ALL')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              filterUrgency === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterUrgency('HIGH')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              filterUrgency === 'HIGH' ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            ≥65% (High)
          </button>
          <button
            onClick={() => setFilterUrgency('CRITICAL')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              filterUrgency === 'CRITICAL' ? 'bg-red-500/30 text-red-300 font-bold border border-red-500/50' : 'text-slate-400 hover:text-red-300'
            }`}
          >
            ≥80% (Critical)
          </button>
        </div>
      </div>

      {/* Reset Center Button */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => {
            onSelectZone('ALL');
            setMapCenter(PUNE_CENTER);
            setMapZoom(DEFAULT_ZOOM);
          }}
          className="bg-[#0F172A]/90 hover:bg-[#1E293B] backdrop-blur-md p-2 rounded-xl border border-[#1E293B] text-slate-300 hover:text-white shadow-lg transition-all flex items-center gap-1.5 text-xs font-mono"
          title="Reset to City Overview"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset View</span>
        </button>
      </div>

      {/* Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-[#0F172A]/95 backdrop-blur-md p-3 rounded-xl border border-[#1E293B] shadow-xl text-xs font-mono">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">GIS Route Legend</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_#10B981]"></span>
            <span className="text-slate-200">AI Dynamic CVRP Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-b border-dashed border-slate-400"></span>
            <span className="text-slate-400">Static Fixed Schedule</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-slate-300">Overflow Alert (≥80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Fill Warning (65-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Normal Fill (&lt;65%)</span>
          </div>
        </div>
      </div>

      {/* Active Selected Stop Bottom Modal Card */}
      {activeStop && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm w-full bg-[#0F172A]/98 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/40 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                Stop Node Details
              </div>
              <h4 className="font-headline font-bold text-slate-100 text-base">{activeStop.name}</h4>
              <p className="text-xs text-slate-400">{activeStop.ward_name} ({activeStop.zone_id})</p>
            </div>
            <button
              onClick={() => setActiveStop(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#1E293B]/60 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block">Predicted Fill</span>
              <span className={`text-base font-bold ${activeStop.predicted_fill_pct >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                {activeStop.predicted_fill_pct}%
              </span>
            </div>
            <div className="bg-[#1E293B]/60 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block">Urgency Status</span>
              <span className="text-slate-200 font-bold uppercase">{activeStop.urgency}</span>
            </div>
            <div className="bg-[#1E293B]/60 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block">Bin Capacity</span>
              <span className="text-slate-200">{activeStop.bin_capacity_kg || 400} kg</span>
            </div>
            <div className="bg-[#1E293B]/60 p-2 rounded-lg">
              <span className="text-slate-400 text-[10px] block">Days Since Pickup</span>
              <span className="text-slate-200">{activeStop.days_since_last_pickup || 1} day(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
