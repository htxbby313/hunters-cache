# 🎯 Hunter's Cache — Brand Style Guide

## Overview
A specialized, community-driven marketplace for hunters that organizes gear by **game hunted** and **geographical region**. The brand identity reflects rugged professionalism, trust, and respect for the outdoors.

---

## 🎨 Color Palette

### Primary Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Forest Dark | `#0f1f0f` | Page background |
| Forest | `#1a3c1a` | Section backgrounds, overlays |
| Pine | `#2d5a27` | Navbar, active states, borders |

### Earth & Accent Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Earth | `#5d4037` | Cards, secondary elements |
| Tan | `#c4a87c` | Highlights, badges, decorative elements |
| Cream | `#f5f0e8` | Primary text on dark backgrounds |
| Burnt Orange | `#c85a17` | Call-to-action buttons, pricing |
| Highlight Green | `#8bc34a` | Price highlights, accents |

### Neutral Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Slate | `#1a1a2e` | Footer, overlays |
| Charcoal | `#263238` | Card backgrounds |
| Stone | `#37474f` | Card details, dividers |
| Smoke | `#78909c` | Secondary text |
| Frost | `#b0bec5` | Body text |

---

## 🔤 Typography

| Usage | Font | Weight |
|-------|------|--------|
| Headings | **Playfair Display** | 700 Bold, 800 Extra Bold |
| Body | **Inter** | 400 Regular, 500 Medium, 600 Semi-Bold |
| Mono (optional) | JetBrains Mono | For technical specs |

**Heading Scale:**
- H1: 3.2rem (51px)
- H2: 2.5rem (40px)
- H3: 1.5rem (24px)
- H4: 1.25rem (20px)

---

## 🖼 Logo & Iconography

### Logo Mark
- Shield shape with stylized compass/pine-tree motif
- Colors: Pine Green (`#2d5a27`) shield, Tan (`#c4a87c`) inner mark
- Always use the SVG favicon or PNG logo-icon

### Icon Set (all inline SVG via `/icons.svg`)
- **Waterfowl** — duck in flight silhouette
- **Big Game** — antlers silhouette
- **Turkey** — turkey silhouette
- **Fishing** — fish/hook style
- **Optics** — binoculars/scope
- **Apparel** — jacket silhouette
- **Firearms** — rifle silhouette
- **Region** — map pin

---

## 🧩 UI Components

### Buttons
| Type | Style |
|------|-------|
| Primary | Burnt Orange bg, white text, uppercase |
| Secondary | Transparent with tan border |
| Outline | Transparent with subtle border |

### Cards
- Dark gradient background (charcoal to forest)
- Rounded corners (12px)
- Earthy brown border
- Left-aligned content
- Price in Highlight Green

### Category Chips
- Pill-shaped (full rounded)
- Stone background with icon + label
- Active state: Pine green bg with green glow

---

## ✨ Brand Voice

> **"Gear for the Hunt You Chase"**

- **Authentic** — we speak to real hunters, not armchair enthusiasts
- **Regional** — every market touchpoint references geography and terrain
- **Trustworthy** — safety, verification, and community-first language
- **Rugged** — earthy, modern, never flashy or corporate

---

## 🖥 Application Views

### 1. Homepage (`HomeView`)
- Full-bleed hero image with overlay gradient
- Search bar with call-to-action buttons
- Sticky category filter bar (scrollable)
- Featured listings grid (responsive)
- Stats section ("Why Hunter's Cache")
- Footer with links and branding

### 2. Listing Detail (`DetailView`)
- Product gallery area (left)
- Product info panel (right): title, price, rating, description
- Condition/region/seller detail grid
- "Buy Now" and "Make Offer" buttons

---

## 📐 Spacing System
- Base unit: 4px
- Common: 8px, 16px, 24px, 32px, 48px, 64px
- Section padding: 64px+ for major sections

---

## 📁 Asset File Locations
All assets are in `/src/assets/`:
- `hero-banner.png` — Misty forest hero background (1536x1024)
- `logo-icon.png` — Brand logo mark (1024x1024)

Public files in `/public/`:
- `favicon.svg` — Custom shield logo favicon
- `icons.svg` — SVG sprite with all category icons
