# Capex Frontend

Next.js application for Axian Telecom Capacity and Pricing—public landing, authentication, Capex tree editor, dashboard, and settings.

## Stack

- Next.js (App Router) + React  
- Tailwind CSS + shadcn/ui  
- Cookie-based API session against Nest via same-origin `/api` rewrite (recommended)

## Environment

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes (API mode) | `same-origin` (recommended) **or** absolute Nest URL (legacy) |
| `BACKEND_URL` | Same-origin mode | Nest origin used by `next.config` rewrites |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Optional client error reporting hook |

**Recommended (Vercel + Railway):** set `NEXT_PUBLIC_API_URL=same-origin` and `BACKEND_URL=<Railway API>` in the Vercel project (Production + Preview). The browser only talks to the Vercel host; Next rewrites `/api/*` to Nest. Cookies are first-party — set `COOKIE_SAMESITE=lax` on Railway. Middleware can see `capex_auth`. After switching from cross-origin, users must sign in once (old Railway-domain cookies are unused).

**Legacy cross-origin:** set `NEXT_PUBLIC_API_URL` to the Railway origin and `COOKIE_SAMESITE=none` on Nest. Middleware cannot see those cookies; `AuthSessionGate` enforces routes client-side.

Without `NEXT_PUBLIC_API_URL`, the workspace falls back to browser `localStorage` (local demo only).

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Prefer same-origin locally:

```env
NEXT_PUBLIC_API_URL=same-origin
BACKEND_URL=http://localhost:3001
```

## Main routes

| Route | Description |
| --- | --- |
| `/` | Marketing landing |
| `/login`, `/register` | Authentication |
| `/dashboard` | Portfolio overview |
| `/capex-tree` | Capex hierarchy editor |
| `/benchmarking` | Price compare across countries, deliveries, packages, etc. |
| `/input-current-traffic` | Input Current Traffic (coming soon) |
| `/settings` | Catalogs and relationships |

Session cookies (`access_token`, `refresh_token`, `capex_auth`) are set by Nest and, in same-origin mode, stored on the Next host.
