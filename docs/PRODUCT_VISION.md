# ListingPilot AI — Product Vision

## Product Name

**ListingPilot AI**

An AI-native seller listing copilot that turns messy product inputs into trusted, channel-ready listings—with evidence, confidence, and closed-loop monitoring after publish.

---

## Mission Statement

ListingPilot AI exists to eliminate the **fragmentation tax** on marketplace sellers: the cost of juggling copy tools, feed validators, channel sync apps, and spreadsheets without a single source of product truth or a path from uncertainty to publish to remediation. We give teams **one workflow** from ingestion to post-publish health, with **evidence-backed extraction**, **confidence-aware review**, and **cross-channel remediation**—so sellers ship complete, compliant listings faster and keep them healthy after they go live.

---

## Core Users

| Segment | Description |
|--------|-------------|
| **SMB marketplace sellers** | Active on Amazon, eBay, Walmart, Shopify, Etsy; limited catalog ops headcount; need speed and fewer mistakes. |
| **Mid-market catalog teams** | Hundreds to tens of thousands of SKUs; structured workflows, SLAs, and accountability; need bulk operations and auditability. |
| **Resellers & multi-channel merchants** | Same SKU across many channels; need consistent core truth with channel-specific packaging and unified monitoring. |

---

## Market Gap

Today’s landscape is **siloed**:

| Capability | Typical tools | Gap |
|------------|---------------|-----|
| Copy generation | LLM writers, templates | No binding to **structured product truth** or **evidence** |
| Sync & listing tools | Channel connectors | Weak on **messy upstream input** and **pre-publish validation depth** |
| Feed validation | Schema validators, rule engines | **Point-in-time** checks; not tied to **confidence** or **remediation** after publish |

**ListingPilot AI closes the loop:**

```
Messy input → Trusted product truth → Channel-specific listing package
    → Confidence/evidence review → Publish → Post-publish monitoring/remediation
```

No major incumbent delivers this **end-to-end** with **evidence-backed extraction**, **review-only-uncertainty** UX, and **cross-channel post-publish remediation** as first-class primitives.

---

## Non-Negotiable Differentiator

1. **Evidence-backed extraction** — Every surfaced attribute is traceable to sources (uploads, URLs, prior listings, structured feeds).
2. **Confidence scoring** — Not binary “AI said so”; calibrated scores drive queue priority and review scope.
3. **“Review only uncertainty” workflow** — Users focus on low-confidence or conflicting fields; high-confidence fields auto-advance within policy.
4. **Cross-channel post-publish remediation** — Monitoring ties suppressions, policy flags, and performance anomalies back to **actionable fixes** across channels, not one-off alerts.

---

## Ideal Customer Profile (ICP) — Three Segments

### Segment A: Growth SMB (single or dual channel)

- **Firmographics:** $500K–$10M online GMV; 1–5 people touching listings; 50–2,000 active SKUs.
- **Pain:** Inconsistent titles/bullets, listing errors, slow time-to-live, fear of policy issues.
- **Buying triggers:** Catalog expansion, new marketplace, previous suspension or high return rate.
- **Success definition:** Faster first publish, fewer manual edits, fewer validation failures.

### Segment B: Multi-channel operator (3+ channels)

- **Firmographics:** $5M–$50M GMV; dedicated ops or small catalog team; 2,000–20,000 SKUs.
- **Pain:** Drift between channels, duplicate work, unclear “source of truth,” reactive firefighting on suppressions.
- **Buying triggers:** Margin pressure, need for operational leverage, audit/compliance pressure.
- **Success definition:** High auto-approval rate, strong publish success, measurable remediation acceptance, retention.

### Segment C: Catalog ops / mid-market (team workflow)

- **Firmographics:** Centralized merchandising or ecommerce ops; 5,000–50,000+ SKUs; multiple brands or regions.
- **Pain:** Lack of audit trails, RBAC, and bulk throughput; integration with existing PIM/ERP incomplete.
- **Buying triggers:** Headcount limits, M&A integration, replatforming, quality initiatives.
- **Success definition:** SKUs managed per tenant, role-appropriate access, completeness and validation KPIs, API/extensibility (later phases).

---

## Top 5 Use Cases (Detailed Scenarios)

### 1. Onboard a messy supplier file and publish clean Amazon & eBay listings

**Actor:** SMB seller expanding from DTC to marketplaces.  
**Inputs:** Inconsistent CSV (mixed units, missing attributes, HTML in descriptions).  
**Flow:** Upload → parsing + extraction → product truth graph with evidence snippets → channel packages (Amazon/eBay) → validation center → publish (or export).  
**Outcome:** First publish in days not weeks; edits concentrated in uncertain fields only.

### 2. Reconcile conflicting sources into one truth, then fan out to channels

**Actor:** Multi-channel merchant.  
**Inputs:** Old eBay listing, Amazon flat file fragment, Shopify metafields.  
**Flow:** Multi-source ingestion → cross-source agreement scoring → conflicts surfaced in review queue → user confirms or overrides with audit trail → packages regenerated.  
**Outcome:** One canonical SKU story; reduced channel drift and customer confusion.

### 3. Pre-publish compliance and completeness for policy-heavy categories

**Actor:** Mid-market catalog team (e.g., electronics, health, kids).  
**Inputs:** Supplier docs + category requirements.  
**Flow:** Taxonomy mapping → required attributes flagged → validation engine (schema + policy rules) → blocking vs warning issues → fix in place or send back to extraction.  
**Outcome:** Lower suppression rate post-publish; predictable “ready to publish” gate.

### 4. Post-publish monitoring and remediation after a spike in suppressions

**Actor:** Operations lead.  
**Inputs:** Channel APIs / feeds for listing status, buyability, policy flags.  
**Flow:** Monitoring jobs detect anomalies → correlate to attributes/packages → remediation recommendations ranked by impact → optional republish path.  
**Outcome:** Mean time to remediate drops; fewer repeat incidents.

### 5. High-volume seasonal push with minimal human review time

**Actor:** Catalog team during peak season.  
**Inputs:** Bulk CSV + image URLs; tight deadlines.  
**Flow:** Bulk mode ingestion → confidence thresholds for auto-approval by category → reviewer pool tackles only exception queue → bulk validate → staged publish.  
**Outcome:** Higher throughput without proportional headcount; metrics tracked per batch.

---

## Success Metrics

| Metric | Definition | Direction |
|--------|------------|-----------|
| **Time to first publish** | Median time from first ingestion to first successful publish (per tenant/channel) | ↓ |
| **Manual edits per listing** | Count of user-initiated field edits before publish | ↓ |
| **% fields auto-approved** | Share of fields meeting confidence/policy thresholds without human touch | ↑ |
| **Listing completeness score** | Weighted coverage of required + recommended attributes per channel policy | ↑ |
| **Validation failure rate** | % of listing attempts failing channel validation pre-publish | ↓ |
| **Publish success rate** | % of publish attempts that succeed vs error | ↑ |
| **Suppression / error rate** | Post-publish issues per 1,000 listings (by severity) | ↓ |
| **Remediation acceptance rate** | % of recommendations accepted or applied (full or partial) | ↑ |
| **Conversion lift** | A/B or cohort lift where experiments exist (channel-provided or landing page) | ↑ |
| **User retention** | MAU/WAU, cohort retention for paid tiers | ↑ |
| **SKUs managed per tenant** | Active SKUs with at least one package in “live” or “ready” state | ↑ (expansion signal) |

---

## Monetization

| Tier | Audience | Included |
|------|----------|----------|
| **Free trial** | Evaluators | Time- or SKU-limited access to core ingestion, truth review, one or two channels, capped publish/monitor jobs |
| **Growth (SMB)** | Single/dual channel | Core workflow, standard confidence thresholds, email support, standard validation packs |
| **Pro (multi-channel)** | 3+ channels, higher volume | Full channel package set, monitoring/remediation, priority queues, advanced validation |
| **Team (catalog ops)** | RBAC, audit, SLAs | Org-wide admin, role management, bulk operations, audit exports, success manager (annual) |

**Usage-based add-ons (examples):**

- Additional **SKU-months** or **listing operations** beyond plan caps  
- **Extra monitoring checks** or **publish API calls**  
- **Premium model tier** (higher-accuracy extraction for specific categories)  
- **Dedicated inference / private rule packs** for enterprise (custom SOW)

---

## Strategic Principles

1. **Trust before scale** — Evidence and confidence are not optional add-ons.  
2. **Human time is the scarce resource** — Optimize for “review only uncertainty.”  
3. **Publish is not the end state** — Monitoring and remediation complete the value loop.  
4. **Multi-tenant by design** — Data isolation and RBAC are foundational, not retrofitted.

---

*Document version: 1.0 — ListingPilot AI product vision.*
