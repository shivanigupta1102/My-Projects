# ListingPilot AI

**AI-native seller listing copilot** — turn raw photos into trusted, channel-compliant product records with per-channel adapted listings as a single atomic workflow.

## The Gap We Fill

The market gap is not "cross-channel listing sync." That is solved by Sellbrite and ChannelAdvisor. The gap is **photo → trusted, channel-compliant product record → per-channel adapted listing** as a single atomic workflow.

Three wedges that make this defensible:

1. **Visual-first extraction** — Raw photos are the primary source of truth, not spreadsheets. Everything else is supplementary evidence.
2. **Per-channel adaptation, not templating** — Each channel gets a listing generated for its specific search algorithm, policy surface, and buyer psychology.
3. **Compliance as a blocking gate, not a warning** — Amazon GTIN requirements, Etsy AI disclosure rules, eBay item specifics, and image policy violations are hard stops before publish.

## End-to-End Workflow

```
Upload Photos (up to 5) → AI Vision Extraction (35+ attributes) → Human Description Generation
    → Review & Edit Attributes → Channel-Specific Listing Preview → Selective Channel Generation
        → Compliance Validation → Publish → Post-Publish Health Monitoring
```

1. **Ingest** — Upload up to 5 product images with a visual staging grid. AI extracts 35+ attributes per image including certification details (PSA, BGS, CGC), card specifics, grades, and serial numbers.
2. **Review & Edit** — All extracted attributes displayed in an editable form. Modify any field before proceeding. AI-generated human description included.
3. **Preview** — eBay-style listing preview with channel toggle (Amazon, eBay, Shopify, Walmart, Etsy). Each channel shows compliance score and channel-specific rendering rules.
4. **Generate** — Selective channel listing generation. Pick individual channels or generate all at once. Per-channel regeneration supported.
5. **Publish** — Compliance-gated publish to each marketplace with bulk operations support.
6. **Monitor** — Post-publish health monitoring with remediation recommendations ranked by impact.

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
| AI | Groq API with Llama 4 Scout (vision + structured extraction + text completion) |

## Architecture

Turborepo monorepo with npm workspaces:

| Workspace | Tech | Purpose |
|-----------|------|---------|
| `apps/web` | Next.js 15, React 19, Tailwind, shadcn/ui, Zustand | Dark-themed dashboard: 15+ screens covering auth, ingestion, visual review, canonical truth editor, per-channel listing preview with compliance checks, selective channel generation, publish workflow, health monitoring, remediation, bulk ops, analytics, audit, settings |
| `apps/api` | NestJS 10, Prisma 5, BullMQ, Passport JWT | REST API (35+ routes), Swagger, 20 NestJS modules, background job orchestration |
| `apps/worker` | Node.js, BullMQ | Dedicated job worker process — decoupled from API |
| `packages/shared-types` | TypeScript | Cross-app contracts (9 type modules) |
| `packages/channel-schemas` | TypeScript | Per-channel compliance manifests (43 rules across 5 channels) |
| `packages/ml-utils` | TypeScript | Image processing, confidence math, evidence scoring, GTIN validation |

### Backend Modules (20 NestJS modules)

| Module | Purpose |
|--------|---------|
| **VisionModule** | Image analysis (AI vision for 35+ attributes), OCR, background removal, per-channel image compliance |
| **ComplianceModule** | Per-channel compliance engine, GTIN validation, Etsy AI disclosure, policy caching |
| **CategoryModule** | Channel-specific category mapping, eBay item specifics via Taxonomy API |
| **AdaptationModule** | Per-channel listing adaptation (Amazon keyword-stuffed titles, eBay 80-char, Etsy natural language, etc.) |
| **BulkOpsModule** | Bulk publish/relist/delist/category remap with SSE progress |
| **SemanticDedupModule** | Qdrant-based duplicate detection on ingestion |
| **AiModule** | AI integration (vision + text completion), structured output, safety guardrails, per-org token budget |
| **IngestionModule** | Multi-image file processing (up to 5 images per product), with attribute deduplication |
| **ProductsModule** | Canonical product model, confidence scoring, normalizer |
| **ListingPackagesModule** | Per-channel listing generation with quality scoring and validation |
| **PublishModule** | Channel connectors with compliance gate (Amazon SP-API, eBay Trading/Inventory, Etsy v3, Shopify GraphQL, Walmart API) |
| **MonitoringModule** | Post-publish health monitoring, remediation engine with impact scoring |
| + 8 more | Auth, analytics, audit, evidence, organizations, review, storage, queue, users |

## Quick Start

### Prerequisites

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| **Node.js** | 20+ | `node -v` | [nodejs.org](https://nodejs.org/) or `brew install node` |
| **npm** | 10+ | `npm -v` | Comes with Node.js |
| **Docker** | 24+ | `docker -v` | [docker.com](https://docs.docker.com/get-docker/) or `brew install --cask docker` |
| **Docker Compose** | v2+ | `docker compose version` | Included with Docker Desktop |
| **Git** | any | `git -v` | `brew install git` or [git-scm.com](https://git-scm.com/) |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/himanshusapra9/Projects.git
cd "Projects/Seller Listing Copilot"
```

### Step 2 — Start Infrastructure (PostgreSQL, Redis, MinIO, MailHog, Qdrant)

```bash
docker compose up -d
```

Verify all 5 containers are running:

```bash
docker compose ps
```

You should see `listingpilot-postgres`, `listingpilot-redis`, `listingpilot-minio`, `listingpilot-mailhog`, and `listingpilot-qdrant` all in a healthy/running state. If Docker is not installed, you can run these services natively — see the ports and credentials in `docker-compose.yml`.

### Step 3 — Install Dependencies

```bash
npm install
```

### Step 4 — Configure Environment Variables

```bash
cp .env.example apps/api/.env
```

Then edit `apps/api/.env` and set your **Groq API key** (free tier):

```bash
# Get a free key at https://console.groq.com/keys
# Open the file and replace the placeholder:
nano apps/api/.env
```

Set this line (replace the placeholder with your actual key):

```
GROQ_API_KEY=gsk_YOUR_KEY_HERE
```

> **Note:** A built-in demo key is hardcoded as a fallback so the app will work without this step, but it may hit rate limits. For reliable usage, set your own key.

### Step 5 — Run Database Migrations & Seed

```bash
# Generate the Prisma client
npx prisma generate --schema=apps/api/prisma/schema.prisma

# Run migrations to create all tables
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma

# Seed with demo data (users, products, compliance checks)
npm run prisma:seed --workspace=apps/api
```

### Step 6 — Build Shared Packages

```bash
npm run build --workspace=@listingpilot/shared-types
npm run build --workspace=@listingpilot/channel-schemas
npm run build --workspace=@listingpilot/ml-utils
```

### Step 7 — Start the Dev Servers

**Option A — Both servers at once (using Makefile):**

```bash
make dev
```

**Option B — Start each server manually (two terminals):**

Terminal 1 — Backend API:

```bash
npm run dev --workspace=apps/api
```

Terminal 2 — Frontend:

```bash
npm run dev --workspace=apps/web
```

### Step 8 — Open the App

| Service | URL |
|---------|-----|
| **Web UI** | http://localhost:3000 |
| **API** | http://localhost:4000/api/v1 |
| **Swagger Docs** | http://localhost:4000/docs |
| **MinIO Console** | http://localhost:9001 (minioadmin / minioadmin) |
| **MailHog UI** | http://localhost:8025 |
| **Qdrant Dashboard** | http://localhost:6333/dashboard |

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `demo1234` |
| Seller | `seller@demo.com` | `demo1234` |

### Access from Another Machine (LAN)

The dev servers bind to `0.0.0.0`, so they are accessible from other machines on your network. Find your local IP with:

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

Then open `http://<YOUR_IP>:3000` from the other machine.

### Access via Ngrok (External / Public URL)

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Open the ngrok URL in any browser. All API calls are proxied through the Next.js server, so images, descriptions, and attributes work through ngrok automatically.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `EADDRINUSE: address already in use :::4000` | Kill stale process: `lsof -ti:4000 \| xargs kill -9` |
| `EADDRINUSE: address already in use :::3000` | Kill stale process: `lsof -ti:3000 \| xargs kill -9` |
| AI extraction shows "401 Missing Authentication header" | Set `GROQ_API_KEY` in `apps/api/.env` — get a free key at https://console.groq.com/keys |
| No description / item specifics after ingestion | Check backend logs for "AI vision extraction failed". Click "Retry AI Extraction" on the preview page |
| Images not loading via ngrok | Images are served through a public `/raw` endpoint — restart both servers after pulling latest code |
| `docker compose up` fails | Make sure Docker Desktop is running. On Linux, ensure your user is in the `docker` group |
| `prisma migrate dev` hangs | Ensure PostgreSQL is running: `docker compose ps` — the `listingpilot-postgres` container should be healthy |
| Frontend crash: `require is not defined` | Run `npm install` again — `tailwindcss-animate` may be missing |

## Project Structure

```
listingpilot/
├── apps/
│   ├── web/                       # Next.js 15 frontend (15+ screens)
│   │   ├── app/                   #   App Router pages
│   │   │   ├── (dashboard)/       #     Dashboard, products, ingest, review, monitoring,
│   │   │   │   ├── ingest/        #       Multi-image upload (up to 5) with visual staging grid
│   │   │   │   ├── products/[id]/ #       Product detail, review/edit, listing preview, channels
│   │   │   │   │   ├── preview/   #         eBay-style preview with channel toggle & compliance
│   │   │   │   │   ├── review/    #         Editable attribute review (35+ fields)
│   │   │   │   │   └── channels/  #         Selective channel generation & per-channel regenerate
│   │   │   │   ├── monitoring/    #       Health monitoring with impact-scored remediations
│   │   │   │   └── ...            #       analytics, bulk, audit, channels, settings
│   │   │   ├── (auth)/            #     Login, signup
│   │   │   └── (marketing)/       #     Landing page
│   │   ├── components/            #   UI components
│   │   │   ├── product/           #     ConfidenceBadge, ComplianceGate, ChannelPill,
│   │   │   │                      #     EvidenceChain, AttributeRow, ConflictResolver
│   │   │   ├── layout/            #     Sidebar, TopBar, DashboardShell, CommandPalette
│   │   │   ├── dashboard/         #     StatCard, ActionQueue, RecentActivity, ActivityFeed
│   │   │   ├── channels/          #     ListingPreview, ValidationReport, PublishReadinessBar
│   │   │   ├── monitoring/        #     HealthScoreCard, SuppressionAlert, RemediationCard
│   │   │   ├── ingestion/         #     DropZone (multi-image, configurable limits)
│   │   │   └── ui/                #     shadcn/ui primitives (button, input, table, dialog, etc.)
│   │   ├── hooks/                 #   React Query hooks
│   │   ├── lib/                   #   API client, auth, utilities
│   │   └── styles/                #   Global CSS with v2 design system
│   ├── api/                       # NestJS backend (20 modules, 35+ routes)
│   │   ├── src/
│   │   │   ├── ai/                #     AI integration (vision + text), structured output
│   │   │   ├── vision/            #     Image analysis (35+ attributes), OCR, background removal
│   │   │   ├── compliance/        #     Compliance engine, GTIN validation, policy cache
│   │   │   ├── category/          #     Category mapping, item specifics
│   │   │   ├── adaptation/        #     Per-channel listing adaptation
│   │   │   ├── bulk-ops/          #     Bulk publish/relist/delist/remap
│   │   │   ├── semantic-dedup/    #     Duplicate detection via Qdrant
│   │   │   ├── auth/              #     JWT auth, guards, decorators
│   │   │   ├── ingestion/         #     Multi-image processing with attribute deduplication
│   │   │   ├── products/          #     Canonical model, confidence scoring
│   │   │   ├── listing-packages/  #     Per-channel listing generation with quality scoring
│   │   │   ├── publish/           #     Channel connectors with compliance gate
│   │   │   ├── monitoring/        #     Health monitoring, impact-scored remediation
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

- **Multi-Image Ingestion** — Upload up to 5 product photos with a visual staging grid. Each image is independently analyzed by AI vision, with intelligent attribute deduplication across images (longer/higher-confidence values win).
- **Deep AI Extraction (35+ Attributes)** — Extracts comprehensive product data including title, brand, category, condition, and specialized fields for graded items (certification company, number, grade), sports cards (player, team, card number, set, year, variant, rarity), and general collectibles (serial numbers, edition, authentication details).
- **AI Human Description** — Automatically generates a natural, seller-quality product description (3-5 sentences) woven from extracted attributes. Integrated into the ingestion pipeline so descriptions are ready by the time extraction completes.
- **Interactive Review & Edit** — All extracted attributes displayed in an editable form organized by category (Product Identity, Grading & Authentication, Card/Collectible Details, Physical Attributes, Description & Features, Certifications & Compliance). Modify any field before generating listings.
- **eBay-Style Listing Preview** — Full listing preview with image carousel, item specifics table, description section, and detail panel. Toggle between Amazon, eBay, Shopify, Walmart, and Etsy to see channel-specific rendering with compliance scores.
- **Selective Channel Generation** — Choose individual channels or generate all at once. Each channel card shows existing listing status and quality score. Per-channel regeneration without affecting others.
- **Per-Channel Compliance Gates** — 43 rules across 5 channels with real-time compliance checks (title length, description limits, required fields, GTIN, image count). BLOCKING issues prevent publish. Auto-fix available for 15+ rules.
- **Channel-Specific Adaptation** — Amazon keyword-stuffed titles, eBay 80-char brand-first, Etsy natural language with 13 tags, Shopify HTML with SEO, Walmart content-score optimized.
- **Attribute Deduplication** — Backend prevents duplicate attributes when multiple images extract the same field. Frontend deduplicates for display, keeping the most detailed value.
- **Confidence-Aware Review** — Every attribute links to evidence. Safety-critical fields require seller confirmation. Weighted scoring: model confidence (30%), source quality (25%), cross-source agreement (20%).
- **GTIN Validation** — Check digit algorithm, GS1 prefix lookup, Amazon Brand Registry status, exemption handling.
- **Semantic Dedup** — Qdrant vector store detects duplicate products on ingestion (cosine similarity > 0.92).
- **Bulk Operations** — Chunked publish/relist/delist with rate limiting per channel API and SSE progress streaming.
- **Post-Publish Monitoring** — Health scores, suppression detection, remediation queue with impact-scored recommendations.

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

## AI Extraction Pipeline

The vision system extracts **35+ structured attributes** from product images in a single pass:

| Category | Fields |
|----------|--------|
| **Product Identity** | title, brand, manufacturer, category, subcategory, model, model_number, year, country_of_origin |
| **Grading & Auth** | certification_company (PSA, BGS, CGC, SGC, JSA, Beckett), certification_number, grade, authentication_details, serial_number |
| **Card / Collectible** | player_name, team, card_number, card_set, card_year, edition, variant, rarity, autograph, memorabilia_type |
| **Physical** | color, material, size, weight, dimensions, condition |
| **Visual** | notable_features, certifications, text_on_product, visible_labels, barcodes_visible, logos_visible |
| **Generated** | human_description (AI-written, 3-5 sentence natural paragraph) |

When multiple images are uploaded, attributes are **deduplicated** — the system keeps the longer/higher-confidence value for each field rather than creating duplicates.

## Channel-Specific Compliance

Each channel has distinct listing requirements validated in real-time:

| Channel | Title Limit | Bullets | Description Limit | Key Requirements |
|---------|------------|---------|-------------------|------------------|
| **Amazon** | 200 chars | 5 | 2000 chars | GTIN required, brand registry |
| **eBay** | 80 chars | 5 | 4000 chars | Item specifics, condition required |
| **Shopify** | 255 chars | — | 5000 chars | SEO metadata, product type |
| **Walmart** | 200 chars | 5 | 4000 chars | GTIN required, shelf description |
| **Etsy** | 140 chars | — | 2000 chars | 13 tags, AI disclosure, materials |

## Competitive Advantage

| Competitor | Gap | How ListingPilot Wins |
|-----------|-----|----------------------|
| Sellbrite | Syncs listings you already have; no photo→product extraction | ListingPilot owns the creation step |
| ChannelAdvisor | Enterprise, expensive, no AI extraction | ListingPilot is AI-native, SMB-accessible |
| eBay bulk listing | eBay-native only | ListingPilot is channel-agnostic |
| ChatGPT + copy-paste | No compliance validation, no evidence, no publish | End-to-end with hard compliance gates |
| Manual listing | 45+ min per SKU × 5 channels | Target < 5 min per SKU for compliant publish |

**The moat**: evidence-backed confidence + per-channel compliance as a hard gate + visual-first extraction + AI-generated human descriptions is a combination none of the above offer as an integrated product.

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
