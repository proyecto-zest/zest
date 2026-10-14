# Technology stack

## Authentication

Zest delegates login and credential management to Auth0. The frontend sends an
Auth0 access token in the `Authorization: Bearer <token>` header, and the
backend validates its signature and claims against Auth0's public JWKS keys.

Custom Auth0 claims use the `https://zest.app` namespace:

- `https://zest.app/email`
- `https://zest.app/name`
- `https://zest.app/picture`
- `https://zest.app/email_verified`

The namespace is an identifier only; it does not need to resolve to a webpage.
