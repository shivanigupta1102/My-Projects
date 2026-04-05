# ListingPilot AI — Product Roadmap

This roadmap aligns delivery with the core promise: **messy input → trusted truth → channel packages → confidence-driven review → publish → monitor/remediate**. Timelines assume a focused product-engineering team; adjust per staffing.

---

## MVP (V1) — Foundation & Dual-Channel Core

**Theme:** Prove the **extraction + truth + package + confidence + validation** loop for serious sellers without requiring full marketplace API complexity.

**Estimated timeline:** **12–16 weeks** (from kickoff to GA-ready MVP)

### Feature breakdown

| Area | Deliverables |
|------|----------------|
| **Auth & tenancy** | Email/password signup, login, JWT sessions, organization creation, single org per user (multi-user deferred to V2) |
| **Ingestion** | CSV/XLSX upload (S3 presigned), ingestion jobs, parsing pipeline, row-level error reporting |
| **Product truth** | Product/variant/attribute model, evidence storage, extraction jobs, review UI for uncertain fields |
| **AI extraction** | Structured extraction with citations; confidence factors persisted; basic category hints |
| **Channel packages** | Amazon + eBay **listing package** generation (titles, bullets, descriptions, channel-specific fields) |
| **Confidence** | Attribute confidence + listing completeness score; “review queue” = under-threshold fields |
| **Validation** | Core validation engine with channel rule packs (blocking/warning); pre-publish validation API |
| **Export** | **CSV export** of channel-ready feeds (Amazon/eBay templates) as primary “publish” path |
| **Dashboard** | Minimal: jobs status, listings needing review, validation summary |
| **Observability** | Structured logs, health checks, basic metrics |

### V1 explicit non-goals

- Direct API publish, Walmart/Shopify/Etsy, post-publish monitoring, billing, full RBAC beyond owner-only org.

---

## V2 — Multi-Channel Scale, Publish, Monitor, Team

**Theme:** Close the **operational loop**: publish in-product, watch listings after go-live, remediate, and support **teams** with **billing**.

**Estimated timeline:** **16–22 weeks** after V1 GA (calendar sequencing; some work can parallelize)

### Feature breakdown

| Area | Deliverables |
|------|----------------|
| **Channels** | **Walmart, Shopify, Etsy** package generation + validation packs; unified “channel profile” UX |
| **Direct publish** | OAuth/API credentials storage (encrypted), publish jobs, idempotent publish, status callbacks |
| **Post-publish monitoring** | Scheduled monitoring jobs, ingestion of listing health, suppression/error surfacing |
| **Remediation** | Recommendation engine with impact scoring, apply/dismiss flows, republish handoff |
| **Team & RBAC** | Invitations, **Org owner / Admin / Editor / Viewer**, permission-gated publish and settings |
| **Channel accounts** | Multiple accounts per channel per org; test vs production labels |
| **Billing** | Stripe (or equivalent): Growth / Pro / Team, usage meters for add-ons, self-serve upgrade |
| **Notifications** | Email + in-app for review ready, publish result, remediation alerts |
| **Audit** | Full audit log UI for compliance-sensitive teams |

### V2 success criteria (examples)

- Publish success rate: under 2% hard failures after retries for supported channels  
- Median remediation suggestion acceptance above 40% in pilot accounts  
- Team workflows: zero privilege-escalation defects in penetration test scope

---

## V3 — Bulk, Analytics, Optimization, Ecosystem

**Theme:** **Catalog-scale** operations, **insights**, **SEO/performance** depth, and **platform extensibility**.

**Estimated timeline:** **20–28 weeks** after V2 stabilization

### Feature breakdown

| Area | Deliverables |
|------|----------------|
| **Bulk operations** | Large batch ingestion, parallel workers, bulk validate/publish with staged rollouts, exception queues |
| **Advanced analytics** | Funnel dashboards, cohort views, channel comparison, export to warehouse |
| **AI optimization** | Suggestions for titles/bullets/keywords with guardrails; A/B experiment hooks where channel allows |
| **Marketplace SEO** | Channel-specific SEO modules (e.g., backend keywords, attributes driving search) |
| **Conversion tracking** | Integrate sales/traffic signals where APIs permit; tie to listing revisions |
| **Public API** | API keys, scoped permissions, webhooks for job completion, rate limits, partner documentation |
| **Enterprise hooks** | SSO (SAML/OIDC), SCIM (optional), data residency options |

### V3 success criteria (examples)

- Bulk jobs reliably process 100k+ rows with checkpointing  
- API adoption: N integrations with positive retention signal  
- Measurable conversion lift in pilot cohorts where experiments are valid

---

## Cross-Cutting Releases (Ongoing)

| Initiative | Notes |
|------------|--------|
| **Model quality** | Continuous eval sets per category; regression tests on extraction |
| **Rule packs** | Monthly updates to marketplace rule changes |
| **Security** | Annual pen test, bug bounty (post–PMF) |
| **Mobile** | Responsive web first; native apps out of scope unless ICP shifts |

---

## Phase Summary

| Phase | Duration (indicative) | Focus |
|-------|-------------------------|--------|
| **V1 MVP** | 12–16 weeks | Ingestion, truth, Amazon/eBay packages, confidence, validation, CSV export |
| **V2** | 16–22 weeks | More channels, publish APIs, monitoring/remediation, RBAC, billing |
| **V3** | 20–28 weeks | Bulk, analytics, optimization, SEO depth, conversion, public API |

---

*Document version: 1.0 — ListingPilot AI roadmap.*
