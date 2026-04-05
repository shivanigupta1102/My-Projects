# ListingPilot AI — Deployment Guide

This document describes **local development** with Docker Compose, **environment configuration**, **frontend hosting on Vercel**, **backend on AWS or GCP**, **database migrations**, and **CI/CD**.

---

## Architecture Summary for Deployment

| Component | Suggested hosting |
|-----------|-------------------|
| **Frontend** | Vercel (Next.js 15) |
| **API** | AWS ECS Fargate / EKS, or GCP Cloud Run / GKE |
| **Workers** | Same cluster as API with separate service (BullMQ consumers) |
| **Postgres** | AWS RDS, or GCP Cloud SQL |
| **Redis** | AWS ElastiCache, or GCP Memorystore |
| **Object storage** | AWS S3, GCS (S3 API), or Cloudflare R2 |

---

## Local Development — Docker Compose

### Example `docker-compose.yml` (reference)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: listingpilot
      POSTGRES_PASSWORD: listingpilot
      POSTGRES_DB: listingpilot
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U listingpilot"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio12345
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "4000:4000"

volumes:
  pgdata:
  miniodata:
```

### Local workflow

1. Copy `.env.example` → `.env` and fill values (see below). Also copy to `apps/api/.env`.  
2. `docker compose up -d` (starts PostgreSQL, Redis, MinIO, MailHog).  
3. `npm install` at the repo root.  
4. `make db` to run Prisma migrations and generate the client.  
5. `make dev` to start API + web dev servers (or `npm run dev` at root).

---

## Environment Variables Reference

### Shared / API (`apps/api`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` \| `production` |
| `PORT` | No | API listen port (default `4000`) |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `REDIS_HOST` | No | Redis hostname (default `127.0.0.1`) |
| `REDIS_PORT` | No | Redis port (default `6379`) |
| `REDIS_PASSWORD` | No | Redis password (empty for local) |
| `REDIS_TLS` | No | `true` for TLS connections |
| `BULL_PREFIX` | No | BullMQ key prefix (default `listingpilot`) |
| `JWT_ACCESS_SECRET` | Yes | Strong secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Strong secret for refresh tokens |
| `JWT_ACCESS_EXPIRES_SEC` | No | Access token TTL in seconds (default `900`) |
| `JWT_REFRESH_EXPIRES_SEC` | No | Refresh token TTL in seconds (default `604800`) |
| `S3_ENDPOINT` | No | For MinIO: `http://localhost:9000` |
| `S3_REGION` | No | e.g. `us-east-1` (default `us-east-1`) |
| `S3_BUCKET` | No | Asset bucket name (default `listingpilot-local`) |
| `S3_ACCESS_KEY_ID` | Yes | S3/MinIO access key |
| `S3_SECRET_ACCESS_KEY` | Yes | S3/MinIO secret key |
| `S3_FORCE_PATH_STYLE` | No | `true` for MinIO |
| `S3_PUBLIC_BASE_URL` | No | Public URL prefix for assets |
| `GROQ_API_KEY` | No | Groq API key (free at https://console.groq.com/keys). Falls back to built-in demo key |
| `OPENROUTER_BASE_URL` | No | LLM API base URL (default `https://api.groq.com/openai/v1`) |
| `OPENROUTER_MODEL` | No | Model name (default `meta-llama/llama-4-scout-17b-16e-instruct`) |
| `AI_MAX_RETRIES` | No | Max retries (default `3`) |
| `AI_MAX_TOKENS` | No | Max tokens (default `4096`) |
| `CORS_ORIGIN` | No | Frontend origin(s), comma-separated (default: allow all) |

### Frontend (`apps/web`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | No | Public API base URL (default `http://localhost:4000/api/v1`) |

**Never** prefix server-only secrets with `NEXT_PUBLIC_`.

---

## Vercel — Frontend Deployment

1. Connect Git repository to Vercel; set **root directory** to `apps/web` if monorepo.  
2. **Framework preset:** Next.js.  
3. **Environment variables:** Add `NEXT_PUBLIC_*` for each environment (Preview vs Production).  
4. **Build command:** `pnpm install && pnpm build` (or Turborepo filter).  
5. **Output:** Next.js default.  
6. **Edge/Node:** Prefer Node runtime for server actions that call internal APIs; document any Edge limitations.  
7. **Security headers:** Configure `headers()` in `next.config` for CSP, HSTS (production), `X-Frame-Options`.

**Preview deployments:** Map to staging API URL via Vercel env per branch.

---

## AWS — Backend & Workers

### Recommended pattern

- **ECS Fargate** services: `api` (horizontally scaled), `worker` (queue consumers, may scale on queue depth).  
- **Application Load Balancer** → `api` service only.  
- **RDS PostgreSQL** with Multi-AZ (production).  
- **ElastastiCache Redis** for BullMQ.  
- **S3** for uploads; **KMS** for encrypting channel credentials at rest.  
- **Secrets Manager** for API keys and DB credentials; injected as task secrets.

### Scaling

- API: CPU/memory autoscaling on latency / CPU.  
- Worker: scale on **Redis queue length** (custom CloudWatch metric via periodic publish or Lambda).

### Networking

- Private subnets for RDS, Redis, tasks.  
- NAT for outbound (LLM APIs, channel APIs).  
- Security groups: only ALB → API; API/Worker → RDS/Redis; Worker → S3.

---

## GCP — Backend & Workers

### Recommended pattern

- **Cloud Run** for `api` (request-based scaling; set minimum instances to at least 1 for steady latency).  
- **Cloud Run job** or second service for **workers** (or GKE if complex co-scheduling).  
- **Cloud SQL (Postgres)** with private IP + connector.  
- **Memorystore (Redis)** VPC-attached.  
- **GCS** with S3 interoperability if using S3 SDK uniformly, or native GCS client.  
- **Secret Manager** for secrets.

---

## Database Migration Strategy

| Tool | Usage |
|------|--------|
| **Prisma Migrate**, **TypeORM migrations**, or **Flyway** | Choose one; never mix ad-hoc SQL in prod |

### Workflow

1. **Development:** migrations committed to repo; applied locally via CLI.  
2. **Staging:** CI applies migrations on deploy **before** new app version serves traffic (or backward-compatible two-phase).  
3. **Production:**  
   - **Expand-contract** for zero-downtime: add nullable columns first → deploy app that writes both → backfill → deploy reader of new → remove old.  
   - **Locks:** avoid long `ALTER` on huge tables without `CONCURRENTLY` for indexes (Postgres).

### Backup & restore

- **RDS:** automated backups + PITR; test restore quarterly.  
- **Cloud SQL:** same.

---

## CI/CD Pipeline Design

### Stages

```
Lint & typecheck → Unit tests → Build → Integration tests (optional) → Security scan → Deploy staging → Smoke tests → Manual approval → Deploy production
```

### GitHub Actions (illustrative)

| Job | Steps |
|-----|--------|
| `ci` | `npm ci`, `npm run lint`, `npm run test`, `npm run build` |
| `docker` | Build and push `api` and `worker` images to ECR/Artifact Registry with tag `git sha` |
| `migrate-staging` | Run migration container against staging DB |
| `deploy-staging` | Update ECS service / Cloud Run revision |
| `smoke` | Hit `/health/ready`, one authenticated API path |
| `deploy-prod` | Protected environment; same as staging with approval gate |

### Conventions

- **Immutable artifacts:** container image per commit.  
- **Infra as code:** Terraform or Pulumi for RDS, Redis, buckets, IAM.  
- **Secrets:** never in Git; CI OIDC to cloud for deploy roles.

---

## Observability

| Signal | Tooling |
|--------|---------|
| **Logs** | JSON structured logs → CloudWatch / Cloud Logging |
| **Metrics** | Request latency, queue depth, job failures, LLM error rate |
| **Traces** | OpenTelemetry export to vendor or self-hosted |
| **Alerts** | Pager on `/health/ready` failure, error rate spike, DB connections maxed |

---

## Rollback

- **API/Worker:** Revert to previous ECS task definition or Cloud Run revision (images tagged by SHA).  
- **Migrations:** Prefer forward fixes; keep backward-compatible migrations for at least one release to allow fast rollback.

---

*Document version: 1.0 — ListingPilot AI deployment.*
