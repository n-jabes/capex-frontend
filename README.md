# Capex Frontend

Next.js application for Axian Telecom Capacity and Pricing—public landing, authentication, Capex tree editor, dashboard, and settings.

## Stack

- Next.js (App Router) + React  
- Tailwind CSS + shadcn/ui  
- Cookie-based API session against the Nest backend  

## Environment

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes (for API mode) | Backend origin, e.g. `http://localhost:3001` |

Without `NEXT_PUBLIC_API_URL`, the workspace falls back to browser `localStorage` (local demo only). Middleware auth redirects are also disabled in that mode.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Main routes

| Route | Description |
| --- | --- |
| `/` | Marketing landing |
| `/login`, `/register` | Authentication |
| `/dashboard` | Portfolio overview |
| `/capex-tree` | Capex hierarchy editor (copy/paste, licenses, discounts) |
| `/settings` | Catalogs and relationship configuration |

Authenticated requests use `credentials: "include"`. Tree changes are debounced to `PATCH /api/portfolios/:id/tree` with optimistic version locking. Use **Export JSON** in the header to download the current portfolio snapshot.
