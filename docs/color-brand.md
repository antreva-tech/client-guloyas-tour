# Color Brand — Retail Template Color System

This color system is built around **Jet Black + Porcelain White + Aqua Shine** (your provided colors), with **luxury neutrals** for depth and **champagne gold** for premium cues. Aqua is treated as a controlled highlight (not a dominant fill) to keep the page feeling high-end.

---

## 1) Brand Pillars

- **Luxury base:** dark, rich, minimal.
- **Clean clarity:** whites and pearls for ingredient/education sections.
- **Signature freshness:** aqua used sparingly for “shine / hydration / clean” cues.
- **Premium cue:** champagne/soft gold used for micro-accents (badges, stars, hairline rules).

---

## 2) Primary Brand Colors (Core)

### Jet
- **Hex:** `#000000`
- **Use:** premium anchors, typography on light, logo marks, deep contrast elements
- **Don’t:** use for large backgrounds (use Onyx instead to reduce harshness)

### Porcelain
- **Hex:** `#FEFEFE`
- **Use:** clean background areas, text on dark, negative space
- **Don’t:** use pure white everywhere; mix with Pearl for softer luxury

### Aqua Shine
- **Hex:** `#08D5FA`
- **Use:** primary CTA, focus states, small highlights, shimmer/glow accents
- **Don’t:** use for paragraph text on white (too bright and low comfort)

---

## 3) Luxury Neutrals (Depth System)

### Onyx (Preferred dark background)
- **Hex:** `#0B0F14`
- **Use:** main page background, hero sections, nav background

### Graphite (Surface / cards on dark)
- **Hex:** `#141A22`
- **Use:** product cards, modals, panels, pricing blocks on dark

### Smoke (Dividers / borders on dark)
- **Hex:** `#2A3441`
- **Use:** 1px lines, subtle separators, input borders on dark

### Pearl (Soft light background)
- **Hex:** `#F6F3EE`
- **Use:** ingredient/story sections, testimonials, editorial blocks

---

## 4) Metallic Accents (Luxury Cue)

### Champagne Gold
- **Hex:** `#D8C3A5`
- **Use:** subtle highlight text, section labels, soft premium tinting

### Soft Gold
- **Hex:** `#C8A96A`
- **Use:** icons, stars, “Best Seller” accents, hairline rules, secondary button borders
- **Rule:** keep gold usage under ~10% of visual weight per section

---

## 5) Aqua Control Colors (Refined Usage)

### Aqua Deep (Links / text on light)
- **Hex:** `#007C92`
- **Use:** links on Pearl/White, small UI text accents, refined aqua typography

### Aqua Fog (Tint background)
- **Hex:** `#D6F8FF`
- **Use:** highlight strips, feature callouts, “hydration” or “shine” callouts

---

## 6) Semantic Colors (Optional)

### Success
- **Hex:** `#1F8A70`
- **Use:** “in stock”, “free shipping”, confirmation states

### Danger
- **Hex:** `#B42318`
- **Use:** errors, destructive actions (rare on product pages)

---

## 7) UI Tokens (Role-Based)

### Backgrounds
- **Page (default):** `#0B0F14`
- **Section alt (light):** `#F6F3EE`
- **Card surface (dark):** `#141A22`

### Text
- **Text on dark (primary):** `#FEFEFE`
- **Text on light (primary):** `#000000`
- **Muted text on dark:** use `#D8C3A5` (warm luxury) or reduce opacity of `#FEFEFE` (e.g., 70%)

### Borders & Dividers
- **On dark:** `#2A3441`
- **On light:** `#D8C3A5` (thin premium line)

### Focus / Rings
- **Focus ring:** `#08D5FA`

---

## 8) Buttons & Links

### Primary Button (High conversion, still luxe)
- **Background:** `#08D5FA`
- **Text:** `#000000`
- **Hover (suggested):** slightly darken aqua (keep within the same family)
- **Shadow:** aqua glow at low opacity (10–20%), not a heavy neon

### Secondary Button (Luxury)
- **Background:** transparent
- **Border:** `#C8A96A`
- **Text:** `#FEFEFE`
- **Hover:** subtle fill using `#141A22` or a faint gold tint

### Links
- **On light backgrounds:** `#007C92`
- **On dark backgrounds:** `#08D5FA` (only for short link labels, not paragraphs)

---

## 9) Gradients (Use Sparingly)

### Luxury Dark Gradient (Hero / header)
- `#0B0F14 → #141A22`

### Aqua Highlight Glow (very subtle)
- `#08D5FA` at low opacity over `#0B0F14` (used as glow, not a big fill)

### Gold Hairline Accent
- `#C8A96A` for 1px rules or minimal icon highlights

---

## 10) Usage Rules (Non-Negotiable)

1. **Aqua is an accent, not a base.** Use it for CTA + focus + small highlights.
2. **Gold is micro-accent only.** If it starts to look “Vegas”, you overused it.
3. **Prefer Onyx over pure black** for large areas to avoid harsh contrast.
4. **Use Pearl for light sections** to soften the page and feel “cosmetic editorial.”

---

## 11) CSS Variables (Copy/Paste)

```css
:root {
  /* core */
  --jet: #000000;
  --porcelain: #FEFEFE;
  --aqua-shine: #08D5FA;

  /* luxury neutrals */
  --onyx: #0B0F14;
  --graphite: #141A22;
  --smoke: #2A3441;
  --pearl: #F6F3EE;

  /* metallic accents */
  --champagne-gold: #D8C3A5;
  --soft-gold: #C8A96A;

  /* aqua control */
  --aqua-deep: #007C92;
  --aqua-fog: #D6F8FF;

  /* semantic (optional) */
  --success: #1F8A70;
  --danger: #B42318;
}
