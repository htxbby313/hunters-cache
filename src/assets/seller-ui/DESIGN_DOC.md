# 🏪 Seller Dashboard & Listing Form — Design Document

## Overview
This document covers the UI/UX design for the **Seller Dashboard** and the multi-step **"Post a Listing"** form for Hunter's Cache. All components follow the established brand identity (forest greens, earthy browns, tan accents, burnt orange CTAs).

## Navigation & Access
- **"Sell" link** in the homepage navbar → navigates to the Seller Dashboard
- **"Sell Yours"** button on listing detail pages → navigates to Seller Dashboard
- **"+ New Listing"** button in dashboard header → opens multi-step listing form
- **Dashboard** link in the seller navbar → back to dashboard

---

## 🎛 Seller Dashboard

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Navbar: Logo | Browse | Dashboard | [+ New Listing]│
├─────────────────────────────────────────────────────┤
│  Header: "Seller Dashboard"        Avatar + Seller   │
│  Subtitle: "Manage your listings"     Badge          │
├──────────┬──────────┬──────────┬────────────────────┤
│ Active   │ Views    │  Sales   │ Revenue            │
│ Listings │  (stat)  │  (stat)  │ (stat)             │
├──────────┴──────────┴──────────┴────────────────────┤
│ Quick Actions: [Post New] [Drafts] [Promote]        │
├─────────────────────────────────────────────────────┤
│ "Your Listings" — Filter: All | Active | Draft...   │
├─────────────────────────────────────────────────────┤
│ Table: Title | Status | Price | Views | Sales | Date│
│ ┌───────────────────────────────────────────────┐   │
│ │ 🦆 Benelli SBE 3          Active  $1,895      │   │
│ │ 🧥 Sitka Delta Waders     Active  $399        │   │
│ │ 🦌 Vortex Razor HD        Active  $1,299      │   │
│ │ 📄 Mathews Phase4 Bow     Draft   $1,099      │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Key Features
- **4 Stats Cards**: Active Listings, Total Views, Items Sold, Revenue (each with trend indicator)
- **Quick Action Buttons**: Post New Listing, View Drafts, Promote Listing
- **Listings Table**: Sortable/filterable by status with action buttons (edit, promote, delete)
- **Status Badges**: Active (green), Draft (gray), Sold (brown), Pending (amber)
- **Responsive**: 4-col grid on desktop → 2-col tablet → 1-col mobile
- **Empty State**: Illustration + call to action when no listings exist

---

## 📝 Multi-Step Listing Form (5 Steps)

### Step Flow
```
[1: Category] → [2: Region] → [3: Condition] → [4: FFL & Details] → [5: Review]
```

### Step 1 — Category & Species
- **Visual**: 4x2 grid of category cards with icons
- Each card shows: icon, category name, species count
- After selecting category, a species dropdown appears
- **Taxonomy**: Uses the Researcher's defined taxonomy (7 categories, 30+ species)

### Step 2 — Region & Terrain Tagging
- **Macro Region** dropdown (6 regions + Alaska)
- **Flyway** dropdown for waterfowl (4 flyways)
- **Terrain Tags**: Chip/button group (Flooded Timber, High Desert, Alpine, etc.)
- Optional: State field + Local pickup preference

### Step 3 — Condition & Pricing
- **Title** input
- **Brand** input with helpful hint showing popular brands
- **Condition**: 5-option horizontal grid (New → Fair)
- **Price**: Dollar-prefixed input field
- **Quantity** selector
- **Description** textarea with hints

### Step 4 — FFL & Details
- **Photo Upload**: Drag-and-drop zone with visual cue
- **Firearm Toggle**: Checkbox reveals red FFL section
- **FFL Section**: Caliber/Gauge, Serial Number (optional), FFL-to-FFL checkbox
- **Notes** textarea

### Step 5 — Review
- **Review Card**: All fields displayed as label-value pairs
- **Terms Agreement**: Checkbox + link
- **Post Listing**: Final action button

### Form UX Details
- **Progress Indicator**: Step circles with connecting lines; active/completed states
- **Validation**: "Continue" button disabled until required fields are filled per step
- **Save Draft**: Available at any step via navbar button
- **Back/Continue**: Navigation buttons at bottom of all steps

---

## 💾 Mock Data

### Seller Stats
| Metric | Value | Trend |
|--------|-------|-------|
| Active Listings | 3 | +12% |
| Total Views | 479 | +12% |
| Items Sold | 2 | +8% |
| Revenue | $574 | +15% |

### Sample Seller Listings
| # | Item | Category | Status | Price |
|---|------|----------|--------|-------|
| 1 | Benelli SBE 3 | Waterfowl | Active | $1,895 |
| 2 | Sitka Delta Waders | Apparel | Active | $399 |
| 3 | Vortex Razor HD 10x42 | Big Game | Active | $1,299 |
| 4 | Mathews Phase4 Bow | Bowhunting | Draft | $1,099 |
| 5 | Avian-X Duck Decoys (6) | Waterfowl | Sold | $175 |
| 6 | Prims Turkey Call Set | Turkey | Pending | $65 |

---

## 🧩 Components Created

### New React Components
| Component | File Location | Purpose |
|-----------|--------------|---------|
| `SellerDashboard` | `src/App.jsx` | Seller portal with stats and listing management |
| `ListingForm` | `src/App.jsx` | 5-step listing creation wizard |
| `StatCard` | `src/App.jsx` (internal) | Reusable stat display card |

### New SVG Icons Added to `public/icons.svg`
| Icon ID | Usage |
|---------|-------|
| `edit-icon` | Edit listing action |
| `delete-icon` | Delete listing action |
| `eye-icon` | View count indicator |
| `draft-icon` | Draft status indicator |
| `trending-icon` | Sales trend/up arrow |
| `dollar-icon` | Revenue display |

### CSS Sections Added to `src/index.css`
| Section | Coverage |
|---------|----------|
| `.seller-dashboard` | Full dashboard layout |
| `.dashboard-stats`, `.stat-card` | Stats grid |
| `.quick-actions`, `.quick-action-btn` | Action buttons |
| `.section-card`, `.section-card-header` | Table container |
| `.listings-table`, `.status-badge` | Listings data table |
| `.table-actions`, `.table-action-btn` | Row action buttons |
| `.listing-form-overlay`, `.form-nav` | Full-screen form layout |
| `.form-body`, `.form-card` | Form content areas |
| `.step-progress`, `.step-circle`, `.step-connector` | Step progress indicator |
| `.category-select-grid`, `.category-option` | Category selection cards |
| `.tag-chips`, `.tag-chip` | Terrain/chip filters |
| `.ffl-section` | Firearm-specific alert section |
| `.condition-options` | Condition selection grid |
| `.upload-area` | Photo upload drag zone |
| `.review-card` | Review summary card |
| `.empty-state` | No-listings state |
| `.form-row`, `.form-group` | Form field layout |
| `.price-input-wrapper` | Dollar-prefixed price input |

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `src/App.jsx` | Added SellerDashboard, ListingForm components; routing via currentView state |
| `src/index.css` | Added ~300 lines of Seller UI CSS |
| `public/icons.svg` | Added 6 new SVG icons (edit, delete, eye, draft, trending, dollar) |

## 📁 Deliverables in `src/assets/seller-ui/`
| File | Description |
|------|-------------|
| `DESIGN_DOC.md` | This document — full design specification |
| `DESIGN_MOCKUP.png` | Visual reference screenshot of the Seller Dashboard and Form |
