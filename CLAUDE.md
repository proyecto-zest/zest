# Zest

A recipe app: users create recipes (ingredients, steps, images), bookmark them,
organize them into collections, and plan what to cook on each date.

## Support repo

Documentation and conventions live in
[`zest-support`](https://github.com/inesgassiebayle/zest-support), wired in here
as a submodule at `support/`. If `support/` is empty:

```
git submodule update --init --recursive
```

| What | Where |
|---|---|
| Entry point for agents | `support/AGENTS.md` |
| Database schema (**source of truth**) | `support/docs/db.md` |
| Stack and architecture | `support/docs/tech-stack.md` |
| Design and wireframes | `support/design/` |
| Per-layer conventions | `support/skills/` |

The skills in `.claude/skills/` (`zest-frontend`, `zest-backend`, `zest-database`,
`zest-auth`, `zest-infra`, `zest-git-workflow`) point at those files. They do not
duplicate the content: the support repo is always the source.

## Ground rules

- **Read `support/docs/db.md` before touching data models.** It is the source of
  truth for entities, fields and relationships. Do not invent columns or tables
  that are not there, and do not rebuild `labels`, `follows` or `weekly_plans`
  just because an older doc or a stale mockup mentions them. If the schema needs
  to change, propose it in `docs/db.md` first.
- **`docs/tech-stack.md` is out of date** relative to `docs/db.md`: it still
  describes 13 entities including `labels`, `follows` and `weekly_plans`, none of
  which exist anymore. `docs/db.md` wins until they are reconciled.
- **Do not re-litigate settled architecture decisions** (NestJS over Express,
  Prisma over a raw query builder, Auth0 over rolling our own, Docker-on-EC2 over
  serverless) without flagging it to a human first. The "why" is in
  `docs/tech-stack.md`.
- **This is a student project.** Prefer straightforward, readable code over clever
  abstractions. Do not add infrastructure, patterns or dependencies beyond what
  the current task needs.
- **Never commit secrets** (`.env`, API keys, Auth0 client secret, DB
  credentials). Only `.env.example` belongs in git.
- **Follow the design.** `support/design/` is a spec, not a suggestion. If a
  screen or state is not covered there, ask before improvising a freehand version.

## Layout

- `frontend/` — React + TypeScript + Vite + Tailwind
- `backend/` — Node.js + TypeScript + NestJS + Prisma
- `support/` — submodule with docs, design and conventions

## Something missing?

If these rules do not cover a situation, or an agent drifts from them, open a
"Skill / convention miss" issue in the support repo instead of silently working
around it.
