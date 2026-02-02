# Guloyas Tours — Web Design & Configuration

Configuration and layout guide for the Guloyas Tours site (public catalog + admin dashboard). Full brand and UI details: [guloyas-tours-brand-doc.md](./guloyas-tours-brand-doc.md). Colors: [color-brand.md](./color-brand.md). Database semantics (tours, bookings, plazas): [database-semantics.md](./database-semantics.md).

---

## Overview

- **Client:** Guloyas Tours SRL — tourism agency (Dominican Republic + international).
- **Public:** Marketing site + tour catalog + checkout.
- **Admin:** Operations dashboard (bookings, tours, customers, vendors, analytics).

---

## Brand configuration (`.env`)

Set in `.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_BRAND_NAME | Brand name (e.g. "Guloyas Tours") |
| NEXT_PUBLIC_BRAND_TAGLINE | Tagline (e.g. tour-focused line) |
| NEXT_PUBLIC_SITE_URL | Production URL (e.g. https://guloyastours.com) |
| NEXT_PUBLIC_LOGO_PATH | Logo path (e.g. /logo.png) |
| NEXT_PUBLIC_WHATSAPP_NUMBER | WhatsApp number for bookings |
| NEXT_PUBLIC_WHATSAPP_MESSAGE | Pre-filled WhatsApp message |
| NEXT_PUBLIC_CONTACT_EMAIL | Primary contact email |
| NEXT_PUBLIC_CONTACT_EMAIL_2 | Secondary email (optional) |
| NEXT_PUBLIC_ADDRESS_STREET | Street address |
| NEXT_PUBLIC_ADDRESS_CITY | City |
| NEXT_PUBLIC_ADDRESS_COUNTRY | Country |
| NEXT_PUBLIC_INSTAGRAM_HANDLE | Instagram handle (e.g. @guloyastours) |
| NEXT_PUBLIC_INSTAGRAM_URL | Full Instagram URL |
| NEXT_PUBLIC_FOUNDED_YEAR | Year founded (optional, "Since YYYY") |

---

## Layout (marketing)

- **Max content width:** 1200–1280px
- **Grid:** 12 columns; 24px gutters desktop, 16px mobile
- **Hero:** Gradient header + high-quality photo + clear CTA (**Book a tour** in Sunset Orange)
- **Nav:** Sticky top; **Night Navy** background (or white + navy text); primary CTA **Book a tour**

---

## Key pages & sections

- **Home:** Destinations, popular tours, testimonials, FAQ, trust badges
- **Tours listing:** Filters (location, duration, pickup, price), sort, map toggle
- **Tour detail:** Itinerary timeline, inclusions, pickup points, cancellation policy
- **Checkout:** Step-by-step, minimal distractions, clear confirmation

---

## Dashboard (operations)

- **Default:** Light UI with **Night Navy** sidebar/header
- **Layout:** Left sidebar (Night Navy), main surface (Canvas), white cards
- **Tables:** Sticky header, row hover, strong hierarchy; use “Details” drawer for overflow; allow CSV export
- **Modules:** Bookings, Tours, Customers, Vendors/Guides, Messages, Analytics

---

## Typography & visuals

- **Headings:** Poppins (600–700)
- **Body/UI:** Inter (400–600)
- **Radii:** Cards 12–16px; buttons/inputs 10–12px; modals 16–20px
- **Shadows:** Cards subtle + border; dropdowns/modals `shadow-lg`
- **Icons:** Outline, 2px stroke; travel set: map-pin, calendar, clock, plane, ticket, suitcase, passport

---

## Assets

- Replace `public/logo.png` with Guloyas Tours logo (see brand doc for clear space and background rules)
- Optionally replace PWA icons (`web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`)
- **Favicon/app icon:** Use the **arch + sunset + palm + plane** mark (no text)

---

## Location data

Dominican Republic province/municipality data lives in `lib/locationData.ts`. Keep for DR-focused content; replace only if targeting another region.
