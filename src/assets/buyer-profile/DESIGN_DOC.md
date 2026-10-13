# 👤 Buyer Profile & Regional Guides UI — Design Document

## Overview
Three new views for the Hunter's Cache buyer experience: My Orders (with tracking), Profile Settings, and a Regional Hunting Guide.

## 1. My Orders View (`MyOrdersView`)
**Entry**: Buyer Profile → My Orders tab

- **4 mock orders** with different statuses: shipped, delivered, processing
- **Filter pills**: All, Processing, Shipped, Delivered
- **Order cards** with: header (order #, date), body (item icon, name, seller, price), tracking status (colored dot + text)
- **FFL pickup banner**: Orange alert for firearm orders showing dealer name, address, transfer instructions
- **Empty state**: Icon + message when no orders

## 2. Profile Settings (`ProfileSettingsView`)
**Entry**: Buyer Profile → Settings tab

- **Profile header**: Avatar circle (JD), name, location, member since
- **Hunting Preferences**: Home Region dropdown, Primary Game dropdown
- **Notifications**: 4 toggle switches (Email, Push, SMS, Weekly Digest) with custom toggle UI
- **Save button**

## 3. Regional Hunting Guide (`RegionalGuideView`)
**Entry**: Homepage navbar → "Hunting Guide" link

- **Hero section**: Image overlay with region name and description
- **Region selector**: 6 pill-shaped buttons for major regions
- **Info panel**: 3 stats (game species count, local hunters, active listings)
- **Season cards**: Grid of game species per region with:
  - Colored icon
  - Game name
  - Season dates (green highlight)
  - Description text
  - Tags (gear types) + "Browse Gear" CTA
- **6 sample regions**: Southeast (4 species), West/Rockies (4), Midwest (3), Northeast (3), Southwest (3), Pacific NW (3)

## Navigation
- Homepage navbar `[Browse] [Sell] [My Profile] [Hunting Guide]`
- Profile page has tab bar: `[My Orders] [Settings] [Hunting Guide]`
- All views maintain the rugged brand identity

## Files
- `src/assets/buyer-profile/DESIGN_DOC.md` — This document
- `src/App.jsx` — 3 new views + BuyerProfileView (tabs)
- `src/index.css` — ~200 new lines of profile/orders/guide CSS
- `public/icons.svg` — 5 new icons (orders, settings, season, bell, compass)
