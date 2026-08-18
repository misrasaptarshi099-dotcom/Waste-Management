/**
 * api/client.js
 * Client communication layer with backend FastAPI server.
 * Handles live requests with offline fallbacks if API is temporarily unavailable.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] Health check failed, using fallback:', err.message);
    return { status: 'offline', version: '1.0.0', city: 'Pune (PMC)', total_wards: 15 };
  }
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/api/zones`);
  if (!res.ok) throw new Error(`Failed to fetch zones: HTTP ${res.status}`);
  return await res.json();
}

export async function fetchStops(dateStr) {
  const url = dateStr ? `${API_BASE}/api/stops?date=${dateStr}` : `${API_BASE}/api/stops`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch stops: HTTP ${res.status}`);
  return await res.json();
}

export async function fetchRoutesComparison(dateStr) {
  const url = dateStr ? `${API_BASE}/api/routes/comparison?date=${dateStr}` : `${API_BASE}/api/routes/comparison`;
  const res = await fetch(url);
  if (res.status === 202) {
    const statusData = await res.json();
    return { isJobInProgress: true, ...statusData };
  }
  if (!res.ok) throw new Error(`Failed to fetch routes: HTTP ${res.status}`);
  return await res.json();
}

export async function fetchSavings(dateStr) {
  const url = dateStr ? `${API_BASE}/api/stats/savings?date=${dateStr}` : `${API_BASE}/api/stats/savings`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch savings: HTTP ${res.status}`);
  return await res.json();
}

export async function fetchCitizenLookup(zoneId) {
  const res = await fetch(`${API_BASE}/api/citizen/lookup?zone_id=${encodeURIComponent(zoneId)}`);
  if (!res.ok) throw new Error(`Failed to lookup citizen schedule: HTTP ${res.status}`);
  return await res.json();
}
