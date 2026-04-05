# ListingPilot AI — Database Schema

> **Note:** This document describes the **target / aspirational** database design. The **current implementation** uses Prisma ORM with the schema defined in `apps/api/prisma/schema.prisma`. Some entities below (e.g. `organization_users`, `taxonomy_nodes`, `predictions`, `workflows`) are planned for future phases and do not yet exist in the Prisma schema. Refer to the Prisma schema as the authoritative source for the running application.

**DBMS:** PostgreSQL 16+  
**Conventions:** `snake_case`; timestamps in UTC (`timestamptz`); UUID primary keys (`uuid`); soft delete via `deleted_at` where noted.

---

## Multi-Tenancy Isolation Strategy

- Every tenant-owned table includes **`organization_id uuid NOT NULL`** referencing `organizations(id)`.
- **Application layer:** All queries MUST filter by `organization_id` from authenticated context. NestJS guards inject org scope.
- **Database layer (recommended):** PostgreSQL **Row Level Security (RLS)** policies per table enforcing `organization_id = current_setting('app.current_org_id')::uuid` set per request in a transaction (defense in depth).
- **Indexes:** Leading column `organization_id` on large tables for partition-friendly access patterns (optional future: partition by org for very large tenants).

---

## Entity Relationship Diagram (ASCII)

```
organizations ─────┬──────────────────────────────────────────────────────────────
       │             │
       │             ├── users (membership via organization_users)
       │             ├── channel_accounts
       │             ├── ingestion_jobs ─── source_assets
       │             ├── products ─── variants ─── attribute_values ─── evidences
       │             │                    │
       │             │                    └── attributes (per org/product/variant scope)
       │             ├── taxonomy_nodes
       │             ├── channel_taxonomy_mappings
       │             ├── listing_packages ─── validations
       │             ├── workflows
       │             ├── publish_events
       │             ├── monitors ─── remediation_recommendations
       │             └── audit_logs

predictions ──(link to attribute_values or packages depending on implementation)
```

---

## Entities (20+)

### 1. `organizations`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK**, default `gen_random_uuid()` |
| `name` | `varchar(255)` | Display name |
| `slug` | `varchar(64)` | Unique, URL-safe |
| `plan` | `varchar(32)` | e.g. `trial`, `growth`, `pro`, `team` |
| `settings` | `jsonb` | Feature flags, thresholds |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Trigger-maintained |
| `deleted_at` | `timestamptz` | **Soft delete**; null = active |

**Indexes:** `UNIQUE(slug) WHERE deleted_at IS NULL` (partial unique)

---

### 2. `users`

Global user identity (can belong to multiple orgs in V2+).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `email` | `citext` | Unique |
| `password_hash` | `varchar` | Nullable if OAuth-only |
| `name` | `varchar(255)` | |
| `email_verified_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

**Indexes:** `UNIQUE(email) WHERE deleted_at IS NULL`

---

### 3. `organization_users` (membership + role)

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** → `organizations(id)` |
| `user_id` | `uuid` | **FK** → `users(id)` |
| `role` | `varchar(32)` | `owner`, `admin`, `editor`, `viewer` |
| `status` | `varchar(32)` | `active`, `invited`, `suspended` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `UNIQUE(organization_id, user_id)`; `INDEX(organization_id)`; `INDEX(user_id)`

---

### 4. `roles` (optional catalog table)

If roles are data-driven; else enforce via enum in app. Example as reference table:

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `key` | `varchar(32)` | `owner`, `admin`, `editor`, `viewer` |
| `description` | `text` | |

**Indexes:** `UNIQUE(key)`

---

### 5. `channel_accounts`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** → `organizations` |
| `channel` | `varchar(32)` | `amazon`, `ebay`, `walmart`, `shopify`, `etsy` |
| `display_name` | `varchar(255)` | |
| `credentials_encrypted` | `bytea` or `text` | Encrypted blob / KMS reference |
| `status` | `varchar(32)` | `connected`, `error`, `revoked`, `pending` |
| `external_account_id` | `varchar(255)` | Opaque channel id |
| `metadata` | `jsonb` | Marketplace-specific |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

**Indexes:** `INDEX(organization_id, channel)`

---

### 6. `ingestion_jobs`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `created_by_user_id` | `uuid` | **FK** → `users` |
| `name` | `varchar(255)` | |
| `status` | `varchar(32)` | `pending`, `parsing`, `parsed`, `extracting`, `completed`, `failed`, `cancelled` |
| `source_type` | `varchar(32)` | `csv`, `xlsx`, `json`, `url_set` |
| `content_hash` | `varchar(64)` | Optional dedupe |
| `error_code` | `varchar(64)` | |
| `error_message` | `text` | Sanitized |
| `stats` | `jsonb` | Row counts, success/fail |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, status, created_at DESC)`

---

### 7. `source_assets`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `ingestion_job_id` | `uuid` | **FK** → `ingestion_jobs` |
| `storage_key` | `varchar(512)` | S3 key |
| `mime_type` | `varchar(128)` | |
| `byte_size` | `bigint` | |
| `checksum` | `varchar(128)` | |
| `status` | `varchar(32)` | `uploaded`, `processed`, `failed` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, ingestion_job_id)`

---

### 8. `products`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `ingestion_job_id` | `uuid` | Nullable **FK** |
| `sku` | `varchar(128)` | Unique per org |
| `title` | `text` | Canonical working title |
| `status` | `varchar(32)` | `draft`, `in_review`, `ready`, `published`, `archived` |
| `taxonomy_node_id` | `uuid` | Nullable **FK** → `taxonomy_nodes` |
| `metadata` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

**Indexes:** `UNIQUE(organization_id, sku) WHERE deleted_at IS NULL`; `INDEX(organization_id, status)`

---

### 9. `variants`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `product_id` | `uuid` | **FK** → `products` |
| `variant_sku` | `varchar(128)` | Unique per product |
| `barcode` | `varchar(64)` | Nullable |
| `status` | `varchar(32)` | Same vocabulary as product or subset |
| `metadata` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

**Indexes:** `UNIQUE(organization_id, product_id, variant_sku) WHERE deleted_at IS NULL`

---

### 10. `attributes`

Attribute definitions (global or org-specific).

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | Nullable if global catalog |
| `key` | `varchar(128)` | e.g. `brand`, `weight_lb` |
| `data_type` | `varchar(32)` | `string`, `number`, `boolean`, `enum` |
| `schema` | `jsonb` | Enum values, min/max |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, key)`

---

### 11. `attribute_values`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `attribute_id` | `uuid` | **FK** → `attributes` |
| `product_id` | `uuid` | Nullable **FK** |
| `variant_id` | `uuid` | Nullable **FK** |
| `value` | `jsonb` | Normalized value |
| `locale` | `varchar(16)` | Default `en-US` |
| `source` | `varchar(32)` | `extraction`, `user`, `import` |
| `status` | `varchar(32)` | `proposed`, `confirmed`, `rejected` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, product_id)`; `INDEX(organization_id, variant_id)`; `INDEX(organization_id, status)`

---

### 12. `evidences`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `attribute_value_id` | `uuid` | **FK** → `attribute_values` |
| `source_asset_id` | `uuid` | Nullable **FK** → `source_assets` |
| `snippet` | `text` | Quoted text |
| `span_start` | `int` | Optional char offset |
| `span_end` | `int` | |
| `confidence` | `numeric(5,4)` | Evidence-level score |
| `metadata` | `jsonb` | Model run id, page number |
| `created_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, attribute_value_id)`

---

### 13. `predictions`

Model outputs and decomposed confidence factors.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `target_type` | `varchar(32)` | `attribute_value`, `listing_package` |
| `target_id` | `uuid` | Polymorphic |
| `model_id` | `varchar(64)` | |
| `raw_output` | `jsonb` | |
| `confidence` | `numeric(5,4)` | Final |
| `factors` | `jsonb` | model, source_quality, agreement, schema, prior |
| `status` | `varchar(32)` | `active`, `superseded` |
| `created_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, target_type, target_id)`; `INDEX(organization_id, status)`

---

### 14. `taxonomy_nodes`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | Nullable for global tree |
| `parent_id` | `uuid` | Nullable self-**FK** |
| `name` | `varchar(255)` | |
| `path` | `ltree` or `text` | Materialized path optional |
| `metadata` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, parent_id)`

---

### 15. `channel_taxonomy_mappings`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `channel` | `varchar(32)` | |
| `taxonomy_node_id` | `uuid` | **FK** → `taxonomy_nodes` |
| `external_id` | `varchar(128)` | Channel category id |
| `metadata` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `UNIQUE(organization_id, channel, taxonomy_node_id)`

---

### 16. `listing_packages`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `product_id` | `uuid` | **FK** |
| `variant_id` | `uuid` | Nullable **FK** |
| `channel` | `varchar(32)` | |
| `revision` | `int` | Monotonic per product/variant/channel |
| `payload` | `jsonb` | Channel listing payload |
| `status` | `varchar(32)` | `draft`, `validated`, `ready`, `published` |
| `quality_score` | `numeric(5,2)` | 0–100 |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, product_id, channel)`; `INDEX(organization_id, status)`

---

### 17. `validations`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `listing_package_id` | `uuid` | **FK** → `listing_packages` |
| `rule_pack_version` | `varchar(32)` | |
| `status` | `varchar(32)` | `passed`, `failed`, `warning` |
| `findings` | `jsonb` | Array of structured issues |
| `created_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, listing_package_id, created_at DESC)`

---

### 18. `workflows`

Optional review/approval state machines.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `entity_type` | `varchar(32)` | `product`, `listing_package` |
| `entity_id` | `uuid` | |
| `state` | `varchar(64)` | |
| `definition_version` | `varchar(32)` | |
| `context` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, entity_type, entity_id)`

---

### 19. `publish_events`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `listing_package_id` | `uuid` | **FK** |
| `channel_account_id` | `uuid` | Nullable **FK** |
| `operation` | `varchar(32)` | `create`, `update`, `delete` |
| `status` | `varchar(32)` | `requested`, `succeeded`, `failed` |
| `external_listing_id` | `varchar(255)` | |
| `request_payload` | `jsonb` | Redacted |
| `response_payload` | `jsonb` | Redacted |
| `error_code` | `varchar(64)` | |
| `idempotency_key` | `varchar(128)` | |
| `created_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, created_at DESC)`; `UNIQUE(organization_id, idempotency_key)`

---

### 20. `monitors`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `listing_package_id` | `uuid` | **FK** |
| `channel_account_id` | `uuid` | **FK** |
| `schedule_cron` | `varchar(64)` | |
| `status` | `varchar(32)` | `active`, `paused`, `error` |
| `last_checked_at` | `timestamptz` | |
| `last_health` | `jsonb` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, status)`

---

### 21. `remediation_recommendations`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `monitor_id` | `uuid` | Nullable **FK** |
| `listing_package_id` | `uuid` | **FK** |
| `issue_code` | `varchar(64)` | |
| `severity` | `varchar(32)` | |
| `impact_score` | `numeric(10,4)` | |
| `suggestion` | `jsonb` | Structured fix |
| `status` | `varchar(32)` | `open`, `accepted`, `dismissed`, `applied` |
| `resolution_note` | `text` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Indexes:** `INDEX(organization_id, status, impact_score DESC)`

---

### 22. `audit_logs`

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` | **PK** |
| `organization_id` | `uuid` | **FK** |
| `actor_user_id` | `uuid` | Nullable **FK** |
| `action` | `varchar(64)` | |
| `resource_type` | `varchar(64)` | |
| `resource_id` | `uuid` | Nullable |
| `payload` | `jsonb` | Diff/snapshot |
| `ip_address` | `inet` | Optional |
| `created_at` | `timestamptz` | Immutable |

**Indexes:** `INDEX(organization_id, created_at DESC)`; `INDEX(organization_id, resource_type, resource_id)`

**Soft delete:** Not applicable — append-only.

---

## Status Fields — Summary

| Entity | Status-like fields |
|--------|--------------------|
| `organization_users` | `status` |
| `channel_accounts` | `status` |
| `ingestion_jobs` | `status` |
| `source_assets` | `status` |
| `products` | `status` |
| `variants` | `status` |
| `attribute_values` | `status` |
| `predictions` | `status` |
| `listing_packages` | `status` |
| `validations` | `status` |
| `publish_events` | `status` |
| `monitors` | `status` |
| `remediation_recommendations` | `status` |

---

## Timestamps

| Pattern | Tables |
|---------|--------|
| `created_at`, `updated_at` | Most mutable entities; maintain `updated_at` via trigger or app layer |
| `deleted_at` | `organizations`, `users`, `channel_accounts`, `products`, `variants` |

---

## Foreign Key Summary

- All `organization_id` → `organizations(id)` **ON DELETE CASCADE** (or RESTRICT for audit-heavy choice; document org delete policy).
- `organization_users` → `users`, `organizations`
- `ingestion_jobs` → `users` (created_by)
- `source_assets` → `ingestion_jobs`
- `variants` → `products`
- `attribute_values` → `attributes`, optional `products`/`variants`
- `evidences` → `attribute_values`, optional `source_assets`
- `listing_packages` → `products`, optional `variants`
- `validations` → `listing_packages`
- `publish_events` → `listing_packages`, optional `channel_accounts`
- `monitors` → `listing_packages`, `channel_accounts`
- `remediation_recommendations` → `listing_packages`, optional `monitors`

---

*Document version: 1.0 — ListingPilot AI database schema.*
