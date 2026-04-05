# ListingPilot AI — Technical Architecture

## System Overview (ASCII)

```
                                    ┌─────────────────────────────────────┐
                                    │           End Users (Browser)        │
                                    └──────────────────┬──────────────────┘
                                                       │ HTTPS
                                    ┌──────────────────▼──────────────────┐
                                    │   Next.js 15 + TS + Tailwind +      │
                                    │   shadcn/ui (Vercel or static CDN)   │
                                    └──────────────────┬──────────────────┘
                                                       │ REST / SSE
                    ┌──────────────────────────────────┼──────────────────────────────────┐
                    │                    API Gateway / BFF (optional)                      │
                    └──────────────────────────────────┬──────────────────────────────────┘
                                                       │
                    ┌──────────────────────────────────▼──────────────────────────────────┐
                    │                     NestJS Application                             │
                    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
                    │  │   Auth &    │ │  Ingestion  │ │  Products & │ │  Listings &   │  │
                    │  │   Tenancy   │ │   Module    │ │   Truth     │ │  Packages     │  │
                    │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └───────┬───────┘  │
                    │         │               │               │                 │          │
                    │  ┌──────▼───────────────▼───────────────▼─────────────────▼──────┐   │
                    │  │              AI Orchestration & Confidence Service             │   │
                    │  └───────────────────────────────┬─────────────────────────────────┘   │
                    │                                  │                                     │
                    │  ┌───────────────┐ ┌─────────────▼─────────────┐ ┌──────────────────┐   │
                    │  │  Validation   │ │  Publish & Channel       │ │ Monitor &        │   │
                    │  │  Engine       │ │  Adapters                │ │ Remediation      │   │
                    │  └───────────────┘ └─────────────┬─────────────┘ └────────┬─────────┘   │
                    │                                  │                        │             │
                    │  ┌───────────────────────────────▼────────────────────────▼─────────┐   │
                    │  │                     Workers (BullMQ)                            │   │
                    │  └───────────────────────────────┬──────────────────────────────────┘   │
                    └──────────────────────────────────┼──────────────────────────────────────┘
                                                       │
         ┌─────────────────────┬───────────────────────┼───────────────────────┬─────────────────────┐
         │                     │                       │                       │                     │
         ▼                     ▼                       ▼                       ▼                     ▼
   ┌───────────┐       ┌───────────────┐       ┌───────────────┐       ┌──────────────┐    ┌─────────────┐
   │ Postgres  │       │ Redis         │       │ S3-compatible │       │ LLM /        │    │ Channel     │
   │ (primary) │       │ cache + queue │       │ object store  │       │ Embeddings   │    │ APIs        │
   └───────────┘       └───────────────┘       └───────────────┘       └──────────────┘    └─────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | NestJS, TypeScript |
| **Database** | PostgreSQL (primary transactional store) |
| **Queues** | Redis + BullMQ (job processing, delayed jobs, rate limiting) |
| **Object storage** | S3-compatible (AWS S3, MinIO, GCS with S3 interop, R2) |
| **Auth** | Multi-tenant auth with JWT (access/refresh) or session cookies; OAuth for channel connections where applicable |
| **RBAC** | Role-based access control at org scope |

---

## Service Architecture (Modular NestJS)

| Module | Responsibility |
|--------|------------------|
| **AuthModule** | Login, signup, token issuance, password flows, OAuth callbacks for channel linking |
| **TenancyModule** | Org resolution from JWT claims, request-scoped `organizationId`, tenant guards |
| **UsersModule** | User profiles, org membership |
| **RbacModule** | Roles, permissions, role assignment, policy enforcement |
| **ChannelsModule** | Channel account CRUD, encrypted credentials, health |
| **IngestionModule** | Upload URLs, `ingestion_jobs`, source asset registration |
| **ParsingModule** | File parsers (CSV, XLSX, JSON, XML subsets), chunking |
| **ProductsModule** | Products, variants, attributes, canonical truth APIs |
| **EvidenceModule** | Evidence records, provenance, retrieval for UI |
| **AiModule** | LLM calls, prompt templates, model routing, embedding calls |
| **ExtractionModule** | Orchestrates extraction jobs, merges model output with rules |
| **TaxonomyModule** | Taxonomy nodes, channel mappings |
| **PackagesModule** | Channel listing package generation, versioning |
| **ValidationModule** | Validation runs, findings, severity |
| **PublishModule** | Publish jobs, channel adapters, idempotency keys |
| **MonitoringModule** | Monitors, schedules, ingest of channel status |
| **RemediationModule** | Recommendations, ranking, user actions |
| **WorkflowModule** | Optional state machines for review/approval |
| **AuditModule** | Immutable audit log writes, exports |
| **AnalyticsModule** | Aggregates, dashboards API |
| **BillingModule** | (V2+) Subscription state, usage meters |
| **HealthModule** | Liveness/readiness, queue depth metrics |

Cross-cutting: **global validation pipe**, **exception filters**, **structured logging**, **OpenTelemetry** (recommended for traces).

---

## Data Flow — Ingestion Pipeline

```
1. Client requests presigned upload URL → uploads file to S3.
2. IngestionModule creates ingestion_job (status: pending) + source_asset rows.
3. Parsing job (BullMQ): detect format → normalize rows → store parsed artifacts (S3 JSON) → job: parsed.
4. Extraction job: for each product/row cluster → call AI pipeline → write attributes, attribute_values, evidences, predictions.
5. Confidence job: compute per-field confidence + listing quality score → update predictions + flags for review queue.
6. Notification (SSE/email): “ready for review” with counts of uncertain fields.
```

**Idempotency:** Ingestion jobs keyed by `(organization_id, content_hash)` optional deduplication; asset versioning for re-runs.

---

## AI / ML Pipeline Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│ Source text /   │────▶│ Chunking &       │────▶│ Retrieval (optional):   │
│ tables / images │     │ normalization    │     │ embeddings + source     │
└─────────────────┘     └──────────────────┘     │ snippets                  │
                                                    └───────────┬─────────────┘
                                                                │
┌─────────────────┐     ┌──────────────────┐                    ▼
│ Schema /        │────▶│ Prompt + tools   │     ┌─────────────────────────┐
│ channel hints   │     │ (structured      │────▶│ LLM: extract + cite      │
└─────────────────┘     │  output)         │     │ evidence spans           │
                        └──────────────────┘     └───────────┬─────────────┘
                                                                │
                                                                ▼
                        ┌──────────────────────────────────────────────┐
                        │ Merge & reconcile: rules + cross-source agree  │
                        └───────────────────────────┬──────────────────┘
                                                    ▼
                        ┌──────────────────────────────────────────────┐
                        │ Predictions + confidence factors persisted   │
                        └──────────────────────────────────────────────┘
```

- **Model routing:** Smaller/faster models for bulk; higher-capability models for conflict resolution or sparse categories.  
- **Safety:** PII redaction options; org-level retention policies for prompts and raw outputs (configurable).

---

## Queue / Job Design

| Queue (conceptual) | Job types | Notes |
|--------------------|-----------|--------|
| **parsing** | `parse_csv`, `parse_xlsx`, `parse_json` | CPU-bound; horizontal workers |
| **extraction** | `extract_product`, `extract_variant`, `reextract_field` | LLM rate limits; concurrency per org |
| **validation** | `validate_package`, `validate_bulk` | Rule engine + channel validators |
| **monitoring** | `poll_channel_listing`, `sync_status`, `detect_anomaly` | Scheduled; backoff on 429/5xx |
| **publish** | `publish_listing`, `update_listing`, `withdraw_listing` | Strict idempotency; dead-letter queue |
| **notifications** | `notify_review_ready`, `notify_remediation` | Decoupled from core path |

**BullMQ patterns:** Named jobs, retry with exponential backoff, stalled job recovery, priority queues for Pro/Team tiers.

---

## Confidence Scoring Logic

### Attribute confidence

Composite score in `[0,1]` (stored with components for auditability):

| Factor | Description |
|--------|-------------|
| **Model confidence** | Calibrated probability or token-level certainty aggregates from the extraction model |
| **Source quality** | Trust weight of origin (e.g., verified feed > scraped page > OCR) |
| **Cross-source agreement** | Agreement across multiple independent sources boosts score; conflict reduces it |
| **Schema compatibility** | Value passes type, length, enum, unit normalization for target attribute |
| **Prior confirmations** | User/org previously confirmed same value for similar SKU → prior boost (decays over time) |

Typical fusion: weighted harmonic or learned linear layer **per category family** (configurable).

### Listing quality score

Aggregate over required/recommended fields for a channel:

- Weighted by channel **importance** (required >> recommended >> optional)  
- Penalize missing high-impact SEO fields (title length, bullet coverage)  
- Output: `0–100` with sub-scores exposed in UI

### Remediation impact score

For each recommendation:

- **Severity** of issue (suppression > warning > opportunity)  
- **Estimated revenue/at-risk** proxy (visibility, buyability flags)  
- **Effort** to apply (single field vs re-ingestion)  
- Ranked score for triage dashboards

---

## Validation Engine Design

- **Layers:** (1) Schema validation (types, lengths), (2) channel rule packs (marketplace-specific), (3) org custom rules (future).  
- **Outputs:** `blocking` vs `warning` vs `info`; each with machine-readable `code`, human message, and pointer to field path.  
- **Execution:** Synchronous for single package API; async jobs for bulk with downloadable report.  
- **Versioning:** Rule packs versioned; validations reference `rule_pack_version` for reproducibility.

---

## Monitoring / Remediation Engine Design

- **Inputs:** Channel APIs, reports, webhooks (where available), scheduled polls.  
- **Normalization:** Map external statuses to internal `ListingHealthState`.  
- **Correlation:** Link issues to `listing_package` revision + attribute paths when possible.  
- **Remediation:** Template library per issue code (e.g., “title exceeds max length” → suggest truncation strategy + revalidation).  
- **Feedback loop:** User accepts/dismisses recommendation → trains prior confirmations and model feedback (privacy-preserving aggregation).

---

## RBAC Model

| Role | Capabilities (typical) |
|------|-------------------------|
| **Org owner** | Billing (V2+), delete org, transfer ownership, all below |
| **Admin** | Manage users/roles, channel accounts, org settings, all data operations |
| **Editor** | Create/edit products, packages, run publish (if allowed), resolve remediations |
| **Viewer** | Read-only: dashboards, audit, packages; no publish or secrets |

Enforcement: **NestJS guards** + **policy decorators** on controllers; optional **row-level** rules for sensitive actions (e.g., publish requires `editor+`).

---

## Multi-Tenancy Design

- **Isolation model:** Shared application, **shared database**, **organization_id** on all tenant tables (see `DATABASE_SCHEMA.md`).  
- **Request path:** JWT includes `sub` (user) + `org_id` + `role`; middleware validates membership.  
- **Storage:** S3 prefixes per `org_id`; presigned URLs scoped and short-lived.  
- **Queues:** Job payload always includes `organization_id`; workers enforce scoping before DB writes.

Optional future: dedicated DB for enterprise (not required for V1 architecture doc).

---

## Event Tracking Plan

| Event category | Examples | Purpose |
|----------------|----------|---------|
| **Product** | `ingestion_started`, `ingestion_completed`, `truth_review_opened`, `field_confirmed` | Funnel & time-to-publish |
| **Quality** | `validation_failed`, `validation_passed`, `completeness_score_computed` | Engine tuning |
| **Publish** | `publish_requested`, `publish_succeeded`, `publish_failed` | Reliability metrics |
| **Monitor** | `suppression_detected`, `remediation_suggested`, `remediation_applied` | Post-publish value |
| **Admin** | `user_invited`, `role_changed`, `channel_connected` | Security audit & onboarding |

Delivery: **server-side events** to analytics pipeline (e.g., Segment-compatible, or warehouse ETL); **PII minimization** in event payloads.

---

## Security Architecture

| Area | Approach |
|------|----------|
| **Transport** | TLS everywhere; HSTS on frontend |
| **Auth** | Short-lived access tokens; refresh rotation; optional MFA (V2+) |
| **Secrets** | Channel credentials encrypted at rest (KMS); never returned in APIs |
| **Input** | File size/type limits; virus scanning hook (optional); SSRF protection on URL ingestion |
| **Output** | Org-scoped authorization on every query |
| **Audit** | Tamper-evident audit log for admin and publish actions |
| **Dependency** | Automated scanning in CI; pinned versions |
| **Data residency** | Configurable region for S3/DB (enterprise roadmap) |

---

## v2 Architecture Updates

### New Backend Modules
- **VisionModule** — Image analysis, background removal, per-channel image compliance
- **ComplianceModule** — Per-channel compliance engine, GTIN validation, Etsy AI disclosure, policy caching
- **CategoryModule** — Channel-specific category mapping, eBay item specifics
- **AdaptationModule** — Per-channel listing adaptation (replaces generic generation)
- **BulkOpsModule** — Bulk publish/relist/delist/category remap with SSE progress
- **SemanticDedupModule** — Qdrant-based duplicate detection on ingestion

### New Infrastructure
- **Qdrant** — Vector store for semantic duplicate detection (port 6333)
- **Worker Process** — Dedicated BullMQ worker decoupled from API (port 4001)

### New Shared Packages
- **@listingpilot/ml-utils** — Image processing, confidence math, evidence scoring, GTIN validation

### Database Changes
New models: ImageAsset, CategoryMapping, ComplianceCheck, GtinRecord, ChannelPolicy, BulkOperation, BulkOperationItem.
Updated models: Attribute (gtinValidated, channelSpecificOverrides), ListingPackage (compliance gate, adaptation notes, search/backend keywords).

---

*Document version: 1.0 — ListingPilot AI architecture.*
