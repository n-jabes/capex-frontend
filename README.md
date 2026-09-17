# Capex Frontend

Next.js application for Axian Telecom Capacity and Pricing—public landing, authentication, Capex tree editor, dashboard, and settings.

## Stack

- Next.js (App Router) + React  
- Tailwind CSS + shadcn/ui  
- Cookie-based API session against the Nest backend (cross-origin interim, or same-origin proxy later)

## Environment

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes (API mode) | Absolute Nest URL (interim) **or** `same-origin` (custom domain / proxy later) |
| `BACKEND_URL` | Only for same-origin | Nest origin used by `next.config` rewrites |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Optional client error reporting hook |

**Interim (no custom domain):** set `NEXT_PUBLIC_API_URL` to the Railway API origin. Nest must allow the Vercel origin in `CORS_ORIGIN` and use `COOKIE_SAMESITE=none`. Route guards run in the client (`AuthSessionGate`) because Vercel middleware cannot read Railway cookies.

**Later (custom domain):** switch to `NEXT_PUBLIC_API_URL=same-origin` + `BACKEND_URL` so cookies are first-party and middleware can enforce them.

Without `NEXT_PUBLIC_API_URL`, the workspace falls back to browser `localStorage` (local demo only).

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Run the Nest API on `BACKEND_URL` (default `http://localhost:3001`).

## Main routes

| Route | Description |
| --- | --- |
| `/` | Marketing landing |
| `/login`, `/register` | Authentication |
| `/dashboard` | Portfolio overview |
| `/capex-tree` | Capex hierarchy editor |
| `/benchmarking` | Price compare across countries, deliveries, packages, etc. |
| `/benchmarking/traffic` | Input Current Traffic (coming soon) |
| `/settings` | Catalogs and relationships |

Session cookies (`access_token`, `refresh_token`, `capex_auth`) are set by Nest. In interim cross-origin mode they belong to the API host; with same-origin proxy they belong to the Next host.
