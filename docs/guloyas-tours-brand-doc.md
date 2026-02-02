# Guloyas Tours — Brand + UI Theme Guide (v1.0)

**Client:** Guloyas Tours SRL  
**Industry:** Tourism agency (Dominican Republic + international tours)  
**Document date:** 2026-02-01

*Full client details (address, contact, RNC): see [client-info.md](./client-info.md)*

---

## 1) Brand foundation

### Brand idea
A modern travel operator that feels **local and authentic** in DR, but also **capable and organized** for international trips.

### Brand attributes
- **Vibrant** (sunset palette, energy, fun)
- **Trustworthy** (clear info, predictable flows, calm UI structure)
- **Adventurous** (experiences, discovery, motion)
- **Premium-casual** (not luxury-stiff; polished but friendly)

### Audience
- Travelers booking DR excursions (beach, culture, adventure)
- Travelers booking multi-country packages
- Repeat customers + referrals
- B2B partners (hotels, drivers, guides) via dashboard

### Voice & tone
- **Confident + helpful**: “Here’s the plan, here’s what to expect.”
- **Bilingual-ready**: short sentences; avoid slang; consistent terms.
- **Operational clarity**: times, pickup points, inclusions/exclusions, cancellation.

---

## 2) Logo usage

### Primary lockup
Use the full-color logo on light backgrounds when possible.

### Clear space
Minimum clear space around the logo: **1× the height of the “G”** in “Guloyas”.

### Minimum sizes
- **Web header:** 160px width minimum
- **Favicon/app icon:** use the **arch + sunset + palm + plane** mark (no text)

### Background rules
- On **light backgrounds**: use full-color logo.
- On **dark backgrounds**: use a **1-color white** version (recommended export).
- Avoid placing the logo on busy photos unless you add a solid overlay.

### Don’ts
- Don’t stretch, skew, or rotate.
- Don’t change the gradient colors.
- Don’t add drop shadows to the logo (it already has strong contrast).

---

## 3) Color system

### Core brand palette (extracted from logo)
| Name | Hex | Usage |
|---|---|---|
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


### Neutrals (light mode)
| Name | Hex | Usage |
|---|---|---|
| White | `#ffffff` | Primary background in light mode |
| Canvas | `#f7f8fb` | Secondary background / page sections |
| Card | `#ffffff` | Card surfaces |
| Border | `#e6e8f0` | Dividers, table borders (light mode) |
| Ink | `#0b0a1b` | Primary text on light backgrounds |
| Muted Ink | `#2a2950` | Secondary text / labels |


### Neutrals (dark mode)
| Name | Hex | Usage |
|---|---|---|
| Night 900 | `#0b0a19` | App background (dark mode) |
| Night 800 | `#121032` | Elevated background |
| Night 700 | `#19173b` | Surface / sidebar |
| Night 600 | `#272454` | Card surface (dark mode) |
| Border Dark | `#34326a` | Dividers in dark mode |
| Text Dark | `#f3f4ff` | Primary text in dark mode |
| Muted Dark | `#c7c9ff` | Secondary text in dark mode |


### Brand gradients
Use gradients primarily in **hero sections**, **section headers**, and **promo banners** — not as general UI surfaces.

- **Sunset:** `linear-gradient(90deg, #f8cf1c 0%, #f49724 35%, #fa484d 70%, #e31b81 100%)`
- **Nightfall:** `linear-gradient(180deg, #19173b 0%, #272454 60%, #5a58a2 100%)`
- **Skyline:** `linear-gradient(90deg, #5a58a2 0%, #579afd 100%)`

### Color usage rules (so it doesn’t turn into a clown show)
- **One primary CTA color per screen** (Sunset Orange).
- Use **Magenta/Hot Pink** as *accents*, not backgrounds for body text.
- Keep large surfaces **neutral**; let photography + gradients do the “travel” work.
- For text on bright colors (Orange/Gold/Sand), use **Ink**.

---

## 4) Typography

### Recommended fonts
- **Headings:** `Poppins` (600–700)
- **Body/UI:** `Inter` (400–600)
- **Numbers/prices:** `Inter` (600) with tabular numerals enabled if available

### Type scale (web)
- H1: 40–48 / 1.1 (hero only)
- H2: 32 / 1.2
- H3: 24 / 1.25
- H4: 20 / 1.3
- Body: 16 / 1.55
- Small: 14 / 1.45
- Micro: 12 / 1.4

### Copy rules
- Lead with **what**, then **where**, then **when**, then **price**.
- Always show **what’s included** (transport, food, tickets) near the price.
- For international tours, show **time zone** + **meeting points** clearly.

---

## 5) Visual style

### Shapes & radii
- Cards: **12–16px radius**
- Buttons/inputs: **10–12px radius**
- Modals/drawers: **16–20px radius**

### Shadows (light mode)
- Cards: subtle shadow + border (`border + shadow-sm`)
- Dropdowns/modals: stronger shadow (`shadow-lg`)

### Brand motif
Use subtle **horizontal stripe dividers** (low-contrast) to echo the logo.
- Example: 1px lines at 8px spacing, opacity 6–10%.

### Iconography
- Use **outline icons** with consistent stroke (2px).
- Travel set: map-pin, calendar, clock, plane, ticket, suitcase, passport.

### Photography direction
- Bright, warm, real-world DR visuals (beaches, Zona Colonial, mountains)
- People-first shots (guides + guests) — authentic, not stocky
- For international: airport, skyline, landmarks — but keep it minimal

---

## 6) Website theme (marketing)

### Layout
- Max content width: **1200–1280px**
- 12-col grid; 24px gutters on desktop; 16px on mobile
- Hero: gradient header + high-quality photo + clear CTA

### Navigation
- Sticky top nav with **Night Navy** background (or white + navy text)
- Primary CTA: **Book a tour** (Sunset Orange)

### Key pages & sections
- Home: destinations, popular tours, testimonials, FAQ, trust badges
- Tours listing: filters (location, duration, pickup, price), sort, map toggle
- Tour detail: itinerary timeline, inclusions, pickup points, cancellation policy
- Checkout: step-by-step, minimal distractions, clear confirmation

---

## 7) Dashboard theme (operations)

### Default mode
**Light UI** with **Night Navy sidebar/header** (keeps it clean + professional).

### Dashboard layout
- Left sidebar (Night Navy) with icons + labels
- Main surface (Canvas) with white cards
- Tables: sticky header, row hover, strong hierarchy

### Core modules
- Bookings (status, date, pickup, payment)
- Tours (inventory, pricing, availability calendar)
- Customers (profiles, notes, waivers, preferences)
- Vendors/Guides (assignments, payout tracking)
- Messages (WhatsApp/email templates; canned responses)
- Analytics (revenue, conversion, top tours, cancellations)

### States & semantics (UI-only colors)
Keep status colors separate from the brand palette to avoid confusion:
- **Success:** `#16a34a`
- **Warning:** `#f59e0b`
- **Danger:** `#dc2626`
- **Info:** `#2563eb`

---

## 8) Components (design rules)

### Buttons
- Primary: Sunset Orange background, Ink text, 12px radius
- Secondary: transparent + Night Navy border, Night Navy text
- Tertiary: text button, Sky Blue on hover/active

### Forms
- Inputs: 44px height, 12px radius, border color `Border`
- Focus ring: Sky Blue at 30–40% opacity
- Errors: Danger border + small helper text

### Cards
- Title row + subtle divider
- Use icons sparingly; prioritize readable labels + values

### Badges
- Use solid fills for status (success/warn/danger)
- Use outline badges for tags (language, pickup type, group size)

### Tables
- Avoid 12-column monster tables.
- Use “Details” drawer for overflow data.
- Always allow export (CSV) for ops teams.

---


## 9) Data visualization (charts & metrics)

### Chart palette (order for multi-series charts)
Use **consistent series ordering** so reports feel predictable.

1. Sky Blue: `#579afd`
2. Sunset Orange: `#f49724`
3. Magenta: `#e31b81`
4. Violet: `#5a58a2`
5. Coral Red: `#fa484d`
6. Gold: `#f8cf1c` (use sparingly; it dominates)

### Chart rules
- Default to **lines** for time series, **bars** for comparisons.
- Keep gridlines low-contrast (`Border` in light mode, `Border Dark` in dark mode).
- Always show **currency** and **timezone** on dashboards that mix countries.
- Never rely on color alone—add labels/tooltips.


## 10) Accessibility & QA (non-negotiable)
- Minimum text contrast: **4.5:1** for body text
- Don’t put paragraph text on gradients or busy photos
- Keyboard navigation for all interactive elements
- Error messages must say **what happened** and **how to fix it**
- Dates/times: always show timezone when outside DR

---

## 11) Tailwind tokens (starter)

### `tailwind.config.js` (colors excerpt)
```js
// Example: extend your Tailwind theme
export default {
  theme: {
    extend: {
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
      },
    },
  },
}
```

### Optional CSS variables (if you want a token system)
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

## Appendix A — Color scales
### Color scales (Tailwind-friendly)

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| navy | `#edecef` | `#dadae0` | `#b5b5c0` | `#9190a1` | `#5e5d76` | `#19173b` | `#161434` | `#12112c` | `#0f0d22` | `#0b0a19` |

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| sunset | `#fef7ed` | `#fdeedc` | `#fbdeb9` | `#facd96` | `#f7b666` | `#f49724` | `#d78520` | `#b5701b` | `#8e5815` | `#663f0f` |

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| magenta | `#fdedf5` | `#fbdbeb` | `#f6b6d7` | `#f292c3` | `#eb5fa7` | `#e31b81` | `#c81872` | `#a8145f` | `#84104b` | `#5f0b36` |

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| sky | `#f2f7ff` | `#e4efff` | `#c9dffe` | `#aecffe` | `#89b8fe` | `#579afd` | `#4d88df` | `#4072bb` | `#325993` | `#25416a` |


