# ListingPilot AI — API Contract

**Base URL:** `https://api.listingpilot.ai/v1` (illustrative)  
**Format:** JSON (`application/json`)  
**Auth:** `Authorization: Bearer <access_token>`  
**Multi-tenancy:** `X-Organization-Id: <uuid>` **required** on all tenant-scoped routes (or embedded in token claims; document single approach per deployment).

---

## Conventions

### Pagination

| Query param | Description |
|-------------|-------------|
| `page` | 1-based page index (default `1`) |
| `page_size` | Max items per page (default `20`, max `100`) |

**Response envelope:**

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total_items": 135,
    "total_pages": 7
  }
}
```

### Filtering & sorting

| Pattern | Example |
|---------|---------|
| Equality | `?status=ready` |
| Multi-value | `?channel=amazon&channel=ebay` |
| Range | `?created_after=2026-01-01T00:00:00Z&created_before=2026-02-01T00:00:00Z` |
| Sort | `?sort=created_at:desc,sku:asc` |

### Error handling

**Problem Details** (RFC 7807-style):

```json
{
  "type": "https://api.listingpilot.ai/errors/validation_error",
  "title": "Validation Error",
  "status": 422,
  "detail": "sku is required",
  "instance": "01JQXXXX",
  "errors": [
    { "field": "sku", "code": "required", "message": "must not be blank" }
  ]
}
```

| HTTP status | Meaning |
|-------------|---------|
| `400` | Malformed request |
| `401` | Missing/invalid auth |
| `403` | Forbidden (RBAC or wrong org) |
| `404` | Resource not found (or hidden for enumeration safety) |
| `409` | Conflict (duplicate SKU, idempotency replay mismatch) |
| `422` | Semantic validation |
| `429` | Rate limited |
| `500` | Server error |

**Idempotency:** `POST` mutations that create side effects accept header `Idempotency-Key: <uuid>`; repeated requests return same `201`/`200` body.

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register user + create org |
| `POST` | `/auth/login` | Email/password → tokens |
| `POST` | `/auth/refresh` | Refresh token → new access token |
| `POST` | `/auth/logout` | Invalidate refresh token |
| `POST` | `/auth/forgot-password` | Trigger reset email |
| `POST` | `/auth/reset-password` | Complete reset with token |

### `POST /auth/register`

**Request:**

```json
{
  "email": "seller@example.com",
  "password": "••••••••",
  "name": "Alex Seller",
  "organization_name": "Acme Goods"
}
```

**Response `201`:**

```json
{
  "access_token": "eyJ…",
  "refresh_token": "eyJ…",
  "expires_in": 3600,
  "user": { "id": "uuid", "email": "seller@example.com", "name": "Alex Seller" },
  "organization": { "id": "uuid", "name": "Acme Goods", "slug": "acme-goods" }
}
```

### `POST /auth/login`

**Request:**

```json
{
  "email": "seller@example.com",
  "password": "••••••••"
}
```

**Response `200`:** Same token shape as register.

---

## Organizations & users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/organizations/current` | Current org profile |
| `PATCH` | `/organizations/current` | Update name, settings |
| `GET` | `/organizations/current/members` | List members |
| `POST` | `/organizations/current/invitations` | Invite user (V2+) |
| `DELETE` | `/organizations/current/members/:userId` | Remove member |
| `PATCH` | `/organizations/current/members/:userId` | Change role |

### `PATCH /organizations/current`

```json
{
  "name": "Acme Goods LLC",
  "settings": {
    "confidence_auto_approve_threshold": 0.92
  }
}
```

---

## File ingestion

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ingestion/uploads` | Request presigned upload |
| `POST` | `/ingestion/jobs` | Create ingestion job after upload |
| `GET` | `/ingestion/jobs` | List jobs |
| `GET` | `/ingestion/jobs/:id` | Job detail + stats |
| `POST` | `/ingestion/jobs/:id/cancel` | Cancel |
| `GET` | `/ingestion/jobs/:id/assets` | List source assets |

### `POST /ingestion/uploads`

**Request:**

```json
{
  "filename": "catalog.xlsx",
  "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "byte_size": 1048576
}
```

**Response `200`:**

```json
{
  "upload_id": "uuid",
  "storage_key": "org/uuid/uploads/uuid/catalog.xlsx",
  "upload_url": "https://s3…",
  "expires_at": "2026-03-30T12:00:00Z"
}
```

### `POST /ingestion/jobs`

```json
{
  "name": "Spring drop",
  "upload_id": "uuid",
  "source_type": "xlsx",
  "options": {
    "header_row": 1,
    "sheet": "Products"
  }
}
```

**Response `202`:**

```json
{
  "id": "uuid",
  "status": "pending"
}
```

---

## Products

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | List products |
| `POST` | `/products` | Manual create (optional) |
| `GET` | `/products/:id` | Detail |
| `PATCH` | `/products/:id` | Update |
| `DELETE` | `/products/:id` | Soft delete |
| `GET` | `/products/:id/variants` | List variants |

### `GET /products`

Query: `?status=in_review&sort=updated_at:desc&page=1&page_size=20`

**Response item:**

```json
{
  "id": "uuid",
  "sku": "SKU-001",
  "title": "Widget Pro",
  "status": "in_review",
  "taxonomy_node_id": "uuid",
  "completeness_score": 78.5,
  "updated_at": "2026-03-30T10:00:00Z"
}
```

---

## Variants & attributes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/variants/:id` | Variant detail |
| `PATCH` | `/variants/:id` | Update |
| `GET` | `/products/:productId/attribute-values` | List values |
| `PATCH` | `/attribute-values/:id` | Confirm/override |
| `POST` | `/products/:productId/re-extract` | Trigger extraction job |

### `PATCH /attribute-values/:id`

```json
{
  "value": { "string": "Blue" },
  "status": "confirmed",
  "reason": "Verified on manufacturer site"
}
```

---

## Evidence retrieval

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/attribute-values/:id/evidence` | List evidence snippets |
| `GET` | `/evidence/:id` | Single evidence record |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "snippet": "Color: Midnight Blue",
      "source_asset_id": "uuid",
      "confidence": 0.88,
      "metadata": { "page": 2 }
    }
  ]
}
```

---

## Review queue

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/review/queue` | Fields below confidence threshold |
| `POST` | `/review/bulk-confirm` | Confirm many values |

### `GET /review/queue`

Query: `?max_confidence=0.9&channel=amazon`

```json
{
  "data": [
    {
      "attribute_value_id": "uuid",
      "product_id": "uuid",
      "sku": "SKU-001",
      "field_key": "material",
      "confidence": 0.61,
      "factors": { "cross_source_agreement": 0.4 }
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total_items": 42, "total_pages": 3 }
}
```

---

## Predictions & confidence

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/predictions` | By target filter |
| `GET` | `/predictions/:id` | Detail |

Query: `?target_type=attribute_value&target_id=uuid`

---

## Package generation

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/listing-packages/generate` | Generate/regenerate packages |
| `GET` | `/listing-packages` | List |
| `GET` | `/listing-packages/:id` | Detail with payload |
| `GET` | `/products/:productId/listing-packages` | By product |

### `POST /listing-packages/generate`

```json
{
  "product_id": "uuid",
  "variant_id": null,
  "channels": ["amazon", "ebay"],
  "regenerate": true
}
```

**Response `202`:** job ids + package ids stub.

---

## Validations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/validations/run` | Run validation on package(s) |
| `GET` | `/validations/:id` | Result |
| `GET` | `/listing-packages/:id/validations` | History |

### `POST /validations/run`

```json
{
  "listing_package_ids": ["uuid"],
  "rule_pack": "amazon_us_v3"
}
```

```json
{
  "data": [
    {
      "id": "uuid",
      "listing_package_id": "uuid",
      "status": "failed",
      "findings": [
        {
          "severity": "blocking",
          "code": "TITLE_TOO_LONG",
          "field_path": "title",
          "message": "Title exceeds 200 characters"
        }
      ]
    }
  ]
}
```

---

## Publish

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/publish` | Queue publish |
| `GET` | `/publish/events` | List events |
| `GET` | `/publish/events/:id` | Detail |
| `POST` | `/publish/events/:id/retry` | Retry |

### `POST /publish`

```json
{
  "listing_package_id": "uuid",
  "channel_account_id": "uuid",
  "operation": "create",
  "idempotency_key": "uuid"
}
```

```json
{
  "publish_event_id": "uuid",
  "status": "requested"
}
```

---

## Export (V1)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/exports/channel-feed` | Generate CSV for channel template |
| `GET` | `/exports/:id` | Poll / download URL |

---

## Monitoring

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/monitors` | List monitors |
| `POST` | `/monitors` | Create monitor |
| `PATCH` | `/monitors/:id` | Pause/resume |
| `POST` | `/monitors/:id/check` | On-demand check |

---

## Remediation

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/remediations` | List recommendations |
| `GET` | `/remediations/:id` | Detail |
| `POST` | `/remediations/:id/accept` | Accept |
| `POST` | `/remediations/:id/dismiss` | Dismiss with reason |

```json
{
  "reason": "not_applicable"
}
```

---

## Channel accounts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/channel-accounts` | List |
| `POST` | `/channel-accounts` | Connect |
| `DELETE` | `/channel-accounts/:id` | Disconnect |

### `POST /channel-accounts`

```json
{
  "channel": "amazon",
  "display_name": "US Seller Central",
  "credentials": { "refresh_token": "…" }
}
```

**Note:** Prefer OAuth callback flow for production; this schema supports testing.

---

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/analytics/summary` | KPI snapshot |
| `GET` | `/analytics/time-saved` | Estimated time saved |
| `GET` | `/analytics/completeness` | By channel |

### `GET /analytics/summary`

```json
{
  "period": "7d",
  "metrics": {
    "median_time_to_first_publish_hours": 18.4,
    "auto_approved_field_pct": 72.1,
    "validation_failure_rate": 0.08,
    "publish_success_rate": 0.97
  }
}
```

---

## Audit

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/audit-logs` | List (admin/owner) |
| `GET` | `/audit-logs/export` | Async export |

---

## Health (public)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `GET` | `/health/ready` | DB + Redis checks |

---

## Webhooks (optional, V2+)

| Event | Payload includes |
|-------|------------------|
| `ingestion.completed` | `job_id`, `stats` |
| `publish.succeeded` | `publish_event_id`, `external_listing_id` |
| `remediation.created` | `remediation_id`, `severity` |

**Verification:** `X-ListingPilot-Signature` HMAC over raw body + timestamp.

---

*Document version: 1.0 — ListingPilot AI API contract.*
