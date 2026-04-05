# Reg-Tech Platform — Comprehensive Implementation Plan

---

## 1. Recommended Tech Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 22 LTS + TypeScript 5.x | Type-safe server runtime |
| Framework | NestJS 11 | Modular API framework with DI, guards, interceptors |
| Rules Engine | json-rules-engine | Hot-reloadable business rules from DB |
| XML Processing | libxmljs2 + fast-xml-parser | XSD validation and XML/XSD parsing |
| Job Queue | BullMQ on Redis | Background validation, transmission, notifications |
| Event Store | PostgreSQL append-only tables (Phase 1) → Kafka (Phase 3+) | Event sourcing and audit trail |
| Cryptography | Node.js crypto + node-forge | PKCS#7 encryption, XML-DSIG digital signatures |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 15 (App Router) + TypeScript | SSR/SSG portal applications |
| UI Library | shadcn/ui + Tailwind CSS 4 | Accessible, themeable component system |
| State / Data | TanStack Query v5 + Zustand | Server state caching + client state management |
| Charts | Recharts + Apache ECharts (Layer 4) | Dashboards and analytics visualisations |
| Forms | React Hook Form + Zod | Performant forms with schema validation |

### Data Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | PostgreSQL 16 (JSONB, RLS, partitioned audit logs) | Relational store with row-level security |
| Cache / Queues | Redis 7 | Session cache, BullMQ backing store |
| Object Storage | MinIO (S3-compatible) | Immutable raw-tier document storage |
| Search | OpenSearch (Layer 4) | Full-text and advanced analytical search |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containers | Docker + Docker Compose (dev) / Kubernetes (prod) | Consistent environments |
| CI/CD | GitHub Actions | Automated testing, linting, deployment |
| Gateway | Traefik (TLS 1.3, rate limiting) | Reverse proxy and edge security |
| Secrets | HashiCorp Vault | Encryption keys, DB credentials, API tokens |
| Observability | OpenTelemetry + Grafana | Distributed tracing, metrics, logging |

---

## 2. Project Structure

```
reg-tech/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── packages/
│   ├── shared/
│   │   └── src/
│   │       ├── types/
│   │       │   ├── fi-portal.ts
│   │       │   ├── filing.ts
│   │       │   ├── validation.ts
│   │       │   ├── transmission.ts
│   │       │   ├── analytics.ts
│   │       │   └── auth.ts
│   │       ├── constants/
│   │       │   ├── country-codes.ts
│   │       │   ├── tin-formats.ts
│   │       │   └── filing-statuses.ts
│   │       ├── schemas/
│   │       │   ├── fi-registration.schema.ts    # Zod
│   │       │   ├── filing.schema.ts             # Zod
│   │       │   ├── user.schema.ts               # Zod
│   │       │   └── rule.schema.ts               # Zod
│   │       └── utils/
│   │           ├── tin-validator.ts
│   │           ├── xml-helpers.ts
│   │           └── crypto-helpers.ts
│   │
│   └── ui/
│       └── src/
│           ├── components/
│           │   ├── data-table.tsx
│           │   ├── status-badge.tsx
│           │   ├── file-upload.tsx
│           │   ├── approval-workflow.tsx
│           │   └── notification-bell.tsx
│           └── layouts/
│               ├── portal-layout.tsx
│               └── authority-layout.tsx
│
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── common/
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts
│   │       │   │   ├── rbac.guard.ts
│   │       │   │   ├── two-factor.guard.ts
│   │       │   │   └── captcha.guard.ts
│   │       │   ├── interceptors/
│   │       │   │   ├── audit-log.interceptor.ts
│   │       │   │   ├── encryption.interceptor.ts
│   │       │   │   └── data-residency.interceptor.ts
│   │       │   ├── decorators/
│   │       │   │   ├── roles.decorator.ts
│   │       │   │   ├── jurisdiction.decorator.ts
│   │       │   │   └── audit-action.decorator.ts
│   │       │   ├── filters/
│   │       │   ├── pipes/
│   │       │   └── middleware/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── fi-portal/
│   │       │   ├── validation/
│   │       │   ├── tax-authority/
│   │       │   ├── analytics/
│   │       │   ├── transmission/
│   │       │   ├── storage/
│   │       │   ├── crypto/
│   │       │   └── event-store/
│   │       └── database/
│   │           ├── migrations/
│   │           └── seeds/
│   │
│   ├── fi-portal/
│   │   └── src/
│   │       └── app/
│   │           ├── (auth)/
│   │           │   ├── login/
│   │           │   ├── register/
│   │           │   └── two-factor/
│   │           └── (dashboard)/
│   │               ├── overview/
│   │               ├── filings/
│   │               ├── enrolment/
│   │               └── notifications/
│   │
│   └── tax-portal/
│       └── src/
│           └── app/
│               ├── (auth)/
│               │   ├── login/
│               │   └── two-factor/
│               └── (dashboard)/
│                   ├── submissions/
│                   ├── validation/
│                   ├── enrolments/
│                   ├── transmission/
│                   ├── analytics/
│                   └── inbound/
│
└── infrastructure/
    ├── docker/
    │   ├── Dockerfile.api
    │   ├── Dockerfile.fi-portal
    │   ├── Dockerfile.tax-portal
    │   └── nginx.conf
    └── k8s/
        ├── namespace.yml
        ├── api-deployment.yml
        ├── fi-portal-deployment.yml
        ├── tax-portal-deployment.yml
        ├── postgres-statefulset.yml
        ├── redis-deployment.yml
        └── minio-deployment.yml
```

---

## 3. Implementation Phases

### Phase 0 — Foundation (Weeks 1–3)

| Deliverable | Details |
|-------------|---------|
| Monorepo scaffold | pnpm workspaces, Turborepo, shared ESLint/Prettier configs |
| Docker Compose | PostgreSQL 16, Redis 7, MinIO — single `docker compose up` |
| NestJS skeleton | App module, config module (dotenv + Joi validation), health check |
| DB migrations | Tables: `users`, `organizations`, `jurisdictions`, `user_roles` |
| Auth module | JWT access/refresh token pair, bcrypt password hashing, TOTP-based 2FA, CAPTCHA verification |
| RBAC guard | 6 roles: `FI_USER`, `FI_ADMIN`, `TA_REVIEWER`, `TA_APPROVER`, `TA_ADMIN`, `SYSTEM_ADMIN` |
| Audit log interceptor | Append-only `audit_events` table — actor, action, resource, timestamp, IP, payload hash |
| Shared types package | TypeScript interfaces and Zod schemas consumed by all apps |
| CI pipeline | GitHub Actions: lint, type-check, unit tests, build, Docker image push |

### Phase 1 — Layer 1: FI Portal (Weeks 4–7)

| Deliverable | Details |
|-------------|---------|
| Enrolment / Registration | FI submits enrolment request; TA reviews and approves/rejects; status machine: `Pending → Approved / Rejected` |
| Filing CRUD | Create, read, update, delete filings with status machine: `Draft → Submitted → Validated → Rejected → Transmitted` |
| XML upload | Multipart upload endpoint → immutable storage in MinIO; file hash recorded in DB |
| Manual entry API | Structured JSON input for account-by-account data entry |
| Notification service | In-app notification bell + email (SMTP) for status changes, approvals, errors |
| FI Portal frontend | Next.js 15 App Router: auth pages, dashboard, filing management, enrolment wizard |
| CAPTCHA + OAuth2 | CAPTCHA on public forms; optional OAuth2/OIDC provider integration |

### Phase 2 — Layer 2: Validation Engine (Weeks 8–12)

| Deliverable | Details |
|-------------|---------|
| Stage 1: XSD validation | libxmljs2 validates uploaded XML against official OECD CRS/FATCA schemas |
| Stage 2: Business rules | TIN format validation per country, ISO country code checks, date range plausibility |
| Stage 3: Cross-record validation | Duplicate account detection, aggregation balance checks, referential integrity across reporting FIs |
| Stage 4: Jurisdiction rules engine | json-rules-engine with rules stored in PostgreSQL; hot-reload on rule change; versioned with effective dates |
| Validation orchestrator | BullMQ pipeline: Stage 1 → 2 → 3 → 4; parallel where possible; partial results saved per stage |
| Three-tier storage | **Raw** (MinIO original upload) → **Processed** (normalised XML) → **Audit** (validation trace logs) |
| Rules management API | CRUD for rules with versioning, effective/expiry dates, jurisdiction scoping, import/export |

### Phase 3 — Layer 3: Tax Authority Portal (Weeks 13–18)

| Deliverable | Details |
|-------------|---------|
| Tax Authority frontend | Next.js 15 App Router with `authority-layout`; role-gated navigation |
| Submission browser | Filterable data table: by FI, jurisdiction, status, date range, reporting period |
| Validation dashboard | Aggregate pass/fail rates, common error categories, trend charts |
| Error investigation UI | Drill-down from summary → filing → individual validation error with XML context |
| Approval workflow | Two-step: `TA_REVIEWER` marks "Reviewed" → `TA_APPROVER` marks "Approved for Transmission" |
| FI enrolment approval | TA reviews FI enrolment applications; approve, reject, or request more information |
| Transmission pipeline | 7-step process: (1) Final re-validation → (2) Dataset lock (immutable snapshot) → (3) OECD XML packaging → (4) Public-key encryption (PKCS#7, per-jurisdiction key) → (5) Digital signing (XMLDSig) → (6) CTS dispatch → (7) ACK/NACK receipt polling |

### Phase 4 — Layer 4: Analytics & Insights (Weeks 19–23)

| Deliverable | Details |
|-------------|---------|
| Dashboards | Submission volume trends, country-by-country comparison charts, per-FI compliance metrics |
| Advanced search | OpenSearch integration for full-text search across filings, validation errors, transmission logs |
| Risk / anomaly detection | Flag unusual patterns (sudden drops, missing data, statistical outliers vs. historical norms) |
| Cross-jurisdiction analysis | Compare reporting patterns across jurisdictions; identify coverage gaps |
| Export | CSV and PDF report generation for dashboards and search results |
| Investigation queue | Priority-ranked list of anomalies for TA analysts; assign, annotate, resolve workflow |

### Phase 5 — Layer 5: Data Transmission Back (Weeks 24–27)

| Deliverable | Details |
|-------------|---------|
| CTS polling / webhook | Poll CTS gateway or receive webhook callbacks for inbound packages |
| ACK/NACK processing | Parse acknowledgement/rejection messages; propagate status back to filings and FIs |
| Inbound package receipt | Receive encrypted+signed XML packages from partner jurisdictions |
| Signature verification & decryption | Verify XMLDSig signature against partner certificate; decrypt PKCS#7 payload |
| Structural validation | Validate inbound XML against OECD schemas; flag structural or content errors |
| Data ingestion | Parse and store inbound account data; link to local taxpayer records where possible |
| Result distribution | Notify relevant FIs and tax authority users of received data; role-gated access |
| Error routing & remediation | Route inbound errors to appropriate team with remediation guidance |
| Feed to Layer 4 analytics | Inbound data flows into analytics dashboards and anomaly detection |

---

## 4. Database Schema

### Key Entities

```sql
-- Organizations (Financial Institutions and Tax Authorities)
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    org_type        TEXT NOT NULL CHECK (org_type IN ('FI', 'TAX_AUTHORITY')),
    jurisdiction    TEXT NOT NULL,             -- ISO 3166-1 alpha-2
    giin            TEXT,                      -- Global Intermediary Identification Number
    enrolment_status TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (enrolment_status IN ('PENDING','APPROVED','REJECTED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    totp_secret     TEXT,                      -- TOTP 2FA secret (encrypted at rest)
    role            TEXT NOT NULL CHECK (role IN (
                        'FI_USER','FI_ADMIN',
                        'TA_REVIEWER','TA_APPROVER','TA_ADMIN',
                        'SYSTEM_ADMIN')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filings
CREATE TABLE filings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    reporting_period TEXT NOT NULL,            -- e.g. '2025'
    filing_type     TEXT NOT NULL,             -- 'CRS', 'FATCA', etc.
    status          TEXT NOT NULL DEFAULT 'DRAFT'
                     CHECK (status IN ('DRAFT','SUBMITTED','VALIDATED',
                                       'REJECTED','TRANSMITTED')),
    submitted_by    UUID REFERENCES users(id),
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Filing Documents (stored in MinIO)
CREATE TABLE filing_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id       UUID NOT NULL REFERENCES filings(id),
    storage_key     TEXT NOT NULL,             -- MinIO object key
    file_hash       TEXT NOT NULL,             -- SHA-256 of original file
    file_size       BIGINT NOT NULL,
    content_type    TEXT NOT NULL,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation Results
CREATE TABLE validation_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id       UUID NOT NULL REFERENCES filings(id),
    stage           TEXT NOT NULL CHECK (stage IN (
                        'XSD','BUSINESS_RULES','CROSS_RECORD','JURISDICTION')),
    status          TEXT NOT NULL CHECK (status IN ('PASS','FAIL','WARNING')),
    errors          JSONB NOT NULL DEFAULT '[]',
    warnings        JSONB NOT NULL DEFAULT '[]',
    executed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    rule_version    TEXT                       -- version of rule set used
);

-- Jurisdiction Rules (hot-reloadable)
CREATE TABLE jurisdiction_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction    TEXT NOT NULL,
    rule_name       TEXT NOT NULL,
    rule_definition JSONB NOT NULL,            -- json-rules-engine format
    version         INT NOT NULL DEFAULT 1,
    effective_from  DATE NOT NULL,
    effective_to    DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval Actions
CREATE TABLE approval_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type     TEXT NOT NULL CHECK (target_type IN ('FILING','ENROLMENT')),
    target_id       UUID NOT NULL,
    action          TEXT NOT NULL CHECK (action IN (
                        'REVIEWED','APPROVED','REJECTED','INFO_REQUESTED')),
    performed_by    UUID NOT NULL REFERENCES users(id),
    comments        TEXT,
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transmission Packages
CREATE TABLE transmission_packages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filing_id       UUID NOT NULL REFERENCES filings(id),
    destination     TEXT NOT NULL,             -- target jurisdiction
    package_key     TEXT NOT NULL,             -- MinIO key for encrypted package
    signature       TEXT,                      -- XMLDSig signature reference
    status          TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','DISPATCHED','ACK','NACK','ERROR')),
    dispatched_at   TIMESTAMPTZ,
    ack_received_at TIMESTAMPTZ,
    ack_payload     JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inbound Transmissions (Layer 5)
CREATE TABLE inbound_transmissions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_jurisdiction TEXT NOT NULL,
    package_key         TEXT NOT NULL,         -- MinIO key for received package
    signature_valid     BOOLEAN,
    decryption_ok       BOOLEAN,
    structural_valid    BOOLEAN,
    ingestion_status    TEXT NOT NULL DEFAULT 'RECEIVED'
                         CHECK (ingestion_status IN (
                             'RECEIVED','VERIFIED','DECRYPTED','VALIDATED',
                             'INGESTED','ERROR')),
    error_details       JSONB,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at        TIMESTAMPTZ
);

-- Audit Events (append-only, partitioned by month)
CREATE TABLE audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID,
    actor_role      TEXT,
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     UUID,
    jurisdiction    TEXT,
    ip_address      INET,
    payload_hash    TEXT,                      -- SHA-256 of request payload
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Notifications
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL,             -- 'STATUS_CHANGE','APPROVAL','ERROR', etc.
    title           TEXT NOT NULL,
    body            TEXT,
    resource_type   TEXT,
    resource_id     UUID,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. Key API Endpoints

### Layer 1 — FI Portal

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/fi/enrol` | Submit FI enrolment application |
| `GET` | `/api/fi/enrolment/:id/status` | Check enrolment status |
| `POST` | `/api/fi/filings` | Create a new filing (manual entry) |
| `POST` | `/api/fi/filings/upload` | Upload XML filing (multipart) |
| `GET` | `/api/fi/filings` | List filings for the authenticated FI |
| `GET` | `/api/fi/filings/:id` | Get filing details with validation status |
| `GET` | `/api/fi/notifications` | Get in-app notifications for current user |

### Layer 2 — Validation Engine

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/validation/trigger/:filingId` | Trigger full validation pipeline for a filing |
| `GET` | `/api/validation/:filingId/results` | Retrieve validation results (all stages) |
| `GET` | `/api/rules` | List all jurisdiction rules (filterable) |
| `POST` | `/api/rules` | Create a new jurisdiction rule |
| `PUT` | `/api/rules/:id` | Update an existing rule (creates new version) |
| `DELETE` | `/api/rules/:id` | Deactivate a rule |

### Layer 3 — Tax Authority Portal

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/ta/submissions` | Browse all submissions (filterable, paginated) |
| `GET` | `/api/ta/validation/dashboard` | Aggregate validation statistics |
| `POST` | `/api/ta/submissions/:id/approve` | Approve a submission for transmission |
| `POST` | `/api/ta/submissions/:id/reject` | Reject a submission with comments |
| `POST` | `/api/ta/submissions/:id/transmit` | Initiate 7-step transmission pipeline |
| `POST` | `/api/ta/enrolments/:id/approve` | Approve or reject an FI enrolment |

### Layer 4 — Analytics & Insights

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/analytics/dashboard` | Aggregated dashboard metrics and trends |
| `GET` | `/api/analytics/countries` | Country-by-country comparison data |
| `GET` | `/api/analytics/anomalies` | Detected anomalies and risk indicators |
| `POST` | `/api/analytics/search` | Advanced full-text search (OpenSearch) |

### Layer 5 — Data Transmission Back

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/cts/inbound` | Receive inbound package from CTS (webhook) |
| `GET` | `/api/transmission/:id/status` | Check outbound transmission status and ACK/NACK |
| `GET` | `/api/inbound` | List inbound transmissions (filterable, paginated) |

---

## 6. Security Architecture

### Transport & Edge

- **TLS 1.3** enforced at the Traefik gateway; no fallback to older TLS versions
- **Rate limiting** per IP and per authenticated user at the gateway layer
- **CAPTCHA** (hCaptcha/reCAPTCHA) on all public-facing forms (login, registration, enrolment)

### Authentication

- **JWT** access tokens with short expiry (15 min) + long-lived refresh tokens (7 days, rotated on use)
- **Mandatory 2FA** via TOTP (RFC 6238) for all users; enforced at the guard level
- **OAuth2 / OIDC** optional federation for enterprise SSO

### Authorisation

- **Role-Based Access Control (RBAC)** with 6 roles:

| Role | Scope |
|------|-------|
| `FI_USER` | Create/edit filings, view own submissions and notifications |
| `FI_ADMIN` | Manage FI users, initiate enrolment, view all FI filings |
| `TA_REVIEWER` | View all submissions, run validation, flag issues |
| `TA_APPROVER` | Approve/reject submissions, approve FI enrolments, initiate transmission |
| `TA_ADMIN` | Manage TA users, configure jurisdiction rules, system settings |
| `SYSTEM_ADMIN` | Full platform access, infrastructure management, audit log access |

- Jurisdiction-scoped guards ensure users can only access data within their assigned jurisdiction

### Encryption & Signing

- **Per-jurisdiction public-key encryption** (PKCS#7) for outbound transmission packages
- **XMLDSig digital signatures** on all transmitted packages; certificates managed in HashiCorp Vault
- **At-rest encryption** for sensitive fields (TOTP secrets, PII) using AES-256-GCM

### Audit & Compliance

- **Append-only audit log** (`audit_events` table) — every API mutation is logged with actor, action, resource, timestamp, IP address, and payload hash
- **Tamper-evident** design: payload hashing prevents silent modification of audit records
- **Data residency** enforced via PostgreSQL Row-Level Security (RLS) policies tied to jurisdiction
- **eIDAS-compatible** digital signature and identification framework for EU jurisdictions
- **Partitioned audit tables** by month for efficient querying and retention management
