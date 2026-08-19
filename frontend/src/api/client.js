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

export async function fetchStops(dateStr, { signal } = {}) {
  const url = dateStr
    ? `${API_BASE}/api/stops?date=${encodeURIComponent(dateStr)}`
    : `${API_BASE}/api/stops`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch stops: HTTP ${res.status}`);
  return await res.json();
}

/**
 * Shared 202-polling helper used by routes and savings endpoints.
 * Polls up to `maxAttempts` times at `delayMs` intervals while the server
 * returns HTTP 202 (optimization in progress).
 */
async function pollUntilReady(url, label, { signal, maxAttempts = 45, delayMs = 800 } = {}) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const res = await fetch(url, { signal });
    if (res.status === 202) {
      attempts++;
      await new Promise(r => setTimeout(r, delayMs));
      continue;
    }
    if (!res.ok) throw new Error(`Failed to fetch ${label}: HTTP ${res.status}`);
    return await res.json();
  }
  throw new Error(`${label} timed out.`);
}

export async function fetchRoutesComparison(dateStr, { signal } = {}) {
  const url = dateStr
    ? `${API_BASE}/api/routes/comparison?date=${encodeURIComponent(dateStr)}`
    : `${API_BASE}/api/routes/comparison`;
  return pollUntilReady(url, 'Route optimization', { signal });
}

export async function fetchSavings(dateStr, { signal } = {}) {
  const url = dateStr
    ? `${API_BASE}/api/stats/savings?date=${encodeURIComponent(dateStr)}`
    : `${API_BASE}/api/stats/savings`;
  return pollUntilReady(url, 'Savings calculation', { signal });
}

export async function fetchCitizenLookup(zoneId) {
  const res = await fetch(`${API_BASE}/api/citizen/lookup?zone_id=${encodeURIComponent(zoneId)}`);
  if (!res.ok) throw new Error(`Failed to lookup citizen schedule: HTTP ${res.status}`);
  return await res.json();
}
