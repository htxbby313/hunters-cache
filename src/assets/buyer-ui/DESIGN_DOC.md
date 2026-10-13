# 🛒 Checkout Flow & FFL Selection UI — Design Document

## Overview
This document covers the UI/UX design for the **Checkout Flow** on Hunter's Cache, including FFL (Federal Firearms License) dealer selection for firearm purchases. All components follow the established rugged, earthy brand identity.

## Navigation & Flow
```
Detail View → "Buy Now" → Checkout Flow (3-step + Confirmation)
```

### Entry Points
- **"Buy Now" button** on listing detail page → navigates to checkout
- **Navigation context**: Product info passed as item prop; checkout knows if item is firearm via `item.is_firearm`

---

## 🛒 Checkout Flow (3-Step + Confirmation)

### Step Flow
```
[1: Shipping/FFL] → [2: Payment] → [3: Review] → [✅ Confirmation]
```

### Layout
```
┌────────────────────────────────────────────────────────┐
│  Checkout Nav: Logo | "Checkout"    🔒 Secure Checkout  │
├────────────────────────────────────────────────────────┤
│  [• Shipping] ── [○ Payment] ── [○ Order Review]        │
├──────────────────────────────┬─────────────────────────┤
│                              │                         │
│  STEP CONTENT HERE           │  ORDER SUMMARY          │
│                              │  ┌─────────────────┐    │
│  (Shipping/FFL, Payment,     │  │ 🦆 Item Title    │    │
│   or Review)                 │  │   Category       │    │
│                              │  │   $Price         │    │
│                              │  ├─────────────────┤    │
│                              │  │ Subtotal: $X    │    │
│                              │  │ Shipping: $12.99│    │
│                              │  │ FFL Fee: $35    │    │
│                              │  │ Total: $X.XX    │    │
│                              │  └─────────────────┘    │
│                              │   🔒 Encrypted          │
├──────────────────────────────┴─────────────────────────┤
│  [← Cancel/Back]                    [Continue →]        │
└────────────────────────────────────────────────────────┘
```

---

## 📋 Step Details

### Step 1: Shipping / FFL Dealer Selection

**For non-firearm items (standard shipping):**
- Address form: Full Name, Street, City, State (dropdown), ZIP
- 2-column grid layout

**For firearm items (FFL transfer):**
- **Red info banner**: "⚠️ Firearm — FFL Transfer Required" with warning styling
- **ZIP search box**: Enter ZIP code → mock search returns nearby FFL dealers
- **FFL Dealer List**: Scrollable list of dealer cards showing:
  - Map pin icon + store name
  - Address + license info + rating
  - Distance badge
  - Radio button selection indicator
- **Mock data**: 5 FFL dealers in Arkansas (Stuttgart/DeWitt area)

### Step 2: Payment (Pinwheel-Inspired Design)
- **Visual card display**: Green-tinted credit card mockup showing:
  - Cardholder name (live preview)
  - Card number with formatting
  - Expiry + CVV display
- **Form fields**: Card Number (auto-formats), Cardholder Name, Expiry (MM/YY), CVV
- **Security**: Lock icon badge, encrypted payment messaging

### Step 3: Order Review
- Shipping/FFL destination summary
- Payment method (last 4 digits)
- Terms & Privacy Policy agreement checkbox
- **"Place Order" button** with total price and lock icon

### Confirmation Page
- Green checkmark circle animation
- Order number (random HC-XXXXX)
- Item title + shipping destination
- Total charged + estimated delivery
- "Back to Browse" button

---

## 💳 Pinwheel Style Adaptation
Pinwheel is known for clean, modern financial interfaces. We adapted their:
- **Card-first preview**: Live-updating credit card display above form fields
- **Clean typography**: Monospace card number with letter-spacing
- **Subtle decorative elements**: Radial gradient overlay on card
- **Security badges**: Prominent lock icon + encrypted messaging
- **Color adaptation**: Our forest green (#1a3c1a) replaces typical blue/purple
- **Minimal form design**: Spacious, well-spaced input fields

---

## 🔫 FFL Workflow (from Researcher's Findings)
1. **Listing**: Seller marks item as firearm during listing
2. **Checkout**: Buyer clicks "Buy Now" → checkout detects `is_firearm`
3. **Selection**: ZIP code search → system displays nearby FFL dealers (via FFLGuns API or mock data)
4. **Confirmation**: Buyer selects FFL → order placed → seller notified to ship to chosen FFL address

---

## 🧩 Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| `CheckoutView` | `src/App.jsx` | Full checkout flow with 3 steps + confirmation |
| `StaticCard` (payment) | Inline in CheckoutView | Pinwheel-inspired live card preview |

### New SVG Icons Added to `public/icons.svg`
| Icon ID | Usage |
|---------|-------|
| `shipping-icon` | Shipping address section |
| `payment-icon` | Payment method section, card icon |
| `mappin-icon` | FFL dealer location pins |
| `lock-icon` | Security badges throughout checkout |
| `checkcircle-icon` | Order confirmation success |
| `person-icon` | Buyer identification |

---

## 📦 Mock Data

### FFL Dealers (Arkansas)
| Dealer | City | Distance | Rating |
|--------|------|----------|--------|
| Buck's Sporting Goods | Stuttgart, AR | 2.3 mi | 4.8★ |
| Delta Arms & Ammo | DeWitt, AR | 8.1 mi | 4.5★ |
| Wildfowler Outfitters | England, AR | 5.8 mi | 4.9★ |
| Bayou Pawn & Gun | Pine Bluff, AR | 14.7 mi | 4.2★ |
| Lonoke Gun & Gear | Lonoke, AR | 11.2 mi | 4.3★ |

### Order Pricing Estimates
| Item | Non-Firearm Total | Firearm Total |
|------|------------------|---------------|
| $1,895 (Benelli) | $1,907.99 | $1,942.99 |
| $399 (Waders) | $411.99 | — |
| $1,299 (Scope) | $1,311.99 | — |

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `src/App.jsx` | Added `CheckoutView` component with 3-step flow; routing via `navigate('checkout', item)` |
| `src/index.css` | Added ~200 lines of checkout CSS |
| `public/icons.svg` | Added 6 new SVG icons (shipping, payment, mappin, lock, checkcircle, person) |
|
