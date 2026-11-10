# Frontend deployment (Vercel)

How the frontend in `frontend/` gets built and published, which variables it
needs and what has to be configured outside Vercel (Auth0, backend CORS) for a
deployment to work. The platform decision and the overall deploy flow are in
[`support/skills/infra.md`](../support/skills/infra.md#deploy) and
[`support/docs/tech-stack.md`](../support/docs/tech-stack.md); this page covers
the frontend details only.

## Environments

| Environment | Source                          | URL                                                      |
| ----------- | ------------------------------- | -------------------------------------------------------- |
| Production  | push / merge to `main`          | `https://zest-frontend-five.vercel.app` (see note below) |
| Preview     | every other branch and every PR | Unique URL per deployment, posted by Vercel on the PR    |
| Local       | `npm run dev`                   | `http://localhost:5173`                                  |

There is no separate dev or staging environment: the backend is a single
Render service (`zest-backend`) that also deploys from `main`, so production
and every preview talk to the same backend unless the preview's variables say
otherwise.

> The production URL above is the one the live Zest app is served from and the
> one used as the example origin in the backend's CORS tests. Confirm it under
> **Vercel → `zest-frontend` → Settings → Domains** before relying on it, and
> update this page if a custom domain is added.

## How a deployment is built

The Vercel project `zest-frontend` is connected to this repository with
`frontend/` as its root directory. With the Vite preset defaults (check
**Settings → Build and Deployment** if in doubt) it runs:

| Step    | Command         | Notes                                         |
| ------- | --------------- | --------------------------------------------- |
| Install | `npm install`   | Uses `frontend/package-lock.json`             |
| Build   | `npm run build` | `tsc -b && vite build`, a type error fails it |
| Output  | `dist/`         | Served as static files                        |

`frontend/vercel.json` rewrites every path to `/index.html`, so deep links such
as `/recipes/123` load the app instead of returning 404 on refresh.

Unlike the backend on Render, nothing in this repository makes Vercel wait for
GitHub Actions, so a commit that fails CI may still get a deployment. Merge to
`main` only with CI green.

## Environment variables

Vite inlines every `VITE_*` variable into the JavaScript bundle **at build
time**. Two consequences:

- They are public. Anyone can read them in the browser, so never store a client
  secret, database URL or AWS key in a `VITE_*` variable.
- Changing a value in Vercel does nothing to existing deployments. **Redeploy**
  (Deployments → ⋯ → Redeploy) after editing variables.

Set them in **Vercel → `zest-frontend` → Settings → Environment Variables**, once
for **Production** and once for **Preview**. Actual values live in Vercel and in
each developer's local `.env`, never in this repository.

| Variable                   | Required | Used in                                                           | Value                                                                                                             |
| -------------------------- | -------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`             | Yes      | `src/services/httpClient.ts`                                      | Backend base URL, no trailing `/` or path. Production: the Render service's HTTPS URL                             |
| `VITE_AUTH0_DOMAIN`        | Yes      | `src/auth/Auth0ProviderWithNavigate.tsx`, `src/services/auth0.ts` | Auth0 tenant domain, without `https://` (e.g. `<tenant>.us.auth0.com`)                                            |
| `VITE_AUTH0_CLIENT_ID`     | Yes      | same as above                                                     | Client ID of the Auth0 **Single Page Application**. It is public; the client secret is never used by the frontend |
| `VITE_AUTH0_AUDIENCE`      | Yes      | `src/auth/Auth0ProviderWithNavigate.tsx`                          | Identifier of the Auth0 API. Must equal the backend's `AUTH0_AUDIENCE`                                            |
| `VITE_AUTH0_DB_CONNECTION` | No       | `src/services/auth0.ts`                                           | Auth0 Database connection name, used only for password-reset emails                                               |

A missing required variable does **not** fail the build. The built app throws on
load instead (`Missing VITE_API_URL…` / `Missing Auth0 env vars…`) and renders a
blank page; the message only shows in the browser console. Without
`VITE_AUTH0_DB_CONNECTION` everything works except the password reset, which
shows "Password reset is not configured for this environment."

## Configuration outside Vercel

A deployment with correct variables still fails if these are missing.

### Auth0 application URLs

The app uses `window.location.origin` both as the login `redirect_uri` and as
the logout `returnTo`, and calls Auth0 from the browser. So in **Auth0 →
Applications → (Zest SPA) → Settings**, each frontend origin must be listed in:

- **Allowed Callback URLs**
- **Allowed Logout URLs**
- **Allowed Web Origins**

Use the bare origin, no path: `http://localhost:5173`,
`https://zest-frontend-five.vercel.app`, and the preview URLs if previews must
support login. Auth0 accepts a `*` wildcard in a subdomain for these fields.

The app also uses refresh tokens (`useRefreshTokens`), so **Refresh Token
Rotation** and **Allow Offline Access** (on the Auth0 API) must be enabled. See
[`support/skills/auth.md`](../support/skills/auth.md) for the auth conventions and
[`docs/tech-stack.md`](tech-stack.md#authentication) for the token contract.

### Backend CORS

The backend only accepts browser requests from the origins in its
`CORS_ORIGIN` variable (set on the Render service). It is a comma-separated list
of origins, no trailing slash, for example:

```
https://zest-frontend-five.vercel.app,https://zest-frontend-*-<team>.vercel.app
```

A `*` matches one hostname label (letters, digits, hyphens), which is how the
preview URLs are allowed; a bare `https://*.vercel.app` is rejected on purpose.
Locally it is `http://localhost:5173` (see `backend/.env.example`). The rules are
implemented in `backend/src/cors-origins.ts`.

## Checking a deployment

1. Open the deployment URL. A blank page means a required variable is missing:
   check the browser console.
2. In DevTools → Network, confirm API calls go to the Render backend, not
   `localhost`, and that none fail with a CORS error.
3. Log in and log out. An Auth0 "Callback URL mismatch" error means the origin
   is missing from the Auth0 application settings.
4. Refresh on a nested route; it should load the same page, not a 404.

If the first API call is slow, check the backend's `/health` before assuming
the frontend deploy is broken: the backend and the frontend deploy
independently.
