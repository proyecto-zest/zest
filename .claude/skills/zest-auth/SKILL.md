---
name: zest-auth
description: Zest authentication with Auth0 (JWT, JWKS, login/logout, tokens). Use when implementing login, protecting routes, validating tokens, handling sessions, or linking an Auth0 identity to a local user.
---

# Zest auth — Auth0

Full rules: `support/skills/auth.md` (`support/` submodule). Read it before
touching auth.

## How it works
The browser redirects to Auth0 to log in. Auth0 returns a JWT with a `sub` claim.
Our servers handle no passwords and no sessions: the backend validates every
request against Auth0's public keys (JWKS). `users.auth0_sub` links the Auth0
identity to the local user row.

## Non-negotiable
- Frontend: use the official `@auth0/auth0-react` SDK. Do not hand-write OAuth
  redirect handling or parse JWTs manually.
- Do **not** store tokens in `localStorage` — let the SDK manage storage and
  refresh.
- Backend: verify the signature against JWKS and check the `aud`/`iss` claims on
  every protected route. Do not skip verification "for now".
- No server-side session store, no password hashing. If a `password` column or a
  sessions table shows up, stop and check with a human.
- Never log full JWTs or the Auth0 client secret.
