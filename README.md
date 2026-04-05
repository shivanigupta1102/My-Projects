# ListingPilot AI

**AI-native seller listing copilot** — turn raw photos into trusted, channel-compliant product records with per-channel adapted listings as a single atomic workflow.

## The Gap We Fill

The market gap is not "cross-channel listing sync." That is solved by Sellbrite and ChannelAdvisor. The gap is **photo → trusted, channel-compliant product record → per-channel adapted listing** as a single atomic workflow.

Three wedges that make this defensible:

1. **Visual-first extraction** — Raw photos are the primary source of truth, not spreadsheets. Everything else is supplementary evidence.
2. **Per-channel adaptation, not templating** — Each channel gets a listing generated for its specific search algorithm, policy surface, and buyer psychology.
3. **Compliance as a blocking gate, not a warning** — Amazon GTIN requirements, Etsy AI disclosure rules, eBay item specifics, and image policy violations are hard stops before publish.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo, npm workspaces |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, Zustand, React Query |
| Backend | NestJS 10, TypeScript, Prisma 5, BullMQ, Passport JWT |
| Worker | Node.js, BullMQ (dedicated, horizontally scalable) |
| Database | PostgreSQL 16 (Prisma ORM — 18 models, 17 enums) |
| Cache/Queue | Redis 7 (BullMQ queues, response caching, rate-limit counters) |
| Object Store | S3-compatible (MinIO locally, AWS S3 prod) |
| Vector Store | Qdrant (semantic duplicate detection, prior listing retrieval) |
| Email (dev) | MailHog |
| AI | Anthropic Claude (vision + structured extraction + adaptation) |

## Architecture

Turborepo monorepo with npm workspaces:

| Workspace | Tech | Purpose |
|-----------|------|---------|
| `apps/web` | Next.js 15, React 19, Tailwind, shadcn/ui, Zustand | Dark-themed dashboard: 15 screens covering auth, ingestion, visual review, canonical truth editor, per-channel listing preview, compliance gate, publish workflow, health monitoring, remediation, bulk ops, analytics, audit, settings |
| `apps/api` | NestJS 10, Prisma 5, BullMQ, Passport JWT | REST API (35+ routes), Swagger, 20 NestJS modules, background job orchestration |
| `apps/worker` | Node.js, BullMQ | Dedicated job worker process — decoupled from API |
| `packages/shared-types` | TypeScript | Cross-app contracts (9 type modules) |
| `packages/channel-schemas` | TypeScript | Per-channel compliance manifests (43 rules across 5 channels) |
| `packages/ml-utils` | TypeScript | Image processing, confidence math, evidence scoring, GTIN validation |

### Backend Modules (20 NestJS modules)

| Module | Purpose |
|--------|---------|
| **VisionModule** | Image analysis (Claude vision), background removal, per-channel image compliance, product classification |
| **ComplianceModule** | Per-channel compliance engine, GTIN validation, Etsy AI disclosure, policy caching |
| **CategoryModule** | Channel-specific category mapping, eBay item specifics via Taxonomy API |
| **AdaptationModule** | Per-channel listing adaptation (Amazon keyword-stuffed titles, eBay 80-char, Etsy natural language, etc.) |
| **BulkOpsModule** | Bulk publish/relist/delist/category remap with SSE progress |
| **SemanticDedupModule** | Qdrant-based duplicate detection on ingestion |
| **AiModule** | Claude integration, streaming, structured output, safety guardrails, per-org token budget |
| **IngestionModule** | Multimodal file processing (images, PDFs, CSVs, URLs) |
| **ProductsModule** | Canonical product model, confidence scoring, normalizer |
| **PublishModule** | Channel connectors with compliance gate (Amazon SP-API, eBay Trading/Inventory, Etsy v3, Shopify GraphQL, Walmart API) |
| **MonitoringModule** | Post-publish health monitoring, remediation engine |
| + 9 more | Auth, analytics, audit, evidence, organizations, review, storage, queue, users |

## Quick Start

### Prerequisites

- **Node.js 20+** and **npm 10+**
- **Docker** and **Docker Compose**

### Setup

```bash
# 1. Clone and enter the project
git clone https://github.com/shivanigupta1102/My-Projects.git
cd My-Projects

# 2. Copy environment variables
cp .env.example .env
cp .env.example apps/api/.env

# 3. Start infrastructure (PostgreSQL, Redis, MinIO, MailHog, Qdrant)
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run database migrations and generate the Prisma client
make db

# 6. Seed the database (creates demo users, products, compliance checks, GTIN records)
make seed

# 7. Start dev servers (builds shared packages, then starts API + web)
make dev
```

### Access Points

| Service | URL |
|---------|-----|
| Web UI | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| Swagger Docs | http://localhost:4000/docs |
| MinIO Console | http://localhost:9001 |
| MailHog UI | http://localhost:8025 |
| Qdrant Dashboard | http://localhost:6333 |

## Project Structure

```
listingpilot/
├── apps/
│   ├── web/                       # Next.js 15 frontend (15 screens)
│   │   ├── app/                   #   App Router pages
│   │   │   ├── (dashboard)/       #     Dashboard, products, ingest, review, monitoring,
│   │   │   │                      #     analytics, bulk, audit, channels, compliance, settings
│   │   │   ├── (auth)/            #     Login, signup
│   │   │   └── (marketing)/       #     Landing page
│   │   ├── components/            #   UI components
│   │   │   ├── product/           #     ConfidenceBadge, ComplianceGate, ChannelPill,
│   │   │   │                      #     EvidenceChain, AttributeRow, ConflictResolver
│   │   │   ├── layout/            #     Sidebar, TopBar, DashboardShell, CommandPalette
│   │   │   ├── dashboard/         #     StatCard, ActionQueue, RecentActivity, ActivityFeed
│   │   │   ├── channels/          #     ListingPreview, ValidationReport, PublishReadinessBar
│   │   │   ├── monitoring/        #     HealthScoreCard, SuppressionAlert, RemediationCard
│   │   │   ├── ingestion/         #     DropZone, IngestionProgress, IngestionSourceCard
│   │   │   └── ui/                #     shadcn/ui primitives (button, input, table, dialog, etc.)
│   │   ├── hooks/                 #   React Query hooks
│   │   ├── lib/                   #   API client, auth, utilities
│   │   └── styles/                #   Global CSS with v2 design system
│   ├── api/                       # NestJS backend (20 modules, 35+ routes)
│   │   ├── src/
│   │   │   ├── vision/            #     Image analysis, background removal, compliance
│   │   │   ├── compliance/        #     Compliance engine, GTIN validation, policy cache
│   │   │   ├── category/          #     Category mapping, item specifics
│   │   │   ├── adaptation/        #     Per-channel listing adaptation
│   │   │   ├── bulk-ops/          #     Bulk publish/relist/delist/remap
│   │   │   ├── semantic-dedup/    #     Duplicate detection via Qdrant
│   │   │   ├── ai/                #     Claude integration, extraction pipeline
│   │   │   ├── auth/              #     JWT auth, guards, decorators
│   │   │   ├── ingestion/         #     File processing (PDF, CSV, images, URLs)
│   │   │   ├── products/          #     Canonical model, confidence scoring
│   │   │   ├── listing-packages/  #     Channel listing generation and validation
│   │   │   ├── publish/           #     Channel connectors with compliance gate
│   │   │   ├── monitoring/        #     Health monitoring, remediation
│   │   │   └── ...                #     analytics, audit, evidence, organizations, review, etc.
│   │   ├── prisma/                #   Schema (18 models), migrations, seed
│   │   └── test/                  #   Unit (8 suites) and integration tests
│   └── worker/                    # Dedicated BullMQ worker process
├── packages/
│   ├── shared-types/              # Cross-app TypeScript contracts (9 modules)
│   ├── channel-schemas/           # Per-channel compliance manifests (43 rules)
│   └── ml-utils/                  # Image processing, confidence math, GTIN validation
├── docs/                          # 9 documentation files
│   ├── API_CONTRACT.md            #   REST API endpoints and response shapes
│   ├── ARCHITECTURE.md            #   System design and module breakdown
│   ├── CHANNEL_ADAPTATION.md      #   Per-channel adaptation logic with examples
│   ├── COMPLIANCE_RULES.md        #   Full rule catalog (43 rules, 5 channels)
│   ├── DATABASE_SCHEMA.md         #   Database entity reference
│   ├── DEPLOYMENT.md              #   Hosting and CI/CD guide
│   ├── PRODUCT_VISION.md          #   Product strategy and ICP
│   ├── ROADMAP.md                 #   Feature timeline
│   └── UX_FLOWS.md                #   15-screen UX specification
├── docker-compose.yml             # PostgreSQL, Redis, MinIO, MailHog, Qdrant
├── Makefile                       # Development shortcuts
└── package.json                   # Root workspace configuration
```

## Key Features

- **Visual-First Extraction** — Photos are the primary source. AI extracts structured product data with evidence citations and bounding boxes.
- **Per-Channel Compliance Gates** — 43 rules across 5 channels. BLOCKING issues prevent publish. Auto-fix available for 15+ rules.
- **Channel-Specific Adaptation** — Amazon keyword-stuffed titles, eBay 80-char brand-first, Etsy natural language with 13 tags, Shopify HTML with SEO, Walmart content-score optimized.
- **Confidence-Aware Review** — Every attribute links to evidence. Safety-critical fields require seller confirmation. Weighted scoring: model confidence (30%), source quality (25%), cross-source agreement (20%).
- **GTIN Validation** — Check digit algorithm, GS1 prefix lookup, Amazon Brand Registry status, exemption handling.
- **Semantic Dedup** — Qdrant vector store detects duplicate products on ingestion (cosine similarity > 0.92).
- **Bulk Operations** — Chunked publish/relist/delist with rate limiting per channel API and SSE progress streaming.
- **Post-Publish Monitoring** — Health scores, suppression detection, remediation queue ranked by revenue impact.

## Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start Docker infra + build packages + run API & web |
| `make db` | Run Prisma migrations and generate client |
| `make seed` | Seed database with demo data (5 products, compliance checks, GTIN records) |
| `make test` | Run API unit tests (65+ tests, 8 suites) |
| `make test-e2e` | Run API end-to-end tests |
| `make down` | Stop Docker Compose |
| `make clean` | Tear down volumes and build artifacts |

## Testing

```bash
make test
# or
npm run test --workspace=apps/api
```

8 test suites covering: confidence scoring, compliance engine, GTIN validation, category mapping, adaptation engine, image compliance, remediation engine, and integration tests.

## Competitive Advantage

| Competitor | Gap | How ListingPilot Wins |
|-----------|-----|----------------------|
| Sellbrite | Syncs listings you already have; no photo→product extraction | ListingPilot owns the creation step |
| ChannelAdvisor | Enterprise, expensive, no AI extraction | ListingPilot is AI-native, SMB-accessible |
| eBay bulk listing | eBay-native only | ListingPilot is channel-agnostic |
| ChatGPT + copy-paste | No compliance validation, no evidence, no publish | End-to-end with hard compliance gates |
| Manual listing | 45+ min per SKU × 5 channels | Target < 5 min per SKU for compliant publish |

**The moat**: evidence-backed confidence + per-channel compliance as a hard gate + visual-first extraction is a combination none of the above offer as an integrated product.

## Documentation

| Document | Description |
|----------|-------------|
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, tech stack, module breakdown |
| [`COMPLIANCE_RULES.md`](docs/COMPLIANCE_RULES.md) | Full rule catalog (43 rules, 5 channels, auto-fix details) |
| [`CHANNEL_ADAPTATION.md`](docs/CHANNEL_ADAPTATION.md) | Per-channel adaptation logic with before/after examples |
| [`API_CONTRACT.md`](docs/API_CONTRACT.md) | REST API endpoints, request/response shapes |
| [`DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Database entity reference (18 models, 17 enums) |
| [`DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker, hosting, CI/CD pipeline |
| [`PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) | Product strategy, ICP, use cases |
| [`ROADMAP.md`](docs/ROADMAP.md) | Feature timeline |
| [`UX_FLOWS.md`](docs/UX_FLOWS.md) | 15-screen UX specification |

## License

MIT
