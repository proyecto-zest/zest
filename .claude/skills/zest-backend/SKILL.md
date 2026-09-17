---
name: zest-backend
description: Conventions for the Zest backend (Node.js + TypeScript + NestJS + Prisma). Use when creating or changing modules, controllers, services, DTOs, validation, error handling, S3 image uploads or configuration under backend/.
---

# Zest backend

The rules live in the support repo (`support/` submodule). **Read them before
writing backend code.**

## Always read
- `support/skills/backend.md` — module structure, validation, Prisma, errors,
  config.

## Read as the task requires
- `support/docs/db.md` — source of truth for the schema. Table and column names
  follow this file, not the other way around.
- `support/skills/auth.md` — JWT validation against Auth0 (see `zest-auth`).
- `support/skills/database.md` — schema and migration conventions (see
  `zest-database`).

## Non-negotiable
- One Nest module per resource: `users`, `recipes` (with `recipe_steps`,
  `recipe_ingredients`, `recipe_images`), `ingredients`, `collections`,
  `saved-recipes`, `planner-entries`. There are **no** `labels`, `follows` or
  `weekly-plans` modules.
- Thin controllers: no Prisma calls and no business logic inside a controller
  method.
- Every incoming body gets a DTO with `class-validator`. Never trust untyped
  `req.body`.
- Images: the backend issues a pre-signed S3 upload URL and the client uploads
  the bytes directly. Do **not** stream uploads through NestJS.
- Errors use Nest's `HttpException` subclasses, with a response shape that stays
  consistent across endpoints.
