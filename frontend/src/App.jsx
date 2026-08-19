import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/CommandCenter/Header';
import MapView from './components/CommandCenter/MapView';
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
import { AlertCircle } from 'lucide-react';

/* ─── Municipal Command Center Shell (Government Dashboard) ─── */
function CommandCenter() {
  const [activeTab, setActiveTab] = useState('gis');
  const [currentDate, setCurrentDate] = useState('2026-08-20');
  const [selectedZone, setSelectedZone] = useState('ALL');
  
  const [health, setHealth] = useState(null);
  const [zones, setZones] = useState(null);
  const [stops, setStops] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [savings, setSavings] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchPayload, setDispatchPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleOpenDispatchModal = (payload) => {
    setDispatchPayload(payload || null);
    setIsDispatchModalOpen(true);
  };

  // Initial load
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

  // Date-specific data fetch
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
          setErrorMessage(`API sync: ${err.message}`);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadDateData();
    return () => { isCancelled = true; };
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-background-cream text-on-background flex flex-col font-body antialiased selection:bg-surface-sand selection:text-primary relative">
      <div className="grain-overlay"></div>

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthStatus={health}
      />

      <main className="flex-1 w-full px-4 md:px-12 py-4 flex flex-col gap-6">
        {errorMessage && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 text-xs text-primary flex items-center gap-2 max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'analytics' ? (
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
            onDispatchFleet={() => handleOpenDispatchModal(null)}
          />
        ) : (
          <MapView
            zonesData={zones}
            stopsData={stops}
            routesData={routes}
            savings={savings}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            isLoading={isLoading}
            onDispatchFleet={handleOpenDispatchModal}
          />
        )}
      </main>

      <DispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setDispatchPayload(null);
        }}
        routesData={routes}
        currentDate={currentDate}
        dispatchPayload={dispatchPayload}
      />
    </div>
  );
}

/* ─── Root App: Route-Level Separation ─── */
export default function App() {
  return (
    <Routes>
      {/* Citizen PWA at /citizen — completely standalone, own layout */}
      <Route path="/citizen" element={<CitizenApp />} />

      {/* Municipal Command Center at / — government dashboard */}
      <Route path="/*" element={<CommandCenter />} />
    </Routes>
  );
}
