import React, { useState, useEffect } from 'react';
import Header from './components/CommandCenter/Header';
import KpiPanel from './components/CommandCenter/KpiPanel';
import MapView from './components/CommandCenter/MapView';
import SimulationScrubber from './components/CommandCenter/SimulationScrubber';
import WardAnalytics from './components/CommandCenter/WardAnalytics';
import FleetLogistics from './components/CommandCenter/FleetLogistics';
import CitizenApp from './components/CitizenPortal/CitizenApp';
import DispatchModal from './components/CommandCenter/DispatchModal';
import { 
  fetchHealth, 
  fetchZones, 
  fetchStops, 
  fetchRoutesComparison, 
  fetchSavings 
} from './api/client';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('gis'); // 'gis' | 'analytics' | 'fleet' | 'citizen'
  const [currentDate, setCurrentDate] = useState('2026-08-20');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  
  const [health, setHealth] = useState(null);
  const [zones, setZones] = useState(null);
  const [stops, setStops] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [savings, setSavings] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Initial load: health & zones
  useEffect(() => {
    async function initData() {
      try {
        const [healthRes, zonesRes] = await Promise.all([
          fetchHealth(),
          fetchZones(),
        ]);
        setHealth(healthRes);
        setZones(zonesRes);
      } catch (err) {
        console.warn('[App] Initial load error:', err.message);
      }
    }
    initData();
  }, []);

  // Fetch date-specific data on date change
  useEffect(() => {
    let isCancelled = false;

    async function loadDateData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [stopsRes, routesRes, savingsRes] = await Promise.all([
          fetchStops(currentDate),
          fetchRoutesComparison(currentDate),
          fetchSavings(currentDate),
        ]);

        if (!isCancelled) {
          setStops(stopsRes);
          setRoutes(routesRes);
          setSavings(savingsRes);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[App] Failed to fetch date data:', err.message);
          setErrorMessage(`API synchronization error: ${err.message}`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDateData();
    return () => { isCancelled = true; };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-body antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={health}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-[1680px] mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'citizen' ? (
          <CitizenApp />
        ) : activeTab === 'analytics' ? (
          <WardAnalytics
            routesData={routes}
            zonesData={zones}
            onSelectWard={(wId) => {
              setSelectedZone(wId);
              setActiveTab('gis');
            }}
          />
        ) : activeTab === 'fleet' ? (
          <FleetLogistics
            routesData={routes}
            selectedZone={selectedZone}
          />
        ) : (
          /* Command Center (GIS) Main View */
          <div className="flex flex-col gap-6">
            {/* Top Telemetry KPI Cards */}
            <KpiPanel
              savings={savings}
              isLoading={isLoading}
            />

            {/* Middle Section: GIS Map + Quick Controls */}
            <div className="grid grid-cols-1 gap-6">
              <MapView
                zonesData={zones}
                stopsData={stops}
                routesData={routes}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                filterUrgency={filterUrgency}
                setFilterUrgency={setFilterUrgency}
              />
            </div>

            {/* Bottom Section: Simulation Scrubber & Event Trigger */}
            <SimulationScrubber
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              isLoading={isLoading}
              onDispatchFleet={() => setIsDispatchModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Fleet Dispatch Modal */}
      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        routesData={routes}
        currentDate={currentDate}
      />
    </div>
  );
}
