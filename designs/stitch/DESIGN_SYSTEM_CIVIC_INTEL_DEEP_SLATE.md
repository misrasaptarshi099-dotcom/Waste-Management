# Design System: Civic Intel Deep Slate
## High-Agency Municipal Operations & Command Center Console

---

## 1. Brand & Style
The design system is engineered for high-agency municipal operations, evoking the authority and precision of a modern air traffic control console. It targets municipal health officers and fleet dispatchers who require immediate, actionable intelligence to manage urban logistics.

The visual style is **Corporate / Modern** with a heavy emphasis on **Clinical Precision**. It utilizes a "Deep Slate" foundation to minimize eye strain during long shifts while maintaining a high information density ("Cockpit Dense"). The aesthetic is strictly professional—avoiding playful trends like neon purple glows or soft neomorphism—instead favoring 1px structural borders, tactical color coding, and crisp, monospaced data visualization.

**Key Principles:**
- **Authority through Clarity:** Use sharp lines and a structured grid to convey reliability.
- **Agency-Focused:** Prioritize telemetry and KPIs that allow for rapid decision-making.
- **GIS-Centric:** The map is the primary source of truth, with UI elements acting as a supportive analytical layer.

---

## 2. Colors
The palette is built on a "Deep Slate" hierarchy to provide a sophisticated, low-fatigue environment for dark-mode operations.

- **Primary (Emerald Optimization Green):** `#10B981` / `#4EDEA3` — Reserved exclusively for AI-optimized paths, successful deltas, and active dispatch triggers. This is the "agency" color.
- **Secondary (Cockpit Surface):** `#0F172A` / `#1A202C` — Used for elevated cards, sidebars, and functional containers.
- **Tertiary (Structural Muted Border):** `#1E293B` — A dedicated color for 1px division lines to maintain layout structure without high contrast.
- **Neutral (Deep Slate Canvas):** `#030712` / `#0E131F` — The base background layer (Zinc-950).

**Status Indicators:**
- **Red (#EF4444):** Immediate overflow risk (>75% fill).
- **Amber (#F59E0B):** Warning state (50-75% fill).
- **Green (#22C55E):** Stable baseline (<50% fill).
- **Slate-500 (#64748B):** Used specifically for the "Static Baseline" routes to distinguish them from AI-optimized paths.

---

## 3. Typography
The typographic system is split into three distinct functional roles:
1. **Cabinet Grotesk (Headers):** Used for primary navigation and card titles. Its tight tracking and geometric weight convey modern authority.
2. **Satoshi (Body):** Optimized for readability in tooltips, descriptions, and citizen instructions. 
3. **JetBrains Mono (Telemetry):** Crucial for the "Cockpit" feel. All numerical data, timestamps, and KPIs must use this font to ensure tabular alignment and a technical aesthetic.

**Mobile Scaling:**
- Headlines larger than 32px should scale down by 25% on mobile devices to maintain screen real estate for map viewports.
- Telemetry labels must remain at 12px for legibility in dense mobile tables.

---

## 4. Layout & Spacing
The layout uses an **Asymmetric Fixed Grid** for the command center and a **Fluid Stream** for the citizen PWA.

**Command Center (Desktop):**
- Uses a 30/70 split. The left 30% is a fixed-width analytical sidebar for telemetry and KPI cards. The right 70% is a full-height GIS viewport.
- Spacing follows a 4px baseline. Most containers use 16px (4 units) of internal padding.

**Citizen PWA (Mobile):**
- Single column vertical layout.
- Margins are set to 16px with a focus on 48px minimum tap targets for accessibility in urban environments.

**Reflow Rules:**
- At <1024px, the sidebar collapses into a bottom-drawer or a toggleable overlay to maximize map visibility.

---

## 5. Components

### Executive KPI Cards
- **Background:** `#0F172A` with a 1px `#1E293B` border.
- **Content:** Top-aligned `telemetry-label` in Slate-400, followed by a large `telemetry-kpi` value.
- **Badge:** Any percentage deltas use a small rounded-md badge with a 10% opacity background of the status color (e.g., Emerald for savings).

### Buttons
- **Primary:** Emerald Background (`#10B981`), Black text (for contrast), 8px rounded.
- **Secondary/Ghost:** Transparent background, 1px Slate-800 border, White text.

### GIS Map Markers
- **Base Stop:** SVG Circle.
- **Dynamic Polyline:** 4.5px weight, solid Emerald with a subtle outer glow (`0 0 10px #10B981`).
- **Static Polyline:** 2.5px weight, dashed Slate-500.

### Input Fields
- Dark background (`#030712`), 1px border (`#1E293B`).
- Focus state: Border changes to Emerald with no glow.

### Citizen PWA Cards
- High-contrast white text on Cockpit Surface backgrounds.
- Large, bold ETA timers in monospaced font for maximum legibility at a glance.
