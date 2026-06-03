# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WC Bets is a private, mobile-first PWA for the 2026 FIFA World Cup prediction game. All routes require authentication. The app is early stage — `src/App.tsx` is still the Vite default; the intended structure is defined in `frontend.md` and the target screen map/API in `docs/openapi.json`.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run preview    # preview production build

# Regenerate TypeScript types from the OpenAPI spec (run after backend changes)
npx openapi-typescript docs/openapi.json -o src/types/api.d.ts
```

No test runner is configured yet.

## Node version

`.nvmrc` pins Node 22. Run `nvm use` (or `fnm use`) after cloning.

## Stack

| Layer | Package |
|---|---|
| Build | Vite 8, `@vitejs/plugin-react` |
| UI | React 19, TypeScript 6 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite` plugin — no `tailwind.config`) |
| Components | shadcn/ui `base-nova` style — generated files live in `src/components/ui/`, do not edit manually |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| HTTP | ky 2 |
| Icons | Lucide React |
| PWA | `vite-plugin-pwa` (Workbox) |

## Design system

Theme defined in `src/index.css` using shadcn CSS variables. Dark mode is the default (`class="dark"` on `<html>`). World Cup 2026 palette:

| Role | Light | Dark |
|---|---|---|
| `--primary` | Deep navy `oklch(0.22 0.09 263)` | Trophy gold `oklch(0.78 0.14 68)` |
| `--accent` | Trophy gold `oklch(0.73 0.13 68)` | Crimson red `oklch(0.55 0.21 24)` |
| `--background` | Warm white | Deep navy `oklch(0.13 0.04 263)` |

Import alias `@/*` resolves to `src/*` (configured in `tsconfig.app.json` and `vite.config.ts`). TypeScript 6 requires `paths` without `baseUrl`.

To add new shadcn components: `npx shadcn add <component>`

## Architecture

### Source layout (target)

```
src/
├── api/              # One file per backend router; ky instance in client.ts
├── components/
│   ├── ui/           # shadcn/ui — do not edit
│   └── app/          # app-specific components
├── hooks/            # Custom React hooks (including useBreakpoint)
├── pages/            # One folder per route
├── lib/              # Utils, formatters, constants
├── types/            # api.d.ts generated from OpenAPI spec
└── main.tsx
```

### Auth

JWT stored in `localStorage`. `src/api/client.ts` attaches `Authorization: Bearer <token>` to every request. On 401, redirect to `/login` and clear token. New users have `approved = false` — show `/pending-approval` screen instead of a generic error.

### Layout

Two layouts share the same React tree, switching via `useBreakpoint`:
- **Mobile < 768px**: bottom nav bar (5 tabs) + top app bar
- **Desktop ≥ 768px**: fixed left sidebar

### Three independent leaderboards

1. **Match Prediction** — exact scoreline per match; predictions visible only after `FINISHED`
2. **Pick'em** — Group Stage (standings order per group, deadline June 11 2026) + Bracket (entire knockout bracket filled in one go, deadline ~June 28 2026)
3. **Crystal Ball** — global questions with answer types `PLAYER | TEAM | NUMBER`; some have `maxSelections > 1` (e.g. IDEAL_XI = 11); `selectionIndex` orders picks

### Tournament structure

Phases: `GROUP_STAGE → ROUND_OF_32 → ROUND_OF_16 → QUARTER_FINAL → SEMI_FINAL → THIRD_FOURTH_POSITION → FINAL`. 12 groups, 48 teams. Match statuses: `DEFINED → STARTED → HALF_TIME → FINISHED`. Bracket is modelled via `BracketSlot` nodes that self-reference (`homeFeedsFrom` / `awayFeedsFrom`).

### Roles

`PLAYER` → `ADMIN` (+ approve users, enter Crystal Ball results) → `SUPERADMIN` (+ override match results, adjust scoring weights/deadlines).

### Prediction deadlines

The UI must hide edit controls once a deadline passes — never rely on backend rejection alone.

### API types

`src/types/api.d.ts` is auto-generated from `docs/openapi.json` (the single source of truth for all endpoints and schemas). Regenerate whenever the backend changes.

### PWA

Cache strategy: Network First for API calls, Cache First for static assets. Show an offline banner when the network is unavailable — never silently fail.
