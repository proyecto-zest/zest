# Zest — Frontend

React + TypeScript + Vite + Tailwind CSS.

## Initial setup

Requires Node 22 or newer (CI uses 22) and npm.

```bash
git clone https://github.com/proyecto-zest/zest.git
cd zest/frontend
npm install
cp .env.example .env
```

The clone checks out `main`, the production code. To work on the latest
changes, run `git switch dev` before `npm install`.

Then fill in `.env`. Every variable is described in
[`docs/frontend-deployment.md`](../docs/frontend-deployment.md#environment-variables);
ask a team member for the Auth0 values.

| Variable                   | Local value                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| `VITE_API_URL`             | `http://localhost:3000` (a local backend, see `backend/README.md`)   |
| `VITE_AUTH0_DOMAIN`        | The team's Auth0 tenant domain                                       |
| `VITE_AUTH0_CLIENT_ID`     | Client ID of the Auth0 SPA application                               |
| `VITE_AUTH0_AUDIENCE`      | Identifier of the Auth0 API (same as the backend's `AUTH0_AUDIENCE`) |
| `VITE_AUTH0_DB_CONNECTION` | Optional. Auth0 Database connection, only for password-reset emails  |

The first four are required even to render the login screen. If one is empty,
`npm run dev` starts fine but the page stays **blank** and the browser console
shows `Missing VITE_API_URL…` or `Missing Auth0 env vars…`. Restart
`npm run dev` after editing `.env`.

Without Auth0 credentials you can still check the setup and work on the login
and signup screens: put any non-empty placeholder in the three `VITE_AUTH0_*`
required variables. Every other route requires a session, so it redirects to
`/login`, and the login button will fail at Auth0.

For login to work locally, `http://localhost:5173` must be in the Auth0
application's allowed URLs and in the backend's `CORS_ORIGIN`; see
[Configuration outside Vercel](../docs/frontend-deployment.md#configuration-outside-vercel).

Never commit your `.env`. All `VITE_*` values are included in the browser build:
they are public configuration, not a place for client secrets, database
credentials or AWS access keys.

## Deployment

Vercel deploys `main` to production and every other branch or PR to a preview
URL. Variables, Auth0 and CORS setup, and how to check a deployment:
[`docs/frontend-deployment.md`](../docs/frontend-deployment.md).

## Daily use

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Dev server at http://localhost:5173 (`PORT` overrides it) |
| `npm run build`        | Type check and production build into `dist/`              |
| `npm run preview`      | Serves the production build for review                    |
| `npm run lint`         | ESLint                                                    |
| `npm run typecheck`    | Type check without emitting                               |
| `npm run format`       | Formats with Prettier                                     |
| `npm run format:check` | Checks formatting without writing                         |

Unit test (also run in CI):

```bash
node --experimental-strip-types --test test/search-normalization.test.ts
```

## Structure

```
src/
  app/          App.tsx, route definitions (routes.tsx)
  auth/         Auth0 provider, protected routes, access-token bridge
  components/   shared components; nav/ (site shell), ui/ (form controls,
                buttons, modal, toast), alert/
  features/     screens and their logic, grouped by feature (feed,
                recipe-create, collections, profile, auth, ...)
  services/     HTTP clients, one per backend resource
  lib/          pure helpers (formatting, search normalization)
  types/        shared TypeScript types
  styles/       Tailwind entry point and design tokens
  theme/        token mapping onto Tailwind
```

## Backend connection

`services/httpClient.ts` centralizes HTTP calls: it uses `VITE_API_URL` as the
base, attaches the Auth0 access token when there is a session, and throws
`HttpError` on unsuccessful responses. Do not scatter bare `fetch` calls inside
components.

## Layout

`components/nav/SiteShell.tsx` wraps every route with the shell from the design
reference (`support/design/uploads/zest-wireframe-design/components/site-shell.tsx`):
a top navigation bar (a header and drawer on mobile) over a centered, capped
content column, and no footer. `/login` and `/signup` render full-bleed,
without the navigation.

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

The `frontend` job in `.github/workflows/ci.yml` runs on every PR and on push
to `main`: `npm ci` → `lint` → `typecheck` → search-normalization test →
`build`. It does not check formatting; run `npm run format:check` yourself.
