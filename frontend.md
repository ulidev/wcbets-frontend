# WC Bets — Frontend Specification

## Project Overview

WC Bets is a private prediction game for the 2026 FIFA World Cup (48 teams). Inspired by League of Legends Worlds pick'ems. Users register, get approved by an admin, and then compete across three independent leaderboards by making predictions before deadlines.

The app is entirely private — all content requires authentication. There is no public-facing area.

---

## The Three Leaderboards

Understanding these is essential for structuring the UI. They are independent and have separate scoring, but users care about all three simultaneously.

### 1. Match Prediction
The user predicts the **exact scoreline** of each match (and optionally the match MVP) before it starts. Points are awarded when the match finishes. Visible to others only after the match is `FINISHED`.

### 2. Pick'em
Two sub-modes that share one leaderboard:
- **Group Stage**: Before the tournament starts (deadline: June 11 2026), the user predicts the **final standings order** of each group. One prediction per group.
- **Bracket**: Before the knockout phase starts (deadline: ~June 28 2026), the user fills in the **entire bracket at once** — predicting the winner of every knockout slot from Round of 32 onwards. The bracket is filled in one go, not round by round. Users may predict with incorrect premises (e.g. a team that didn't qualify) — that's valid, they just won't score.

### 3. Crystal Ball
A catalogue of global tournament questions (e.g. "Who wins the Golden Boot?", "How many yellow cards will Gavi get?", "Which team scores the biggest win?"). Deadline: June 11 2026. Questions are configured in the database, not hardcoded. Three answer types:
- `PLAYER` — the user selects a player
- `TEAM` — the user selects a team
- `NUMBER` — the user enters an integer

Some questions have `maxSelections > 1` (e.g. IDEAL_XI = 11, TOP_4 = 4). The `selectionIndex` field orders picks when order matters (XI positions, Top 4 ranking).

---

## Tournament Structure

- **Phases**: `GROUP_STAGE → ROUND_OF_32 → ROUND_OF_16 → QUARTER_FINAL → SEMI_FINAL → THIRD_FOURTH_POSITION → FINAL`
- The 2026 World Cup starts the knockout phase at **Round of 32** (not Round of 16) because there are 48 teams.
- **Group Stage**: 12 groups. Each group has standings (position, points, goals).
- **Bracket**: Modelled via `BracketSlot` — an abstraction independent of the actual match. Slots self-reference (`homeFeedsFrom` / `awayFeedsFrom`) to represent the bracket tree. Group stage matches have no `BracketSlot`.
- **Match statuses**: `DEFINED → STARTED → HALF_TIME → FINISHED`

---

## User Roles & Access

| Role | Can do |
|---|---|
| `PLAYER` | Make predictions, view own scores, view leaderboards |
| `ADMIN` | All of PLAYER + approve/manage users, enter Crystal Ball results manually |
| `SUPERADMIN` | All of ADMIN + manage admin roles + override match results manually + adjust scoring weights and deadlines |

New users register with `approved = false`. They cannot interact with the app until an admin approves them. This approval state must be handled gracefully in the UI (show a pending screen, not a generic error).

---

## Prediction Deadlines & Visibility

| Prediction type | Deadline | Editable | Visible to others |
|---|---|---|---|
| Match Prediction | 1 min before match `scheduledAt` | Yes, until deadline | After match is `FINISHED` |
| Crystal Ball | June 11 2026 | No | After June 11 2026 |
| Group Stage Pick'em | June 11 2026 | No | After June 11 2026 |
| Bracket Pick'em | ~June 28 2026 | No | After first Round of 32 match |

Past the deadline, no prediction is modifiable. The UI must enforce this and not show edit controls once the deadline passes.

---

## Concept

Mobile-first Progressive Web App (PWA). Designed to feel like a native mobile app while remaining fully usable on desktop. The app is private — all content requires authentication.

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Build tool | [Vite](https://vitejs.dev/) | 6.x |
| Framework | [React](https://react.dev/) | 19.x |
| Language | TypeScript | 5.x |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | 4.x |
| Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI) | latest |
| Routing | [React Router](https://reactrouter.com/) | 7.x |
| Server state | [TanStack Query](https://tanstack.com/query) | 5.x |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | latest |
| HTTP client | [ky](https://github.com/sindresorhus/ky) | latest |
| Icons | [Lucide React](https://lucide.dev/) | latest |

---

## PWA Requirements

The app must be installable from mobile browsers (Add to Home Screen) and work correctly after installation.

- `vite-plugin-pwa` with Workbox for service worker generation
- Web App Manifest with `display: standalone`
- Theme color and splash screen icons for iOS and Android
- Cache strategy: **Network First** for API calls, **Cache First** for static assets
- Offline state: show a clear offline banner; do not silently fail

---

## Layout Architecture

Two layouts driven by viewport width, no user toggle needed:

**Mobile (< 768px):** Bottom navigation bar with 5 tabs: **Matches**, **Pick'em**, **Crystal Ball**, **Leaderboard**, **Profile**. Full-screen pages with top app bar showing current section title.

**Desktop (≥ 768px):** Fixed left sidebar with the same navigation items. Content area fills remaining space. No horizontal scroll.

Both layouts share the same React component tree — only the navigation wrapper changes via a `useBreakpoint` hook.

---

## Project Structure

```
src/
├── api/              # API client functions, one file per backend router
│   ├── auth.ts
│   ├── matches.ts
│   ├── predictions.ts
│   ├── picks.ts
│   ├── crystal-ball.ts
│   ├── leaderboards.ts
│   └── client.ts     # ky instance with base URL + auth headers
├── components/
│   ├── ui/           # shadcn/ui generated components (do not edit manually)
│   └── app/          # application-specific components
├── hooks/            # custom React hooks
├── pages/            # one folder per route
├── lib/              # utils, formatters, constants
├── types/            # TypeScript types generated from OpenAPI spec
└── main.tsx
```

---

## Auth Flow

JWT-based (matches the FastAPI backend). Token stored in `localStorage`. Interceptor in `client.ts` attaches `Authorization: Bearer <token>` to every request. On 401, redirect to `/login` and clear token.

---

## Docker (Production)

The production image is a static nginx container with no Node.js runtime:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx.conf` must include `try_files $uri /index.html;` to support client-side routing.

---

## Screen Map

```
/login                          Auth — login form
/register                       Auth — registration form
/pending-approval               Shown when approved=false after login

/matches                        List of all matches grouped by phase/round
/matches/:id                    Match detail + prediction form (if open)

/pickem                         Pick'em hub — tabs for Group Stage and Bracket
/pickem/groups                  Group Stage — list of groups to predict
/pickem/groups/:groupId         Predict/view order for one group
/pickem/bracket                 Full bracket view + fill-in interface

/crystal-ball                   List of all Crystal Ball questions + answers
/crystal-ball/:questionId       Detail / answer form for one question

/leaderboard                    Tab switcher: Match Prediction | Pick'em | Crystal Ball
/leaderboard/:userId            A specific user's prediction breakdown

/profile                        Own profile — scores summary, edit info

--- Admin screens ---
/admin/users                    List of users, approve/manage
/admin/users/:userId            User detail + role management
/admin/crystal-ball             Enter manual results for NUMBER/manual questions
/admin/matches/:id/result       Manual match result override (SUPERADMIN only)
```

---

## API Reference for LLM Implementation

See [`docs/openapi.json`](./openapi.json) — auto-generated from the FastAPI backend. This file is the single source of truth for all available endpoints, request bodies, response schemas, and status codes.

TypeScript types in `src/types/` are generated from this file using `openapi-typescript`:

```bash
npx openapi-typescript docs/openapi.json -o src/types/api.d.ts
```

Regenerate both files whenever the backend changes (see script below).
