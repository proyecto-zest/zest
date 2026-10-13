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

Edit `.env` and set `VITE_API_URL` to the backend base URL
(`http://localhost:3000` for a local backend).

For the authenticated application, also fill `VITE_AUTH0_DOMAIN`,
`VITE_AUTH0_CLIENT_ID` and `VITE_AUTH0_AUDIENCE` with the SPA/API configuration
from Auth0. Set `VITE_AUTH0_DB_CONNECTION` to the Database connection name when
testing password-reset emails. The app reports missing API or required Auth0
configuration on startup; the empty example values must be filled locally.

Never commit your `.env`. All `VITE_*` values are included in the browser build:
they are public configuration, not a place for client secrets, database
credentials or AWS access keys.

## Production configuration (Vercel)

Configure the project under **Settings → Environment Variables**:

- `VITE_API_URL`: the public HTTPS base URL of the Render backend, type **Config**,
  scoped to **Production**. Do not use `localhost` or append `/health`.
- Per ZEST-78, `VITE_AUTH0_*` remain empty during the initial provisioning. This
  applies to the older `main` version without Auth0. Before deploying the
  authenticated application from `dev`, configure its required Auth0 values;
  empty values will prevent that version from starting.

Redeploy after changing variables: Vite reads them during the build, so updating
Vercel settings does not change an already published build. Keep actual
environment-specific values in Vercel rather than this repository.

To verify, open the production site and check in the browser Network panel that
API requests target Render. A successful build does not establish that CORS or
the backend endpoints work. Preview configuration and CORS are covered by
ZEST-80.

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

## Alerts

`components/alert` is the single component for every error and success message.
Do not hand-roll a coloured `<div>` for feedback.

| Prop        | Type                   | Notes                                                                       |
| ----------- | ---------------------- | --------------------------------------------------------------------------- |
| `variant`   | `'error' \| 'success'` | Required. Drives colors, icon and how screen readers announce it            |
| `message`   | `string \| string[]`   | Required. A list renders as bullets — the shape validation errors arrive in |
| `title`     | `string`               | Optional bold line above the message                                        |
| `onDismiss` | `() => void`           | Optional. Passing it is what makes the close button appear                  |

```tsx
<Alert variant="error" message="Could not connect: 503 Service Unavailable" />

<Alert variant="success" message="Recipe saved to your collection." />

<Alert
  variant="error"
  title="Please fix the following"
  message={['Title is required.', 'Add at least one ingredient.']}
/>
```

Dismissal is controlled by the caller: `Alert` calls `onDismiss`, and the parent
decides to stop rendering it.

```tsx
const [visible, setVisible] = useState(true)

{
  visible && (
    <Alert variant="success" message="Changes published." onDismiss={() => setVisible(false)} />
  )
}
```

Accessibility is handled inside the component. `error` renders `role="alert"`
with `aria-live="assertive"`, so a failure interrupts and gets announced right
away. `success` renders `role="status"` with `aria-live="polite"`, so a
confirmation waits its turn instead of cutting off whatever the user is hearing.

## Styling

Every color, type size, spacing step, radius and shadow comes from a design
system token. Tailwind's scales are **replaced**, not extended, so a utility can
only resolve to a token — `bg-slate-500` does not exist here.

Tokens live in `src/styles/tokens/` and are mapped onto Tailwind in `src/theme/`.
Arbitrary values (`bg-[#hex]`, `text-[13px]`, `p-[7px]`) are rejected by ESLint.
When a token is missing, add it rather than working around it.

Full reference: [`docs/design-system.md`](../docs/design-system.md).

## CI

`.github/workflows/ci.yml` runs on every PR and on push to `main`:
`npm ci` → `lint` → `typecheck` → `build`.
