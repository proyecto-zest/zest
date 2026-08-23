---
name: zest-database
description: Zest database schema and conventions (PostgreSQL + Prisma). Use before touching the Prisma schema, creating migrations, adding tables or columns, or writing queries. Also to check whether an entity exists in the data model.
---

# Zest database

The rules live in the support repo (`support/` submodule).

## Always read, before touching data models
- `support/docs/db.md` — **source of truth**: 10 entities. If the code and this
  doc disagree, fix both in the same PR.
- `support/skills/database.md` — conventions, migrations, queries.

## The 10 entities
`users`, `recipes`, `recipe_steps`, `ingredients`, `recipe_ingredients`,
`recipe_images`, `collections`, `collection_recipes`, `saved_recipes`,
`planner_entries`.

## Explicitly out of scope — do not build
- **`labels`/`recipe_labels`** — dropped. Recipes have a single `category` field,
  not a many-to-many tag system.
- **`follows`** — following other users is out of scope for this version.
- **`weekly_plans`** — `planner_entries` links a user and a recipe to a `date`,
  with no week-grouping entity above it.
- **Audit columns** (`created_at`/`updated_at`) and ordering columns
  (`recipe_images.position`, `collections.added_at`) — left out on purpose. Their
  absence is not a bug.

`support/docs/tech-stack.md` still describes an older 13-entity version.
**`docs/db.md` wins** until they are reconciled.

## Non-negotiable
- `uuid` for every primary and foreign key, never auto-increment ints.
- Pure join tables (`recipe_ingredients`, `collection_recipes`, `saved_recipes`)
  have **no surrogate `id`**: their primary key is the composite of the two FKs.
- `recipe_ingredients.amount` is free-text `varchar` ("2 cups", "1/4 tsp"). Do not
  assume it parses as a number.
- No `password` field on `users` — Auth0 owns authentication.
- Every schema change is a Prisma migration. Never edit an already-applied one.
