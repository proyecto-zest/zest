# Zest KPI reporting

Measures the 10 KPIs of the Lab 4 platform and publishes them once a day. It is
plain TypeScript code run by a scheduled GitHub Actions workflow: no AI agent is
involved in the reporting.

## How it works

1. **Collect** (`src/collect*.ts`): HTTP KPIs from `GET /health`, database KPIs
   from Neon with a read-only role, and the CI KPI from the GitHub API.
2. **Publish** (`src/publish.ts`): checks that the environment's catalog has the
   10 ids, sends one batch with a shared `run_id`, then reads it back.

Resending is safe: the platform ignores rows it already accepted, so the second
daily run only fills in what the first one missed. An accepted value is never
corrected, so a KPI that could not be measured is never sent as 0.

## The 10 KPIs

| KPI | Source | How it is calculated |
|---|---|---|
| `active_users_30d` | Neon | users with `updated_at` in the last 30 days |
| `platform_managed_users` | Neon | active users with a collection that has recipes |
| `platform_managed_rate` | derived | managed / active x 100, 0 if there are no active users |
| `health_latency_p95` | HTTP | p95 of 20 `GET /health` calls after a warm-up |
| `health_error_rate` | HTTP | % of those 20 calls with an error or 10 s timeout |
| `db_query_latency` | Neon | median of 5 `SELECT 1` after a warm-up query |
| `health_up` | HTTP | 1 if the warm-up answered 200 with `status: ok` |
| `db_connected` | HTTP | 1 if the warm-up answered `db: connected` |
| `db_storage_used` | Neon | `pg_database_size` over the 1 GB plan limit, in % |
| `ci_last_run_ok` | GitHub | 1 if the latest finished `ci.yml` run succeeded, 0 otherwise |

No account is excluded from the user KPIs, team accounts included.

## Failure policy

| Situation | What happens |
|---|---|
| All 10 measured | Batch sent, workflow green |
| 1 KPI could not be measured | The other 9 are sent, workflow red; the next run completes the day |
| 2 or more could not be measured | Nothing is sent, workflow red; re-run it the same day |
| Backend or database really down | Reported as 0 (real data), not a failure |

Each failing KPI is retried 3 times, waiting 10 s and then 30 s.

## Schedule

| Run | UTC | Argentina |
|---|---|---|
| First | 11:17 | 08:17 |
| Second (safety net) | 19:17 | 16:17 |
| Manual | any time | `workflow_dispatch` |

Both scheduled runs fall on the same calendar day in Argentina and in UTC, so
they report the same date. Scheduled workflows only run from `main`.

## Running it

```bash
cd kpis
npm ci
npm run typecheck
npm test
npm run dry-run   # measures and prints, sends nothing
```

Needs Node 22.18 or later (it runs TypeScript directly). A dry run needs
`BACKEND_URL`, `NEON_READONLY_URL` and `GITHUB_TOKEN`. Publishing also needs `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
and `PROJECT_KEY`. Use `--env dev` to publish to the dev environment.

## GitHub configuration

| Name | Kind | Value |
|---|---|---|
| `BACKEND_URL` | variable | Render backend URL |
| `SUPABASE_URL_PROD` | variable | Supabase project of the prod environment |
| `SUPABASE_URL_DEV` | variable | Supabase project of the dev environment |
| `SUPABASE_PUBLISHABLE_KEY` | secret | Public key, same for every team |
| `PROJECT_KEY_PROD` | secret | Private key of Zest for prod |
| `PROJECT_KEY_DEV` | secret | Private key of Zest for dev |
| `NEON_READONLY_URL` | secret | Direct connection string of the read-only role |

Keys never go in the code, the logs or the repository.

## Neon read-only role

Run it once as the database owner, after the migrations created the tables:

```sql
CREATE ROLE kpi_reader LOGIN PASSWORD '<generate one>';
GRANT CONNECT ON DATABASE "ZestDB" TO kpi_reader;
GRANT USAGE ON SCHEMA public TO kpi_reader;
GRANT SELECT ON users, collections, collection_recipes TO kpi_reader;
```

Neon suspends the database after 5 idle minutes: the first connection can be
slow, which is why the connection timeout is 30 s and each KPI is retried.

## If a day is missing

1. Open the public compliance panel or "Mi equipo" and check which KPIs of the
   day are missing.
2. Open **Actions**, then **KPI report**, then **Run workflow** (env `prod`).
   Resending is safe: it only inserts what is missing.
3. If it keeps failing, read the run log. A 400, 401, 403 or 409 means a wrong
   key, environment or catalog and is not retried.

The platform counts the day a row is received, not the `date` field.
