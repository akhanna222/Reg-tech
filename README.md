# Reg-Tech

**Regulatory Technology Platform — End-to-End OECD Data Exchange & Analytics**

Reg-Tech is a modular, jurisdiction-agnostic platform for regulatory data submission, validation, transmission, and analysis under OECD frameworks (CRS, FATCA, DAC6). It serves both **Financial Institutions** filing compliance reports and **Tax Authorities** reviewing, approving, and exchanging that data via the OECD Common Transmission System (CTS).

> **Core value:** We don't just ensure that data is compliant — we ensure it is useful.

---

## Platform Architecture

The platform is composed of **five integrated layers**, each with a clearly defined responsibility:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Reg-Tech Platform                            │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ Layer 1  │  │ Layer 2  │  │ Layer 3  │  │ Layer 4  │  │  L5  │ │
│  │   FI     │→ │Validation│→ │   Tax    │→ │Analytics │  │ Data │ │
│  │ Portal   │  │ Engine   │  │Authority │  │& Insights│  │ Back │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘ │
│       ↑                                          ↑           │     │
│       └──────────────────────────────────────────┴───────────┘     │
│                        Feedback Loop                                │
└─────────────────────────────────────────────────────────────────────┘
```

| Layer | Name | What It Does |
|-------|------|-------------|
| **Layer 1** | FI Portal | FI enrolment, authentication (2FA), filing creation (manual + XML upload), status tracking, notifications |
| **Layer 2** | Validation Engine | 4-stage pipeline — XSD structural, business rules, cross-record, jurisdiction-specific — with hot-reloadable rules |
| **Layer 3** | Tax Authority Portal | Submission browser, approval workflows, 7-step transmission pipeline (validate → lock → package → encrypt → sign → transmit → ACK) |
| **Layer 4** | Analytics & Insights | Dashboards, risk/anomaly detection, cross-jurisdiction comparison, full-text search, investigation queues |
| **Layer 5** | Data Transmission Back | Inbound CTS package receipt, signature verification, decryption, ACK/NACK processing, result distribution |

---

## Key Features

### For Financial Institutions
- **Self-service enrolment** with tax authority approval workflow
- **Dual filing modes** — manual form entry or OECD-compliant XML upload (CRS, FATCA)
- **Real-time status tracking** — `Draft → Submitted → Validated → Rejected → Transmitted`
- **Detailed error reports** on validation failure with field-level guidance
- **Notification system** — in-app and email alerts for every status change

### For Tax Authorities
- **Submission browser** — filter by FI, jurisdiction, status, date range
- **Validation dashboard** — aggregate pass/fail rates, common error trends
- **Error investigation** — drill down to individual field-level errors with XML context
- **Configurable approval workflow** — reviewer → approver gate before transmission
- **Hot-reloadable jurisdiction rules** — change validation rules at runtime without redeployment

### Analytics & Intelligence
- **Submission trend dashboards** — volume, entity, jurisdiction over time
- **Anomaly detection** — statistical outlier identification, missing data flagging
- **Cross-jurisdiction analysis** — side-by-side country comparison, discrepancy detection
- **Investigation queue** — prioritised anomaly list for enforcement teams

### Security & Compliance
- **End-to-end encryption** — TLS 1.3 in transit, AES-256-GCM at rest
- **Per-jurisdiction public-key encryption** for CTS transmission packages
- **Digital signatures** (XMLDSig) on all transmitted packages
- **Mandatory 2FA** for all users (TOTP-based)
- **Role-based access control** — 6 roles across FI and Tax Authority scopes
- **Immutable audit log** — append-only, tamper-evident event sourcing
- **Data residency controls** — configurable per jurisdiction (PostgreSQL RLS)
- **eIDAS-compatible** authentication for EU deployments

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js 22, TypeScript, NestJS 11 |
| **Frontend** | Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui |
| **Database** | PostgreSQL 16 (JSONB, RLS, partitioned audit logs) |
| **Cache / Queues** | Redis 7, BullMQ |
| **Object Storage** | MinIO (S3-compatible) |
| **XML Validation** | libxmljs2 (XSD), fast-xml-parser |
| **Rules Engine** | json-rules-engine (hot-reloadable from DB) |
| **Search** | PostgreSQL full-text (upgradable to OpenSearch) |
| **Crypto** | Node.js crypto, node-forge (PKCS#7, XMLDSig) |
| **CI/CD** | GitHub Actions |
| **Infrastructure** | Docker Compose (dev), Kubernetes (prod) |

---

## Project Structure

```
Reg-tech/
├── apps/
│   ├── api/                    # NestJS backend (all 5 layers)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # JWT + 2FA + OAuth2
│   │   │   │   ├── fi-portal/      # Layer 1
│   │   │   │   ├── validation/     # Layer 2 (4-stage pipeline)
│   │   │   │   ├── tax-authority/  # Layer 3
│   │   │   │   ├── analytics/      # Layer 4
│   │   │   │   ├── transmission/   # Layer 5
│   │   │   │   ├── storage/        # 3-tier storage (raw/processed/audit)
│   │   │   │   ├── crypto/         # Encryption + digital signing
│   │   │   │   └── event-store/    # Append-only audit events
│   │   │   ├── common/             # Guards, interceptors, middleware, pipes
│   │   │   └── database/           # Migrations + seeds
│   │   └── test/
│   │       ├── e2e/                # 6 E2E test suites
│   │       ├── fixtures/xml/       # 9 OECD XML test files
│   │       └── rest-client/        # .http files for manual testing
│   │
│   ├── fi-portal/              # Next.js — Financial Institution UI
│   └── tax-portal/             # Next.js — Tax Authority UI
│
├── packages/
│   ├── shared/                 # Types, Zod schemas, constants, utils
│   └── ui/                     # Shared component library (shadcn-based)
│
├── infrastructure/
│   ├── docker/                 # Dockerfiles + nginx config
│   └── k8s/                    # Kubernetes manifests
│
├── scripts/
│   ├── setup-mac.sh            # One-command Mac dev setup
│   ├── dev.sh                  # Quick dev startup
│   └── reset-db.sh             # Database reset
│
├── docker-compose.yml          # PostgreSQL + Redis + MinIO
└── .github/workflows/ci.yml    # Lint, type-check, test
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 9
- **Docker** (for PostgreSQL, Redis, MinIO)

### Mac Setup (one command)

```bash
chmod +x scripts/setup-mac.sh && ./scripts/setup-mac.sh
```

This installs all dependencies, starts Docker services, runs migrations, and seeds the database.

### Manual Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Start infrastructure
docker compose up -d

# 4. Run database migrations
pnpm run db:migrate

# 5. Seed with test data
pnpm run db:seed

# 6. Start all apps
pnpm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| **API** (Swagger) | http://localhost:3000/api/docs |
| **FI Portal** | http://localhost:3001 |
| **Tax Authority Portal** | http://localhost:3002 |
| **MinIO Console** | http://localhost:9001 |

### Test Credentials (from seed data)

| Role | Email | Password |
|------|-------|----------|
| FI Admin | compliance@celticfs.ie | RegTech2024! |
| FI User | analyst@celticfs.ie | RegTech2024! |
| TA Admin | admin@revenue.ie | RegTech2024! |
| TA Reviewer | reviewer@revenue.ie | RegTech2024! |
| TA Approver | approver@revenue.ie | RegTech2024! |
| System Admin | sysadmin@regtech.platform | RegTech2024! |

---

## API Overview

### Layer 1 — FI Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/fi/enrol` | Submit FI enrolment application |
| `POST` | `/api/fi/filings` | Create a new filing |
| `POST` | `/api/fi/filings/upload` | Upload OECD XML (CRS/FATCA) |
| `POST` | `/api/fi/filings/:id/submit` | Submit filing for validation |
| `GET` | `/api/fi/filings` | List filings for authenticated FI |
| `GET` | `/api/fi/notifications` | Get notifications |

### Layer 2 — Validation Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/validation/trigger/:filingId` | Trigger 4-stage validation pipeline |
| `GET` | `/api/validation/:filingId/results` | Get validation results (all stages) |
| `POST` | `/api/rules` | Create jurisdiction rule (hot-reloadable) |
| `GET` | `/api/rules` | List all rules (filterable by jurisdiction) |

### Layer 3 — Tax Authority

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ta/submissions` | Browse submissions (paginated, filtered) |
| `POST` | `/api/ta/submissions/:id/approve` | Approve for transmission |
| `POST` | `/api/ta/submissions/:id/reject` | Reject with comments |
| `POST` | `/api/ta/submissions/:id/transmit` | Trigger 7-step transmission pipeline |
| `POST` | `/api/ta/enrolments/:id/approve` | Approve FI enrolment |

### Layer 4 — Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/dashboard` | Dashboard metrics and trends |
| `GET` | `/api/analytics/countries` | Country-by-country comparison |
| `GET` | `/api/analytics/anomalies` | Detected anomalies and risk indicators |
| `POST` | `/api/analytics/search` | Full-text search across filings |

### Layer 5 — Data Transmission Back

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cts/inbound` | Receive inbound CTS package (webhook) |
| `GET` | `/api/transmission/:id/status` | Check outbound transmission + ACK/NACK |
| `GET` | `/api/inbound` | List inbound transmissions |

---

## Validation Pipeline

Every filing passes through a 4-stage validation pipeline:

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ Stage 1  │ →  │   Stage 2    │ →  │   Stage 3   │ →  │   Stage 4    │
│   XSD    │    │  Business    │    │Cross-Record │    │ Jurisdiction │
│Structural│    │   Rules      │    │  Validation │    │   Rules      │
└──────────┘    └──────────────┘    └─────────────┘    └──────────────┘
  OECD CRS/       TIN formats,       Duplicates,        Configurable
  FATCA XSD        country codes,     aggregation,       per-jurisdiction
  compliance       date ranges        referential        hot-reloadable
                                      integrity
```

- **Pass** → filing status becomes `VALIDATED`
- **Fail** → filing status becomes `REJECTED` with detailed error report
- All events logged to the immutable audit trail

---

## Transmission Pipeline (7 Steps)

When a Tax Authority officer triggers transmission:

```
Final Validation → Dataset Lock → XML Packaging → Encryption → Signing → CTS Dispatch → ACK/NACK
```

1. **Final validation** — last-mile checks before packaging
2. **Dataset lock** — filing marked immutable
3. **Package creation** — OECD-compliant XML bundle with metadata
4. **Encryption** — public-key encryption for recipient jurisdiction
5. **Digital signing** — XMLDSig signature for authenticity
6. **CTS transmission** — secure dispatch via OECD Common Transmission System
7. **ACK/NACK receipt** — response logged and surfaced in portal

---

## RBAC Roles

| Role | Scope |
|------|-------|
| `FI_USER` | Create/edit filings, view own submissions |
| `FI_ADMIN` | Manage FI users, initiate enrolment, view all FI filings |
| `TA_REVIEWER` | View submissions, run validation, flag issues |
| `TA_APPROVER` | Approve/reject submissions, approve enrolments, trigger transmission |
| `TA_ADMIN` | Manage TA users, configure jurisdiction rules |
| `SYSTEM_ADMIN` | Full platform access |

---

## Test Data

The platform ships with comprehensive test fixtures:

- **9 OECD XML files** — valid CRS (single, multi, correction), valid FATCA (single, multi), invalid samples for each validation stage
- **Database seed** — 9 organisations, 18 users, 12 filings across all statuses, validation results, 8 jurisdiction rules, transmission packages, notifications, 30 audit events
- **6 E2E test suites** — auth, FI portal, validation, tax authority, analytics, transmission
- **5 REST Client .http files** — ready-to-use API request collections

```bash
# Run all tests
pnpm run test

# Seed the database
pnpm run db:seed

# Reset and reseed
bash scripts/reset-db.sh
```

---

## Development

```bash
# Start everything (Docker + all apps)
bash scripts/dev.sh

# Individual apps
pnpm --filter @reg-tech/api run start:dev     # API      → :3000
pnpm --filter @reg-tech/fi-portal run dev     # FI UI    → :3001
pnpm --filter @reg-tech/tax-portal run dev    # TA UI    → :3002

# Build all
pnpm run build

# Lint
pnpm run lint

# Type check
pnpm run type-check
```

---

## Standards Coverage

| Standard | Support |
|----------|---------|
| **OECD CRS** | XML v2.0 schema validation, full filing lifecycle |
| **FATCA** | XML v2.0 schema validation, US person reporting |
| **DAC6** | Extensible — schema support planned |
| **OECD CTS** | Transmission packaging, encryption, signing, ACK/NACK |
| **eIDAS** | Compatible authentication framework for EU jurisdictions |

---

## Glossary

| Term | Definition |
|------|-----------|
| **CRS** | Common Reporting Standard — OECD framework for automatic exchange of financial account information |
| **CTS** | Common Transmission System — OECD secure channel for bilateral data exchange |
| **FATCA** | Foreign Account Tax Compliance Act — US legislation for foreign FI reporting |
| **FI** | Financial Institution — regulated entity subject to CRS/FATCA reporting |
| **TIN** | Taxpayer Identification Number — jurisdiction-issued identifier |
| **XSD** | XML Schema Definition — validates structure of OECD XML submissions |
| **ACK/NACK** | Acknowledgement / Negative Acknowledgement — CTS response to transmissions |
| **GIIN** | Global Intermediary Identification Number — IRS-issued FI identifier |

---

## License

Confidential. All rights reserved.
