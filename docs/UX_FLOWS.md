# ListingPilot AI — User Experience Flows

## User Modes

ListingPilot AI supports three **modes** that map to real seller and catalog-team workflows. Users may switch modes per session; permissions still enforce RBAC (V2+).

| Mode | Primary user | Goals |
|------|----------------|-------|
| **Fast path** | Simple SMB seller | Minimal steps: upload → fix only red/yellow fields → export or publish |
| **Power console** | Serious operator | Full visibility: evidence, per-field confidence, validation drill-down, version compare |
| **Bulk mode** | Catalog team | High volume: batches, filters, bulk approve, exception queues, throughput metrics |

**Mode affects:** default dashboard density, density of technical panels, and shortcut actions—not security boundaries.

---

## Main Workflow

```
Upload → Extract → Review uncertainty → Generate packages → Validate → Publish → Monitor → Remediate
   │         │              │                  │              │          │         │           │
   │         │              │                  │              │          │         │           └─ Apply fixes, republish
   │         │              │                  │              │          │         └─ Health, suppressions
   │         │              │                  │              │          └─ Channel APIs / export
   │         │              │                  │              └─ Blocking vs warnings
   │         │              │                  └─ Per-channel listing payloads
   │         │              └─ Confidence-gated queue
   │         └─ AI + rules + evidence
   └─ Files, URLs, connectors (phase-dependent)
```

---

## Page-by-Page — 13 Screens

### 1. Landing

**Purpose:** Value proposition, differentiation (evidence + confidence + post-publish loop), social proof, CTA to sign up.

**Component hierarchy:**

- `MarketingLayout`
  - `Hero` (headline, subcopy, primary CTA, product visual)
  - `ValueProps` (3–4 pillars with icons)
  - `HowItWorks` (horizontal steps matching main workflow)
  - `IntegrationsStrip` (channel logos)
  - `PricingTeaser` → link to pricing/billing (V2+)
  - `Footer`

**Interactions:** Scroll animations (subtle); CTA routes to Sign up.

---

### 2. Sign up / Login

**Purpose:** Account creation and authentication; org creation on first signup.

**Component hierarchy:**

- `AuthLayout` (split: brand panel + form)
  - `AuthTabs` | `OAuthButtons` (future)
  - `SignUpForm` / `LoginForm` (email, password, org name on signup)
  - `ForgotPasswordLink`
  - `LegalLinks`

**Interactions:** Client validation; error toasts; redirect to Workspace dashboard on success.

---

### 3. Workspace dashboard

**Purpose:** Operational snapshot: what needs attention, what is ready, health overview.

**Component hierarchy:**

- `AppShell` (`Sidebar`, `Topbar` with org switcher V2+, user menu)
  - `DashboardPage`
    - `WelcomeHeader` (mode toggle: Fast / Power / Bulk)
    - `MetricsRow` (KPI cards)
    - `WidgetGrid` (see Dashboard widgets below)
    - `RecentActivityFeed` (ingestion, publish, remediation events)

**Key interaction patterns:** Click widget → deep link to filtered view (e.g., “needs review” → Product truth review with filter).

---

### 4. New ingestion

**Purpose:** Start the pipeline: upload files, optional URLs, select channel context.

**Component hierarchy:**

- `IngestionWizard`
  - `StepSource` (file dropzone, URL list, connector placeholder V2+)
  - `StepContext` (marketplace targets, category hint, language)
  - `StepMapping` (column mapping preview for tabular files)
  - `StepConfirm` (job name, notifications)
  - `JobProgress` (live status, row errors, link to assets)

**Interactions:** Presigned upload; cancel job; retry failed rows; jump to Product truth when complete.

---

### 5. Product truth review

**Purpose:** Resolve **uncertainty**; confirm or edit attributes with **evidence** in context.

**Component hierarchy:**

- `TruthReviewLayout` (split view)
  - `ProductNavigator` (SKU list, filters: confidence, channel impact)
  - `AttributeTable` | `AttributeInspector`
    - `ConfidenceBadge` (per field)
    - `EvidenceDrawer` (snippets, source, timestamp)
    - `InlineEditor` (override value, reason optional)
    - `BulkActionsBar` (approve all high confidence in view — Power/Bulk)
  - `TruthSummaryPanel` (completeness score, conflict count)

**Interactions:** Keyboard nav between fields; “confirm all above threshold”; flag for later; audit trail on save.

---

### 6. Channel package review

**Purpose:** Preview **channel-specific** listing payloads derived from truth; compare channels.

**Component hierarchy:**

- `PackageReviewPage`
  - `ChannelTabs` (Amazon, eBay, …)
  - `PackagePreview` (sections: title, bullets, description, attributes)
  - `DiffToggle` (truth vs package field mapping)
  - `VersionHistory` (package revisions)
  - `RegenerateButton` (with reason — triggers job)

**Interactions:** Lock fields post-publish where applicable; copy per section; open Validation center from warnings.

---

### 7. Validation center

**Purpose:** Central list of **blocking** and **non-blocking** issues with fix paths.

**Component hierarchy:**

- `ValidationCenter`
  - `FilterBar` (severity, channel, SKU, rule code)
  - `FindingsTable` (expandable rows: message, field path, doc link)
  - `BulkValidateButton`
  - `ExportReport` (CSV/PDF)

**Interactions:** Click finding → jump to field in Package or Truth; “revalidate” after edits.

---

### 8. Publish center

**Purpose:** Execute publish (V2+) or prepare **export** (V1); track outcomes.

**Component hierarchy:**

- `PublishCenter`
  - `PublishQueue` (SKU × channel rows: status, last attempt, idempotency id)
  - `PublishActions` (publish selected, schedule, dry-run)
  - `PublishLog` (timeline of attempts, error payloads sanitized)
  - `ExportPanel` (V1: template download links)

**Interactions:** Retry failed; pause queue; rate-limit indicators for APIs.

---

### 9. Monitoring / remediation dashboard

**Purpose:** Post-publish **health** and prioritized **fixes**.

**Component hierarchy:**

- `MonitoringDashboard`
  - `HealthSummary` (suppressed, at risk, healthy counts)
  - `IssueStream` (chronological)
  - `RemediationList` (ranked by impact score)
    - `RemediationCard` (suggested change, evidence, apply/dismiss)
  - `ChannelHealthChart` (trends)

**Interactions:** Apply opens confirm modal; dismiss captures reason; deep link to Product truth or Package.

---

### 10. Audit log

**Purpose:** Compliance and troubleshooting: who changed what, when, and outcome.

**Component hierarchy:**

- `AuditLogPage`
  - `AuditFilters` (actor, action type, resource, date range)
  - `AuditTable` (immutable rows, JSON detail drawer)
  - `ExportAudit` (admin/owner)

---

### 11. Channel / account settings

**Purpose:** Manage channel connections, credentials (masked), defaults per channel.

**Component hierarchy:**

- `ChannelSettingsLayout`
  - `ChannelAccountList`
  - `ChannelAccountForm` (OAuth connect, API keys — secrets never shown after save)
  - `DefaultsEditor` (shipping template refs, business policies — phase-dependent)

---

### 12. Team / RBAC / admin

**Purpose:** Invitations, roles, org security (V2+).

**Component hierarchy:**

- `TeamPage`
  - `MemberTable` (role dropdown, remove)
  - `InviteModal`
  - `RoleHelp` (capability matrix)

**Interactions:** Owner-only destructive actions; confirmation modals.

---

### 13. Billing

**Purpose:** Plan, usage, invoices, payment method (V2+).

**Component hierarchy:**

- `BillingPage`
  - `CurrentPlanCard`
  - `UsageMeters` (SKU-months, publish ops)
  - `InvoiceHistory`
  - `PaymentMethod`
  - `UpgradeCTA`

---

## Dashboard Widgets

| Widget | Description |
|--------|-------------|
| **Listings needing review** | Count + oldest waiting; link to Truth review queue |
| **Ready to publish** | Pass validation; CTA to Publish center |
| **With errors** | Blocking validation count; link to Validation center |
| **Suppressed / rejected** | Post-publish issues (V2+) |
| **Top remediation opportunities** | Highest impact score items not yet actioned |
| **Time saved** | Heuristic from auto-approved fields × estimated edit time |
| **Completeness score by channel** | Small bar chart or sparklines |
| **Recent publish events** | Success/failure strip with timestamps |

---

## Component Hierarchy — Per-Page Summary

| Screen | Top-level | Notable shared components |
|--------|-----------|---------------------------|
| Landing | `MarketingLayout` | `Hero`, `ValueProps` |
| Auth | `AuthLayout` | `SignUpForm`, `LoginForm` |
| Dashboard | `AppShell` | `MetricCard`, `WidgetGrid` |
| Ingestion | `IngestionWizard` | `FileDropzone`, `JobProgress` |
| Truth review | `TruthReviewLayout` | `EvidenceDrawer`, `ConfidenceBadge` |
| Package review | `PackageReviewPage` | `ChannelTabs`, `PackagePreview` |
| Validation | `ValidationCenter` | `FindingsTable` |
| Publish | `PublishCenter` | `PublishQueue` |
| Monitoring | `MonitoringDashboard` | `RemediationCard` |
| Audit | `AuditLogPage` | `AuditTable` |
| Channels | `ChannelSettingsLayout` | `ChannelAccountForm` |
| Team | `TeamPage` | `MemberTable` |
| Billing | `BillingPage` | `UsageMeters` |

---

## Key Interaction Patterns

1. **Progressive disclosure:** Fast path hides evidence by default; Power expands panels.  
2. **Confidence-first coloring:** Green / amber / red thresholds; never rely on color alone (icons + text).  
3. **Deterministic recovery:** Failed jobs always offer retry, download error report, and support bundle (logs reference id).  
4. **Guardrails on AI:** Regenerate never auto-publishes; user confirms in publish or export step.  
5. **Cross-linking:** Any finding deep-links to the controlling field with query params for state restoration.

---

*Document version: 1.0 — ListingPilot AI UX flows.*
