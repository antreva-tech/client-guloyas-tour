# Guloyas Tours — Color Brand

Color system for **Guloyas Tours** (tourism agency, Dominican Republic + international). Extracted from logo and aligned with [guloyas-tours-brand-doc.md](./guloyas-tours-brand-doc.md).

---

## 1) Brand pillars (color)

- **Vibrant:** sunset palette, energy, fun
- **Trustworthy:** clear info, calm UI, neutral surfaces
- **Adventurous:** gradients + photography do the “travel” work
- **Premium-casual:** one primary CTA (Sunset Orange); accents used sparingly

---

## 2) Core brand palette

| Name | Hex | Usage |
|------|-----|--------|
| Night Navy | `#19173b` | Primary brand base; headers/footers, dashboard chrome, text on bright accents |
| Sunset Orange | `#f49724` | Primary CTA; highlights, links, key actions |
| Golden Sun | `#f8cf1c` | Secondary highlight; badges, ratings, emphasis (use sparingly) |
| Coral Red | `#fa484d` | Energy + urgency; promotions, limited-time banners |
| Magenta | `#e31b81` | Brand flair; secondary CTA, accents, gradients |
| Hot Pink | `#f22860` | Accent for playful moments; illustrations, micro-highlights |
| Sky Blue | `#579afd` | Trust + global travel; info states, links in dashboard |
| Violet | `#5a58a2` | Depth; dark-mode surfaces, charts secondary |
| Sand | `#feeb9b` | Warm neutral; backgrounds, section dividers, subtle cards |
| Plum | `#64204b` | Deep accent; overlays, small details (keep minimal) |

---

## 3) Neutrals (light mode)

| Name | Hex | Usage |
|------|-----|--------|
| White | `#ffffff` | Primary background in light mode |
| Canvas | `#f7f8fb` | Secondary background / page sections |
| Card | `#ffffff` | Card surfaces |
| Border | `#e6e8f0` | Dividers, table borders (light mode) |
| Ink | `#0b0a1b` | Primary text on light backgrounds |
| Muted Ink | `#2a2950` | Secondary text / labels |

---

## 4) Neutrals (dark mode)

| Name | Hex | Usage |
|------|-----|--------|
| Night 900 | `#0b0a19` | App background (dark mode) |
| Night 800 | `#121032` | Elevated background |
| Night 700 | `#19173b` | Surface / sidebar |
| Night 600 | `#272454` | Card surface (dark mode) |
| Border Dark | `#34326a` | Dividers in dark mode |
| Text Dark | `#f3f4ff` | Primary text in dark mode |
| Muted Dark | `#c7c9ff` | Secondary text in dark mode |

---

## 5) Brand gradients

Use in **hero sections**, **section headers**, and **promo banners** — not as general UI surfaces.

- **Sunset:** `linear-gradient(90deg, #f8cf1c 0%, #f49724 35%, #fa484d 70%, #e31b81 100%)`
- **Nightfall:** `linear-gradient(180deg, #19173b 0%, #272454 60%, #5a58a2 100%)`
- **Skyline:** `linear-gradient(90deg, #5a58a2 0%, #579afd 100%)`

---

## 6) Semantic / UI-only (status)

Keep separate from brand palette:

| Name | Hex | Usage |
|------|-----|--------|
| Success | `#16a34a` | Confirmations, in-stock, positive states |
| Warning | `#f59e0b` | Warnings, pending |
| Danger | `#dc2626` | Errors, destructive actions |
| Info | `#2563eb` | Informational states |

---

## 7) Usage rules

1. **One primary CTA per screen** — Sunset Orange.
2. **Magenta/Hot Pink** — accents only, not backgrounds for body text.
3. **Large surfaces** — keep neutral; let photography + gradients carry “travel.”
4. **Text on bright colors** (Orange/Gold/Sand) — use **Ink** (`#0b0a1b`).

---

## 8) Buttons & links

- **Primary:** Sunset Orange background, Ink text, 12px radius
- **Secondary:** transparent + Night Navy border, Night Navy text
- **Tertiary:** text button, Sky Blue on hover/active
- **Focus ring:** Sky Blue at 30–40% opacity

---

## 9) Tailwind tokens (excerpt)

```js
// tailwind.config.js — extend theme
colors: {
  brand: {
    navy: '#19173b',
    sunset: '#f49724',
    gold: '#f8cf1c',
    coral: '#fa484d',
    magenta: '#e31b81',
    sky: '#579afd',
    violet: '#5a58a2',
    sand: '#feeb9b',
    ink: '#0b0a1b',
    canvas: '#f7f8fb',
    border: '#e6e8f0',
  },
}
```

---

## 10) CSS variables

```css
:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --text: #0b0a1b;
  --muted: #2a2950;
  --primary: #f49724;
  --primaryText: #0b0a1b;
  --accent: #e31b81;
  --info: #579afd;
  --border: #e6e8f0;
}

[data-theme="dark"] {
  --bg: #0b0a19;
  --surface: #272454;
  --text: #f3f4ff;
  --muted: #c7c9ff;
  --primary: #f49724;
  --primaryText: #0b0a1b;
  --accent: #e31b81;
  --info: #579afd;
  --border: #34326a;
}
```

---

## Appendix — Color scales (Tailwind-friendly)

**Navy:** 50 `#edecef` → 500 `#19173b` → 900 `#0b0a19`  
**Sunset:** 50 `#fef7ed` → 500 `#f49724` → 900 `#663f0f`  
**Magenta:** 50 `#fdedf5` → 500 `#e31b81` → 900 `#5f0b36`  
**Sky:** 50 `#f2f7ff` → 500 `#579afd` → 900 `#25416a`  

Full scales: see [guloyas-tours-brand-doc.md](./guloyas-tours-brand-doc.md) Appendix A.
