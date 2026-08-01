# Do'kon — Phone & Accessory Shop (frontend)

Mobile-first Vue 3 SPA for a small phone & accessory shop: phones (new/used), accessories
with stock intake, sales (with one-time debt), returns, debtors, expenses, and a statistics
dashboard. UI is **Uzbek (Latin)**, money is **UZS**, timezone is **Asia/Tashkent**.

## Stack

- **Vue 3** `<script setup>` + **TypeScript** (strict) + **Vite**
- **Vue Router 4** with an auth guard + refresh-rotation
- **Pinia** (session + UI prefs) · **TanStack Query for Vue** (all server data)
- **Axios** (one instance, auth + refresh-on-401 interceptor)
- **Tailwind CSS v4** with a CSS-variable design-token layer (light/dark)
- `@vueuse/motion`, `vee-validate` + `zod`, `vue-chartjs`, `lucide-vue-next`, `vue-sonner`, `date-fns`

## Backend

The backend is a finished NestJS API. Its OpenAPI spec is committed at `openapi.json`
(fetched from `http://localhost:3000/api/docs-json`); hand-written DTOs live in
`src/api/types.ts`.

The backend sends **no CORS headers**, so the Vite dev server **proxies** `/api` and
`/uploads` to it (see `vite.config.ts`). Configure via `.env`:

```
VITE_API_BASE_URL=/api                     # relative in dev (proxied, same-origin)
VITE_DEV_API_TARGET=http://localhost:3000  # where the proxy forwards
```

For a deployment that hits the API directly, set `VITE_API_BASE_URL` to the absolute URL.

## Project layout

```
src/
  api/          typed client per resource + axios instance, session, error map
  components/   ui/ (design-system primitives), plus per-feature components
  composables/  TanStack Query hooks + helpers (usePaginatedList, useCountUp, …)
  config/       navigation config
  i18n/         Uzbek dictionary + t() helper
  layouts/      AppShell (bottom-nav mobile / sidebar desktop)
  lib/          format helpers, status→label maps, toast, transitions
  stores/       auth (session) + ui (theme)
  views/        route screens
```

## Setup

```sh
npm install
npm run dev          # dev server on http://localhost:5173 (proxies to the backend)
npm run build        # type-check + production build
npm run lint         # oxlint + eslint
npm run format       # prettier
```
