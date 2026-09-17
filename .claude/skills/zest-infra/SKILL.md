---
name: zest-infra
description: Zest infrastructure (Docker, docker-compose, Terraform, EC2, RDS, S3, nginx, TLS). Use when writing Dockerfiles, changing AWS infra, configuring the image bucket, handling infra secrets, or deploying.
---

# Zest infra

Full rules: `support/skills/infra.md`. Decision context:
`support/docs/tech-stack.md`.

## Current decision
Option A: a single EC2 instance running `docker compose` (nginx with TLS, a
frontend container and a backend container), PostgreSQL on RDS in a private
subnet, S3 for images. Do **not** switch to the PaaS alternative (Vercel + App
Runner) without checking first — it is a deliberate, documented tradeoff.

## Non-negotiable
- One `Dockerfile` per service, multi-stage, so the final image ships no dev
  dependencies.
- Infra changes go through Terraform, not the AWS console. Always run
  `terraform plan` and read the diff before `apply`, especially for RDS or
  security groups.
- Secrets go through a secrets mechanism or `.tfvars` kept out of git. Never
  hardcoded in `.tf` files.
- One S3 bucket per environment (`zest-images-dev`, `zest-images-prod`). The
  backend only hands out pre-signed URLs and never proxies bytes. Block public
  writes.
- `.env.example` goes to git with placeholders; real `.env` files never do.
- HTTPS via Let's Encrypt, auto-renewed. Do not disable TLS or fall back to plain
  HTTP, not even for quick testing.
