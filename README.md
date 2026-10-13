# Hunter's Cache

Nationwide hunting marketplace for all game, seasons, and U.S. regions. The closed-beta application includes seller profiles and buyer-only reviews, listings, evidence-based market-price offers, buyer–seller messaging, GunTab protected checkout, shipment tracking, disputes, moderation queues, verification records, policies, audit events, and seller/operations analytics.

Production domain: `https://hunterscacheusa.com`. The current website DNS points to Squarespace; Google mail records must be preserved when the application host is connected.

## Local development

```powershell
npm install
npm run dev
```

The Vite client runs on port 5173. The Express server serves `dist` on port 3000. Production uses Neon PostgreSQL through `DATABASE_URL`; local development uses SQLite at `data/hunters-cache.db` when that variable is absent.

```powershell
npm run build
$env:JWT_SECRET = "replace-with-a-long-random-secret"
npm run server
```

Copy `.env.example` to `.env` and supply secrets through the hosting platform rather than committing them. Never use the development JWT fallback in production.

## GunTab checkout

1. Create the Hunter's Cache GunTab account and verify its email and business bank account.
2. Create a **test** API key and set `GUNTAB_API_TOKEN` while testing.
3. Each seller creates their own GunTab account, verifies it, and saves that exact email in Seller Dashboard.
4. Run an end-to-end test: listing → order → GunTab checkout → order sync.
5. Only after approval, replace the test key with a live key and set the final HTTPS `PUBLIC_APP_URL`.
6. Configure the signed webhook URL as `https://YOUR-DOMAIN/api/webhooks/guntab`, save its `ssk_...` signing secret as `GUNTAB_WEBHOOK_SECRET`, and test every important transaction status from GunTab.

Hunter's Cache charges sellers 0% on their first completed sale, then 5% capped at $250. GunTab's own service/payment fees are separate and are shown by GunTab during checkout.

## Closed-beta limits

- Firearm checkout remains off until `FFL_API_KEY` is configured and `ENABLE_FIREARM_CHECKOUT=true`.
- Listing photos currently use public image URLs; production file uploads require durable object storage.
- Carrier-label purchasing, automated content classification, tax registrations, provider contracts, and legal-policy approval still need to be completed before a public launch.
- The app cannot be called live merely because it builds; verify the deployed domain, GunTab live key, database persistence, and a real end-to-end transaction first.

See `OPERATIONS.md` for transaction, verification, dispute, moderation, privacy, daily-operations, and launch-gate policies.

See [../PROFITABILITY_PLAN.md](../PROFITABILITY_PLAN.md) for the recommended launch wedge, unit-economics targets, and 90-day operating plan.
