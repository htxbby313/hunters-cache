# Hunter's Cache launch checklist

Status checked October 13, 2026 for Browsing-and-Listing Beta. An accessible website does not establish transaction readiness.

## Business details

- Business/brand name: Hunter's Cache
- Short description: Nationwide hunting marketplace for all game, seasons, and U.S. regions. Browsing, listings, seller profiles, and messaging active for closed beta. Paid checkout disabled until payment-provider identity requirements are satisfied.
- Domain: https://hunterscacheusa.com (Production target)
- Active Netlify Host: https://hunters-cache-usa.netlify.app
- Professional email: hq@hunterscacheusa.com (Google Workspace verified intact)

## Verified October 13, 2026 (Browsing-and-Listing Beta)

- **Git Checkpoint Preserved:** Clean Git checkpoint commits `6e91ca7` and `61b7528` created. All uncommitted work, documentation, assets, and Netlify function wrappers preserved with clean working tree.
- **Production Database Fix:** Fixed PostgreSQL schema migration bug in `server.js`. Previously, `image_url`, `guntab_email`, and order tracking columns were skipped on Netlify Postgres (`if (!usingNetlifyDatabase)`), causing a database crash on listing creation. Now updated to support idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` across PostgreSQL and SQLite.
- **Beta Boundaries Audited:**
  - Paid checkout completely disabled on frontend (`src/App.jsx`) and backend (`server.js`).
  - "Buy Now" button replaced with disabled state and honest beta messaging: *"Purchases are not available yet"*.
  - Elevated *"Message Seller"* as the primary interaction button so buyers and sellers can connect directly.
  - Accepted offers update offer status only; they do not create payable orders, reserve inventory, or imply completed payments.
  - Firearm checkout explicitly denied (`firearmCheckoutEnabled: false`).
- **Data Integrity & Honesty:**
  - Removed all hardcoded fake ratings (4.5 and 4.8 stars) and fake "Verified" badges from item cards and detail views. Ratings only render from actual completed orders.
  - Removed fake demo seller stats and mock orders (`|| 479 views`, `|| 2 sales`, `|| $574 revenue`).
  - Empty state added to browse grid when no listings exist for a category.
- **Core Flows Proven (16/16 Automated Tests Passed):**
  1. Seller signup (201 Created)
  2. Buyer signup (201 Created)
  3. Login and JWT issuance (200 OK)
  4. Profile view and updates (200 OK)
  5. Listing creation with public image URL, condition, region, category (201 Created)
  6. Public browse and search with seller name attached (200 OK)
  7. Public seller profile rendering (200 OK)
  8. Unauthorized listing edit rejection (403 Forbidden)
  9. Authorized listing edit (200 OK)
  10. Conversation creation between buyer and seller (201 Created)
  11. Buyer-to-seller messaging (201 Created)
  12. Seller message receipt and reply (200 OK)
  13. Message privacy: snooper unauthorized access rejection (403 Forbidden)
  14. Checkout denial verification: order attempt rejected (503 Service Unavailable)
  15. Unauthorized listing deletion rejection (403 Forbidden)
  16. Authorized listing deletion (200 OK)
- **Photos:** Listing entry retains validated public image URLs for beta. Explicit UI notice clarifies that direct uploads will be introduced with production object storage.
- **Code Quality:** `npm run lint` passes with 0 errors. `npm run build` compiles in <1s with 0 errors.

## Domain & Production Deployment (Squarespace ➔ Netlify) — VERIFIED LIVE

- **Production URL:** `https://hunterscacheusa.com` (HTTP 200)
- **Production Deploy ID:** `6ace46fe2a596e2ca803cc27` (Published October 13, 2026)
- **Live Netlify Host:** `https://hunters-cache-usa.netlify.app`
- **DNS Cutover Completed & Verified:**
  - `hunterscacheusa.com` (Apex): points to Netlify Load Balancer (`75.2.60.5`).
  - `www.hunterscacheusa.com`: CNAME points to `hunters-cache-usa.netlify.app`.
  - Mail MX: `smtp.google.com` (Google Workspace intact and verified).
  - Mail TXT: `v=spf1 include:_spf.google.com ~all` (Google Workspace intact and verified).
- **SSL / HTTPS:** Let's Encrypt certificate issued and active for `hunterscacheusa.com` and `www.hunterscacheusa.com`.
- **Live Production Database Verified:**
  - Real user signup verified (201 Created on Netlify Postgres).
  - Real listing creation with `image_url` verified (201 Created; schema migration bug resolved).
  - Public browse verified with `seller_name` attached.
  - Beta boundaries verified: paid checkout denied with explicit notice.
  - Test listing cleaned up (200 OK).

## Deferred work (Paid marketplace launch)

- Resolve bank identity verification for Coleman (replacement ID / accepted verification).
- Configure GunTab API token, live credentials, and signed webhooks.
- Configure FFL provider (fflapi.com) and verify receiving-license validation.
- Approve legal policies (Terms, Privacy, Prohibited Items, Seller Agreement, Disputes).
- Configure durable photo storage (S3/GCS bucket).
- Validate a real live payment-to-fulfillment transaction.
