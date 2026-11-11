# Zest

A recipe app: users create recipes (ingredients, steps, images), bookmark them,
organize them into collections, and plan what to cook on each date.

## Repository layout

| Path        | What                                                                |
| ----------- | ------------------------------------------------------------------- |
| `frontend/` | React + TypeScript + Vite + Tailwind, deployed on Vercel            |
| `backend/`  | Node.js + TypeScript + NestJS + Prisma, deployed on Render          |
| `docs/`     | Repository docs (design system, frontend deployment)                |
| `support/`  | Git submodule with the schema, architecture, design and conventions |

`main` is what runs in production; day-to-day work is merged into `dev` first.

## Getting started

```bash
git clone https://github.com/proyecto-zest/zest.git
cd zest
git submodule update --init --recursive
```

The submodule is only needed for the docs and design references; the frontend
and backend build without it.

- Frontend: [`frontend/README.md`](frontend/README.md)
- Backend: [`backend/README.md`](backend/README.md)

The frontend needs a running backend (`VITE_API_URL`) and an Auth0 application
to be fully usable. Without them it still starts and shows the login screen; see
the frontend README for what works with placeholder values.

## Documentation

| Topic                                   | Where                                                        |
| --------------------------------------- | ------------------------------------------------------------ |
| Frontend deployment and variables       | [`docs/frontend-deployment.md`](docs/frontend-deployment.md) |
| Design system (tokens, Tailwind setup)  | [`docs/design-system.md`](docs/design-system.md)             |
| Auth0 token and claims contract         | [`docs/tech-stack.md`](docs/tech-stack.md)                   |
| Database schema (source of truth)       | [`support/docs/db.md`](support/docs/db.md)                   |
| Stack and architecture                  | [`support/docs/tech-stack.md`](support/docs/tech-stack.md)   |
| Infra conventions (Render/Vercel/Neon)  | [`support/skills/infra.md`](support/skills/infra.md)         |
| Conventions for contributors and agents | [`support/AGENTS.md`](support/AGENTS.md)                     |

`support/docs/tech-stack.md` is behind `support/docs/db.md` on the data model;
when they disagree, `db.md` wins.

## CI

`.github/workflows/ci.yml` runs on every pull request and on push to `main`:
backend lint, build and tests against Postgres, and frontend lint, type check,
search-normalization test and build.
