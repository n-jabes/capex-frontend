# Capex Frontend

Next.js application for Axian Telecom Capacity and Pricing—public landing, authentication, Capex tree editor, dashboard, and settings.

## Stack

- Next.js (App Router) + React  
- Tailwind CSS + shadcn/ui  
- Cookie-based API session against the Nest backend (same-origin proxy)

## Environment

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes (API mode) | Use `same-origin` so the browser calls `/api` on this host |
| `BACKEND_URL` | Yes (API mode) | Nest origin used by `next.config` rewrites (e.g. Railway URL) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Optional client error reporting hook |

Production **must** use `same-origin` + `BACKEND_URL`. Direct browser calls to Railway leave auth cookies on the API host, so Next middleware never sees `capex_auth`.

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
| `/settings` | Catalogs and relationships |

Session cookies (`access_token`, `refresh_token`, `capex_auth`) are set by Nest through the Next rewrite so they are first-party on the Vercel/localhost host.
