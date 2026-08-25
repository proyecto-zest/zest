# Zest — Frontend

React + TypeScript + Vite + Tailwind CSS.

## Initial setup

Requires Node 22 or newer.

```bash
git clone https://github.com/proyecto-zest/zest.git
cd zest/frontend
npm install
cp .env.example .env
```

Edit `.env` and set at least `VITE_API_URL` to the backend URL
(`http://localhost:3000` in development). The app fails on startup if it is
missing, on purpose: a clear error beats silent requests to `undefined`.

The Auth0 variables stay empty until login is implemented. The Auth0 _client
secret_ does not belong here — it is backend-only and must never reach the
frontend.

## Daily use

| Command             | What it does                           |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Dev server at http://localhost:5173    |
| `npm run build`     | Production build into `dist/`          |
| `npm run preview`   | Serves the production build for review |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | Type check without emitting            |
| `npm run format`    | Formats with Prettier                  |

## Structure

```
src/
  app/          App.tsx and route definitions
  components/   shared components (AppShell, AppHeader, Card, Logo)
  features/     code grouped by feature (health, ...)
  services/     HTTP clients, one per backend resource
  hooks/        reusable hooks
  styles/       Tailwind entry point
```

## Backend connection

`services/httpClient.ts` centralizes HTTP calls: it uses `VITE_API_URL` as the
base and throws `HttpError` on unsuccessful responses. Do not scatter bare
`fetch` calls inside components.

`features/health/useHealthCheck.ts` consumes `GET /health` and the home screen
renders the result, so it is obvious at a glance whether frontend and backend
are talking.

## Layout

`components/AppShell.tsx` follows the shell in the design reference
(`support/design/uploads/zest-wireframe-design/components/site-shell.tsx`):
a sticky header over a centered, capped content column, and no footer.

Navigation, search and the profile menu are deliberately absent — their routes
do not exist yet and each lands with its own ticket.

## Styling

Tailwind defaults for now. The design system tokens (Citrus palette,
typography, spacing, radii, shadows and breakpoints) are defined in
**ZEST-20**; from then on utilities resolve to those tokens and arbitrary
values (`bg-[#hex]`, `text-[13px]`) are not allowed.

## CI

`.github/workflows/ci.yml` runs on every PR and on push to `main`:
`npm ci` → `lint` → `typecheck` → `build`.
