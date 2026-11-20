# Hunter's Cache

A nationwide hunting gear resale marketplace built for hunters across game, season, and region. The product brings marketplace workflows, practical operations tooling, and trust controls together in one web application.

[Visit the live site](https://hunterscacheusa.com/) · [View the source repository](https://github.com/htxbby313/hunters-cache)

## Product highlights

- Browse and search gear across hunting categories, seasons, and U.S. regions.
- Create listings and seller profiles, then connect through buyer–seller messaging.
- Keep reviews tied to verified completed orders; show honest empty states when there is no marketplace activity.
- Provide operations tools for moderation, disputes, verification records, and audit events.
- Keep paid and firearm checkout gated until payment, compliance, and fulfillment providers are ready.

## Technology

- **Frontend:** React 19, Vite, JavaScript, CSS
- **Application API:** Node.js, Express, serverless-http
- **Data:** PostgreSQL in production, SQLite for local development
- **Hosting:** Netlify Functions and static hosting
- **Other:** JWT authentication, bcrypt password hashing, FFL lookup proxy

## Architecture

The React client is built into `dist/`. Express routes are adapted to Netlify Functions for production, with `netlify.toml` routing `/api/*` requests to the API function. The same Express server can serve the built client during local or container deployments. PostgreSQL is selected when `DATABASE_URL` is configured; local development can use SQLite.

The FFL validation endpoint is implemented as a server-side provider proxy. It requires the provider key in the hosting environment. Firearm checkout remains disabled until provider, payment, policy, and end-to-end transaction gates are satisfied.

## Run locally

Requirements: Node.js 22 or later and npm.

```powershell
npm install
npm run dev
```

To build the production frontend:

```powershell
npm run build
```

For the Express server, copy `.env.example` to `.env`, set local values, then run:

```powershell
npm run server
```

Never commit `.env` files or production credentials. Use the documented placeholders in `.env.example` and configure real secrets in the hosting environment.

## Project status

Hunter's Cache is in a browsing-and-listing beta. A public website and successful deployment do not mean checkout or regulated transactions are ready. Payment processing, FFL provider access, durable image storage, policy review, backups, monitoring, and a real end-to-end transaction remain separate launch gates. See [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md) and [`OPERATIONS.md`](OPERATIONS.md) for project status and operating boundaries.
