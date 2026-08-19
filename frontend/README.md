# SwachhRoute AI — Municipal Command Center Frontend

**SwachhRoute AI** is an AI-enabled dynamic municipal solid waste collection route optimization platform and citizen transparency portal engineered for the **Pune Municipal Corporation (PMC)** under the **Smart India Hackathon (SIH 2026)**.

---

## 🏗️ Tech Stack

- **Framework:** React 18 + Vite (Fast HMR & Optimized Bundling)
- **Styling:** Tailwind CSS + Custom Design System Tokens (Stitch Fluid Narrative)
- **GIS / Mapping:** Leaflet 1.9 + React-Leaflet with Pune Ward GeoJSON polygons & dynamic polyline rendering
- **Icons & Motion:** Lucide React, Canvas Confetti, CSS Micro-animations
- **Typography:** DM Sans, Noto Serif, Fraunces, JetBrains Mono, Cabinet Grotesk

---

## 🚀 Available Scripts

In the `frontend/` directory, you can run:

### `npm install`
Installs all project dependencies.

### `npm run dev`
Runs the application in development mode with Hot Module Replacement (HMR).  
Open [http://localhost:5173](http://localhost:5173) to view the Municipal Command Center in the browser.  
Open [http://localhost:5173/citizen](http://localhost:5173/citizen) for the Citizen Waste Tracker & Grievance Portal.

### `npm run build`
Builds the production-ready static assets into the `dist/` directory with gzip/brotli-optimized bundles.

### `npm run preview`
Locally preview the production build output.

---

## 🗺️ Key Features

1. **Municipal GIS Command Center (`/`):**
   - 15 Pune Municipal Corporation (PMC) administrative ward polygons with interactive fill-state overlays.
   - 429 smart collection stops categorized by real-time fill level (Normal, Elevated, High Urgency, Critical Overflow).
   - Side-by-side comparison: **Legacy Static Fixed Schedule** vs. **AI Dynamic CVRP Route**.
   - Multi-ward granular filtering with live fuel, distance, cost (INR), and CO₂ delta recalculation.
   - 4 Event Surge Presets: Baseline Normal Day, Subzi Mandi Haat (2.2×), Ganesh Utsav (3.2×), and Diwali Festive Peak (3.5×).
   - Auditable Digital Route Manifest generator & vehicle dispatch modal.

2. **Ward Performance & Analytics:**
   - 15-ward roster with dynamic efficiency calculations, stops dispatched, distance delta, and cost savings.
   - One-click RFC-4180 compliant CSV export of 15-ward municipal analytics with automatic Blob URL cleanup.
   - Real-time hotspot alerts derived from active route loads and skip heuristics.

3. **Fleet Logistics Monitor:**
   - Live vehicle tracking across Tata Ace 4.0T municipal compactors.
   - Real-time payload percentage, stops served, and status indicators.

4. **Bilingual Citizen Portal (`/citizen`):**
   - Marathi & English language toggle.
   - Ward-specific waste collection schedule lookup.
   - Live vehicle arrival tracking (estimated time of arrival, vehicle registration, stops away).
   - Swachh Bharat Mission (SBM-U 2.0) four-stream source segregation preparation guide.
   - Overflowing bin grievance reporting with camera/photo upload and ticket ID generation.

---

## 🔗 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend FastAPI service | `http://localhost:8000` |
