# Lea Cosenza Portfolio

Brutalist editorial portfolio for Lea Cosenza — video editor & graphic designer.

## Stack

- **Vite** + **React 18** (ES modules, no Babel CDN)
- Vanilla CSS (no frameworks) — all in `src/styles.css`
- Google Fonts: Archivo · JetBrains Mono · Instrument Serif

## Dev

```bash
npm install
npm run dev      # localhost:5173
npm run build    # dist/
npm run preview  # preview the build
```

## Structure

```
src/
├── main.jsx               # React root
├── App.jsx                # Root component, state, tweaks
├── data.js                # PROJECTS data + localStorage helpers
├── styles.css             # All CSS (design system, components)
└── components/
    ├── Portfolio.jsx      # Topbar, Hero, Featured, Index, About, Footer
    ├── CaseStudy.jsx      # Full-screen case study modal + inline editor
    ├── Cursor.jsx         # Custom cursor + easter eggs
    ├── Placeholder.jsx    # Striped placeholder tile (used until real assets)
    └── TweaksPanel.jsx    # Tweaks panel (mode/accent/cursor/easter eggs)
```

## Key features

- **Hero**: "Lea / Co·senza." typographic layout with animated ticker cycling through current work
- **Featured spotlight**: Troubadour multi-medium project in a 6-column masonry grid
- **Index**: numbered project list with hover-scrub thumbnails, frame scrub based on cursor X position
- **Case study modal**: full-screen slide-up with inline editor (Shopify-style contentEditable fields)
  - Edit mode: click "Edit ✎" → dashed outlines on all text, color swatches on placeholders
  - Section add/remove/reorder: Films / Identity / Posters / Merch / Print / Text / Image / Video
  - Save persists to `localStorage` under key `lc:projects`
- **Custom cursor**: dot → circle (link) → "Play ▶" pill (over project areas)
- **Easter eggs**: `P` = film cut flash, `R-E-E-L` = reel takeover, ↑↑↓↓◀▶◀▶BA = Konami reveal
- **Tweaks panel**: mode (paper/dark), density, accent color, cursor mode, easter egg toggle

## Adding real assets

Replace `<Placeholder>` components with `<video>` or `<img>` elements. The swap point is wherever `Placeholder` is rendered inside `CaseStudy.jsx` (hero plate, frames mosaic, section items) and `Portfolio.jsx` (featured grid, scrub thumbnail).

## Design tokens

```css
--paper: #ece7dd   /* off-white background */
--ink: #161412     /* near-black text */
--accent: #ff3b1f  /* signal red (tweakable) */
```
