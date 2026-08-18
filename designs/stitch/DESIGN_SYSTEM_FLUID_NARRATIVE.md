# Design System: Fluid Narrative
## Organic Editorial & Digital Storytelling

---

## 1. Brand Essence & Visual Philosophy
**Fluid Narrative** is a design system built for high-end editorial experiences. It rejects the rigidity of the traditional web in favor of organic fluidity, warmth, and human touch. The aesthetic is inspired by premium boutique studio portfolios and avant-garde editorial showcases (like Readymag and Awwwards winners).

- **Core Principle:** "Digital movement that feels physical."
- **Visual Weight:** Light, airy, but grounded by rich earthy tones.
- **Shape Language:** Exclusively organic. Sharp corners are avoided. Shapes use complex, shifting border-radii to simulate liquid or living organisms.

---

## 2. Color Palette & Roles

- **Primary (Terracotta):** `#C25E4B` — Used for calls to action, active states, and brand-critical highlights.
- **Background (Warm Cream):** `#FDFBF7` — The global canvas. Provides a soft, high-end paper feel.
- **Surface (Sand):** `#F5ECE3` — Used for UI containers, floating navigation, and secondary cards to provide subtle elevation without harsh shadows.
- **Text (Deep Espresso):** `#2C2624` — Primary reading color. High contrast but softer than pure black.
- **Muted (Warm Taupe):** `#8B7E76` — For secondary information, borders, and metadata.
- **Accent (Sage Green):** `#6B8E7B` — A secondary brand color used for hover highlights, success states, and decorative organic blobs.

---

## 3. Typography Rules

- **Headings:** `Fraunces` / `Noto Serif` (Serif).
  - **Styles:** Weight 400 (Regular) with frequent use of Soft Italic for emphasis and "humanity".
  - **Sizing:** Range from `32px` to `120px`. Tight tracking in large displays.
- **Body & UI:** `DM Sans` / `Satoshi` (Sans-Serif).
  - **Styles:** Weight 400 for long-form, 700 for buttons/actions.
  - **Sizing:** `18px` base for body, `1.6` line-height for readability.
- **Metadata/Labels:** `DM Sans` uppercase, `14px`, weight 500, with `0.1em` letter-spacing.

---

## 4. Interaction & Motion Patterns

- **Organic Shapes:** All containers use a "blob" radius: `40% 60% 70% 30% / 40% 50% 60% 50%`.
- **Transitions:** Fluid ease-in-out using `cubic-bezier(0.4, 0, 0.2, 1)`. Duration defaults to `800ms`.
- **Grain Overlay:** A persistent, low-opacity (`0.04`) noise texture across the viewport to simulate physical medium.
- **Magnetic Effects:** Interactive elements (buttons, navigation) exert a "pull" on the mouse cursor within a `24px` radius.

---

## 5. Components

### 5.1 Magnetic Nav Pill
- **Surface:** Sand (`#F5ECE3`) with `12px` backdrop blur.
- **Radius:** `999px` (Pill).
- **Position:** Floating bottom-center.

### 5.2 Project Portal (Archive)
- **Mask:** Shifting SVG organic path.
- **Interaction:** On hover, the mask wiggles and the image scales slightly (`1.05`).

### 5.3 Sticky Editorial (Artifact)
- **Layout:** Left column sticky (`40vw`), Right column scrolling (`60vw`).
- **Logic:** Narrative text cross-fades as new image clusters enter the viewport.
