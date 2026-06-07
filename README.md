# Reg-Tech — AEOI Tax Information Reporting Platform

**Automatic Exchange of Information (AEOI) Portal for Bermuda & Bahamas**

A multi-jurisdiction regulatory technology platform enabling Financial Institutions to enrol, file, and manage their CRS, FATCA, and CbC reporting obligations — and enabling Tax Authorities to validate, approve, transmit, and monitor data exchange with partner jurisdictions via the OECD Common Transmission System (CTS).

---

## Jurisdictions

| Jurisdiction | Reporting Regimes | Tax Authority |
|---|---|---|
| **Bermuda** | CRS + CbC | Ministry of Finance (MoF) |
| **Bahamas** | CRS + FATCA + CbC | Competent Authority |

Both portals share a common platform spine (~70% shared code) with jurisdiction-specific features branching where regulations diverge.

---

## End-to-End User Flows

### Flow A — FI Enrolment & Onboarding

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│  FI Access  │ ──► │  CAPTCHA +   │ ──► │  Submit      │ ──► │  Tax Auth │
│  Enrol Link │     │  Fill Form   │     │  Enrolment   │     │  Reviews  │
└─────────────┘     └──────────────┘     └──────────────┘     └───────────┘
                                                                     │
                              ┌───────────────────────────────────────┤
                              ▼                                       ▼
                    ┌──────────────┐                         ┌──────────────┐
                    │   APPROVED   │                         │   REJECTED   │
                    │  Credentials │                         │  With Reason │
                    │  via Email   │                         └──────────────┘
                    └──────────────┘
```

**Step-by-Step:**

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | FI | Access public enrolment link | CAPTCHA challenge presented |
| 2 | FI | Pass CAPTCHA, click "Next" | Enrolment form displayed |
| 3 | FI | Complete form: Entity Name, Type, Reporting Type (CRS/CbC/FATCA), GIIN, address, Primary User details | Client-side validation (UPE/SPE suffix for CbC, FYE required for CbC) |
| 4 | FI | Upload required documents (passport, director letter) | Files scanned (AV) and stored |
| 5 | FI | Submit enrolment | Status = `PENDING`; confirmation email sent |
| 6 | Tax Authority | Review enrolment (approve/reject/request info) | Decision recorded |
| 7a | System | If APPROVED → generate temp credentials | Activation email with username + temp password |
| 7b | System | If REJECTED → notify with reason | Rejection email sent |

**Bermuda-specific:** Entity types include FI, Trust, Multinational (CbC). TDTs registered under Trustee.
**Bahamas-specific:** Adds FATCA GIIN capture, Non-Reporting FI flag, TDT profile with dedicated trustee fields.

---

### Flow B — Login & Authentication

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Enter   │ ──► │ Password │ ──► │  2FA     │ ──► │  Dashboard   │
│  Email   │     │  Verify  │     │  (TOTP)  │     │  (Entity)    │
└──────────┘     └──────────┘     └──────────┘     └──────────────┘
```

| Step | Action | Detail |
|------|--------|--------|
| 1 | Enter email + password | First login forces password change |
| 2 | 2FA challenge (Bermuda) | TOTP via authenticator app (mandatory) |
| 3 | Entity selection | If user has access to multiple entities |
| 4 | Dashboard displayed | Draft filings, notifications, entity profile |

**Bermuda-specific:** Mandatory TOTP 2FA with QR setup, self-reset, primary-resets-secondary paths.
**Bahamas:** Password-only login (no mandatory 2FA in current guide).

---

### Flow C — CRS Filing Submission

```
┌────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Create    │ ──► │  Choose Mode │ ──► │  Validate    │ ──► │   Submit     │
│  Filing    │     │  XML/Manual  │     │  (Pre-Sub)   │     │   Filing     │
└────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| Step | Actor | Action | Detail |
|------|-------|--------|--------|
| 1 | FI | Create Filing | Name, Type=CRS, Period end date (Dec 31) |
| 2 | FI | Choose input mode | **XML Upload** or **Manual Entry** |
| 3a | FI | XML Upload | Upload OECD CRS XML v2.0 file (≤50MB) |
| 3b | FI | Manual Entry | Fill Account Holder, Account, Payment forms per record |
| 4 | System | Pre-submission validation | XSD + business rules + DocRefID format |
| 5 | FI | Review validation issues | Fix errors (blocking) or acknowledge warnings |
| 6 | FI | Click "Validate & Submit" | Filing status → `SUBMITTED` |
| 7 | System | Confirm submission | Receipt email sent |

**CRS Filing Types:**
- **New Data** (CRS701) — initial submission
- **Corrected Data** (CRS702) — corrections referencing CorrDocRefID
- **Nil Filing** — no reportable accounts
- **Undocumented Accounts** — domestic reporting

**Manual Entry Fields:**
- Reporting FI: Name, TIN, Address, Country
- Account Holder: Name, Address, TIN, DOB, Residence Country
- Account: Number, Type (Depository/Custodial/Equity/Debt/Insurance/Annuity/Other), Balance, Currency
- Payments: Dividends, Interest, Gross Proceeds, Other

---

### Flow D — FATCA Filing Submission (Bahamas Only)

| Step | Action | Detail |
|------|--------|--------|
| 1 | Create FATCA Filing | Name, Type=FATCA, Period end date |
| 2 | Upload IRS FATCA XML v2.0 | Or manual entry with Sponsored Entity folders |
| 3 | System validates against IRS schema | FATCA-specific rules (US TIN mandatory, GIIN format) |
| 4 | Submit filing | Status → `SUBMITTED` |

**FATCA Filing Types:**
- FATCA701 — New Data
- FATCA702 — Amended Data
- FATCA703 — Void Data
- FATCA704 — Corrected Data

---

### Flow E — CbC Filing Submission

| Step | Action | Detail |
|------|--------|--------|
| 1 | Create CbC Filing | Name, Type=CbC, Reporting Period (FY end) |
| 2 | Upload OECD CbC XML v1.0.1 | XML upload only (no manual entry) |
| 3 | System validates against CbC XSD | DocRefID format, MessageTypeIndic checks |
| 4 | Submit filing | Status → `SUBMITTED` |

**Bahamas-specific:** Requires Article 3 Notification filing (reporting role declaration) before CbC submission.

---

### Flow F — Validation Pipeline (Pre-Submission)

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Stage 1   │ ──► │  Stage 2   │ ──► │  Stage 3   │ ──► │  Stage 4   │
│  XSD       │     │  Business  │     │  DocRef    │     │  Jurisd.   │
│  Schema    │     │  Rules     │     │  Integrity │     │  Rules     │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

| Stage | Checks | Example Errors |
|-------|--------|----------------|
| **XSD Schema** | XML structure against OECD CRS/FATCA/CbC XSD | Missing elements, invalid types, malformed dates |
| **Business Rules** | TIN format per jurisdiction, country codes, date ranges, mandatory fields | Invalid DE TIN (not 11 digits), empty AccountHolder name |
| **DocRefID Integrity** | Format validation, CorrDocRefID references, no duplicate DocRefIDs | Unknown CorrDocRefID, duplicate in same message |
| **Jurisdiction Rules** | Bermuda/Bahamas-specific constraints (period=Dec 31, UPE/SPE suffix) | CRS period not Dec 31, CbC entity missing (UPE) suffix |

**Validation Outcomes:**
- **Errors** (blocking) — must be fixed before submission
- **Warnings** (non-blocking) — can be acknowledged and overridden

---

### Flow G — Tax Authority Review & Transmission

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  TA Login  │ ──► │  Filter &  │ ──► │  Approve / │ ──► │  Transmit  │
│  + 2FA     │     │  Browse    │     │  Reject    │     │  via CTS   │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

| Step | Actor | Action | Detail |
|------|-------|--------|--------|
| 1 | TA | Login with CAPTCHA + password + 2FA | Access governance dashboard |
| 2 | TA | Apply filters | Reporting period, destination country, module (CRS/CbC/FATCA), status |
| 3 | TA | Select filings (single or batch) | Multi-select validated filings |
| 4 | TA | Click "Transmit" | Initiates 7-step transmission pipeline |

---

### Flow H — Transmission Pipeline (7 Steps)

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Final   │──►│ Dataset │──►│ Package │──►│Encrypt  │──►│  Sign   │──►│  SFTP   │──►│ ACK/    │
│ Valid.  │   │  Lock   │   │ Create  │   │(Pub Key)│   │(Priv Key│   │ to CTS  │   │ NACK    │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

| Step | Action | Technical Detail |
|------|--------|-----------------|
| 1 | **Final Validation** | Last-mile XSD + rule checks before packaging |
| 2 | **Dataset Lock** | Filing marked immutable; no further edits |
| 3 | **Package Creation** | OECD-compliant XML bundle + metadata (sender, receiver, timestamp, MessageRefID) |
| 4 | **Encryption** | RSA-OAEP + AES-256-CBC hybrid encryption using receiving country's public key certificate |
| 5 | **Digital Signing** | XMLDSig RSA-SHA256 using sender's private key |
| 6 | **SFTP Transfer** | Encrypted package uploaded to receiving country's CTS outbox folder |
| 7 | **ACK/NACK Receipt** | Monitor for acknowledgement or rejection from partner jurisdiction |

**On ACK:** Filing marked "Successfully Transmitted"
**On NACK:** Filing marked "Rejected" with error details; FI notified for correction

---

### Flow I — Receiving Country Inbound (Data Back)

```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Monitor │──►│Download  │──►│ Decrypt │──►│Validate │──►│Generate │──►│  Send   │
│  Inbox  │   │ Package  │   │(Priv Key│   │  XSD    │   │ACK/NACK │   │ Status  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

| Step | Action | Detail |
|------|--------|--------|
| 1 | Poll/webhook CTS inbox | Scheduled (every 4 hours) + webhook fallback |
| 2 | Download incoming package | Store in local "Received" folder (MinIO) |
| 3 | Decrypt | Using our jurisdiction's private key |
| 4 | Validate | XSD schema + signature verification |
| 5 | Generate status | ACK (accepted) or NACK (rejected with error codes) |
| 6 | Send status back | Encrypt with source country's public key, sign, upload to CTS status outbox |
| 7 | Ingest data | Parse and store for analytics; notify relevant teams |

---

### Flow J — Error Correction (CRS/CbC/FATCA)

When a partner jurisdiction sends back a NACK with record errors:

| Step | Actor | Action | Detail |
|------|-------|--------|--------|
| 1 | System | Display error notifications | Error codes (80001-80011) with descriptions |
| 2 | FI | View transmission progress | See which records were accepted/rejected |
| 3 | FI | Create "Corrected" filing | MessageTypeIndic = CRS702/CBC402/FATCA704 |
| 4 | FI | Reference original DocRefID | CorrDocRefID points to the errored record |
| 5 | FI | Submit correction | Within 60 days of error notification |
| 6 | System | Re-validate and re-transmit | Full pipeline repeats for correction |

**Common CRS Error Codes:**

| Code | Name | Description |
|------|------|-------------|
| 80001 | DocRefID format | Structure not in correct format |
| 80002 | CorrDocRefId unknown | References a record that doesn't exist |
| 80003 | CorrDocRefId no longer valid | Record already invalidated |
| 80004 | CorrDocRefId for new data | New record shouldn't have CorrDocRefID |
| 80005 | Missing CorrDocRefId | Correction missing the reference |
| 80010 | MessageTypeIndic | Mixed new + corrected records (not allowed) |
| 80011 | CorrDocRefID duplicate | Same record corrected twice in one message |

---

### Flow K — User & Entity Management

| Action | Who | Detail |
|--------|-----|--------|
| Create Secondary Users | Primary User | Up to 2 secondary users with same permissions (except user management) |
| Update/Deactivate Users | Primary User | Edit details, set Inactive to revoke access |
| Change Primary User | Primary/Secondary | Submit Primary User Change Notice via portal |
| Deactivate Entity | Primary User | Submit Deactivation Form with evidence (certificate, deed, letter) |
| Update Entity Details | Primary User | Submit Change of Reporting Entity Information Form |

---

### Flow L — Audit & Compliance Trail

Every action generates an immutable audit event:

| Event Type | Fields Captured |
|------------|-----------------|
| User login | actor, timestamp, IP, success/failure |
| Filing create/edit/submit | actor, filing_id, action, payload_hash |
| Validation run | filing_id, stage, result, errors |
| Approval action | actor, target, decision, comments |
| Transmission dispatch | filing_id, destination, package_ref, timestamp |
| ACK/NACK receipt | transmission_id, status, error_codes |
| Inbound reception | source, package_ref, validation_result |
| User management | actor, target_user, action |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic |
| **Frontend** | React 18, Next.js 15, react-hook-form, Zod, Tailwind CSS |
| **Database** | PostgreSQL 16 (WORM audit tables, JSONB rules) |
| **Cache / Queues** | Redis, Celery or BullMQ |
| **Object Storage** | S3 / MinIO (raw XML, encrypted packages, documents) |
| **XML Validation** | lxml (XSD), OECD CRS v2.0, FATCA v2.0, CbC v1.0.1 schemas |
| **Auth** | JWT + TOTP (pyotp), reCAPTCHA, session management |
| **Crypto** | RSA-OAEP + AES-256-CBC, XMLDSig, per-jurisdiction key management |
| **SFTP** | paramiko / ssh2 for CTS transmission |
| **Testing** | pytest, testcontainers, Playwright, lxml contract tests |
| **CI/CD** | GitHub Actions, Docker, Kubernetes |
| **Observability** | Sentry, structlog, Prometheus |

---

## Project Structure

```
reg-tech/
├── README.md
├── docs/
│   ├── bermuda/
│   │   ├── Bermuda_Portal_User_Guide_v8.pdf
│   │   └── Bermuda_Portal_Flowcharts.pdf
│   ├── bahamas/
│   │   └── (Bahamas portal guide — to be added)
│   └── shared/
│       └── Bermuda_and_Bahamas_Backlogs.xlsx
│
├── backend/                          # FastAPI API (Python)
│   ├── app/
│   │   ├── main.py                   # FastAPI app + middleware
│   │   ├── config.py                 # Pydantic Settings
│   │   ├── models/                   # SQLAlchemy models
│   │   ├── schemas/                  # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── auth/                 # Login, 2FA, password reset
│   │   │   ├── enrolment/           # Enrol, approve, reject
│   │   │   ├── filings/             # Create, upload, submit, validate
│   │   │   ├── transmission/        # CTS dispatch, ACK/NACK, inbound
│   │   │   ├── admin/               # User management, entity management
│   │   │   └── analytics/           # Dashboard, search, anomalies
│   │   ├── services/
│   │   │   ├── validation/          # 4-stage pipeline
│   │   │   ├── transmission/        # 7-step CTS pipeline
│   │   │   ├── crypto/              # Encryption, signing, key mgmt
│   │   │   ├── sftp/                # CTS SFTP transport
│   │   │   ├── email/               # Notification dispatch
│   │   │   └── storage/             # S3/MinIO file operations
│   │   ├── rules/                    # Jurisdiction-specific rule configs
│   │   │   ├── bermuda/
│   │   │   └── bahamas/
│   │   └── audit/                    # Append-only event store
│   ├── migrations/                   # Alembic migrations
│   ├── tests/
│   │   ├── fixtures/                 # XML test files (CRS, FATCA, CbC)
│   │   ├── e2e/
│   │   └── unit/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                         # React/Next.js Portal UI
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/            # Enrolment form (no auth)
│   │   │   ├── (auth)/             # Login, 2FA, password reset
│   │   │   └── (portal)/           # Authenticated portal
│   │   │       ├── dashboard/
│   │   │       ├── filings/         # Create, upload, view, submit
│   │   │       ├── submissions/     # TA: browse, approve, transmit
│   │   │       ├── transmission/    # Transmission status, inbound
│   │   │       ├── corrections/     # Error review + correction workflow
│   │   │       ├── admin/           # User + entity management
│   │   │       └── analytics/       # Dashboards (TA only)
│   │   ├── components/
│   │   └── lib/
│   ├── package.json
│   └── Dockerfile
│
├── infrastructure/
│   ├── docker-compose.yml
│   ├── k8s/
│   └── terraform/
│
├── schemas/                          # OECD XSD schemas (vendored)
│   ├── crs/CrsXML_v2.0.xsd
│   ├── fatca/FatcaXML_v2.0.xsd
│   └── cbc/CbcXML_v1.0.1.xsd
│
└── .github/
    └── workflows/ci.yml
```

---

## Implementation Phases

### Phase 0 — Foundation (T-001 → T-009 / B-001 → B-009)

| Task | Description | Classification |
|------|-------------|----------------|
| Repo + CI/CD | Monorepo, branch protection, lint+test on PR, CD to staging | Shared |
| Environments + Secrets | Pydantic Settings, Vault/Doppler integration | Shared |
| Database + Migrations | PostgreSQL provisioning, Alembic baseline | Shared |
| Audit-Log Spine | Append-only WORM table, auto-log mutations | Shared |
| RBAC + Permissions | Roles (Primary/Secondary/Admin), deny-by-default policy | Shared |
| Security Hardening | Rate limiting, CORS, security headers, encryption at rest | Shared |
| Observability | Sentry, structlog, Prometheus, /health endpoint | Shared |
| Test Harness | pytest, testcontainers, XSD contract tests, E2E scenario | Shared |
| Backups + DR | Daily snapshots, restore drill, RTO/RPO documentation | Shared |

### Phase 1 — Enrolment (T-101 → T-107 / B-101 → B-108)

| Task | Description | Classification |
|------|-------------|----------------|
| Enrolment Model | Entity + PrimaryUser models, UPE/SPE rules, FYE validation | Shared w/ variance |
| TDT Profile | Trustee-Documented Trust handling | Shared w/ variance |
| File Upload + AV Scan | Presigned URLs, ClamAV scan, type/size guards | Shared |
| Submit + Dedupe | Create PENDING, 409 on duplicate, status machine | Shared |
| Approval Workflow | Approve/reject endpoints, credential issuance, email dispatch | Shared |
| Enrolment Form + CAPTCHA | Multi-section React form, reCAPTCHA, client validation | Shared w/ variance |
| Upload Widget | Dropzone, progress, require passport + letter | Shared |
| Status Screen | Enrolment status display, rejection reason banner | Shared w/ variance |

### Phase 2 — Authentication (T-201 → T-206 / B-201 → B-205)

| Task | Description | Classification |
|------|-------------|----------------|
| Login + JWT | Auth + identity mapping, lockout after failures | Shared |
| TOTP 2FA | Secret provisioning, QR code, verify + enforce | **Bermuda-only** |
| 2FA Reset Paths | Self-reset, primary-resets-secondary, multi-entity guard | **Bermuda-only** |
| Password Reset | Forgot-password email, reset with policy enforcement | Shared |
| Login Screens | Login UI, QR setup, code entry | Shared w/ variance |
| Forgot Password Flow | Email entry, new password screen | Shared |

### Phase 3 — CRS Filing (T-301 → T-313 / B-301 → B-310)

| Task | Description | Classification |
|------|-------------|----------------|
| Filing Lifecycle Model | Filing model, Dec-31 rule, status machine (DRAFT→SUBMITTED) | Shared |
| CRS XML Upload + Validation | XSD validation via lxml, error extraction | Shared |
| CRS Manual Entry | Account holder, account, payment data persistence | Shared |
| DocRefID Generator | Country-prefixed unique ID generation (BM vs BS) | Shared w/ variance |
| CRS Nil Filing | Nil filing submission flow | Shared |
| CRS Undocumented Accounts | Domestic reporting for undocumented accounts | Shared |
| Filing Wizard | Create filing UI flow | Shared |
| CRS Manual Entry Forms | React forms for account data | Shared |
| CRS XML Upload UI | Upload + result display | Shared |
| Delete Draft | Service + UI for deleting unsubmitted filings | Shared |

### Phase 4 — Validation Engine (T-501 → T-508 / B-401 → B-404)

| Task | Description | Classification |
|------|-------------|----------------|
| Rule Engine Core | Configurable rule evaluation framework | Shared |
| CRS Validation Rules | General, Reporting-FI, Account, Corrected-filing rules | Shared |
| CbC Validation Rules | CbC-specific XSD + business rule checks | Shared |
| Warning Override Log | Non-blocking warning acknowledgement system | Shared |
| Validation Issues Page | Error/warning display with field-level detail | Shared |

### Phase 5 — FATCA (Bahamas Only: B-501 → B-507)

| Task | Description | Classification |
|------|-------------|----------------|
| FATCA Filing Model | FATCA-specific filing entity with IRS schema | **Bahamas-only** |
| FATCA XML Upload | IRS FATCA v2.0 XSD validation | **Bahamas-only** |
| FATCA Manual Entry | Sponsored-entity folders, pool reports | **Bahamas-only** |
| FATCA Amended/Void/Corrected | FATCA702, FATCA703, FATCA704 flows | **Bahamas-only** |
| FATCA Validation Rules | US TIN mandatory, GIIN format, etc. | **Bahamas-only** |

### Phase 6 — CTS Transmission (T-601 → T-605 / B-601 → B-605)

| Task | Description | Classification |
|------|-------------|----------------|
| Transmission Pipeline | 7-step: validate → lock → package → encrypt → sign → SFTP → ACK | Shared |
| SFTP Transport | Per-jurisdiction SFTP config, upload/download, retry logic | Shared |
| ACK/NACK Handler | Parse responses, update filing status, notify FI | Shared |
| CTS Polling | Scheduled inbox monitoring + manual poll trigger | Shared |
| Status Response Service | Generate + send ACK/NACK back to source jurisdiction | Shared |

### Phase 7 — CbC (T-401 → T-404 / B-701 → B-705)

| Task | Description | Classification |
|------|-------------|----------------|
| CbC Filing Create | Filing creation with UPE/SPE context | Shared w/ variance |
| CbC Article 3 Notification | Reporting role declaration filing | **Bahamas-only** |
| CbC XML Validation | CbC XSD v1.0.1 + DocRefID checks | Shared |
| CbC Upload Screen | XML upload UI for CbC filings | Shared |

### Phase 8 — Error Handling & Corrections (T-601+ / B-601+)

| Task | Description | Classification |
|------|-------------|----------------|
| Transmission Progress View | Display per-record acceptance/rejection from CTS | Shared |
| Error Notification Display | Show error codes (80001-80011) with descriptions | Shared |
| Correction Filing Flow | Create corrected filing referencing CorrDocRefID | Shared |
| Correction Submission | Submit correction within 60-day window | Shared |

### Phase 9 — Admin & Lifecycle (T-801 → T-806 / B-801 → B-906)

| Task | Description | Classification |
|------|-------------|----------------|
| Secondary User Management | Create, update, deactivate secondary users | Shared |
| Primary User Change Notice | Form submission + MoF approval workflow | Shared |
| Entity Deactivation | Deactivation form with evidence + MoF review | Shared |
| Update Entity Details | Change of Reporting Entity Information form | Shared |
| Submission History | View all submitted filings, download XML | Shared |
| CRS Compliance Certification | Annual compliance form (Bermuda) | **Bermuda-only** |

---

## RBAC Roles

| Role | Permissions |
|------|------------|
| **Primary User** | Full access: filings, user management, entity changes, deactivation |
| **Secondary User** | Same as Primary except: cannot manage users, cannot submit entity changes |
| **Admin (Tax Authority)** | Review enrolments, approve/reject, manage transmission, view all data |

---

## Bermuda vs Bahamas — Key Differences

| Feature | Bermuda | Bahamas |
|---------|---------|---------|
| **Reporting Regimes** | CRS + CbC | CRS + FATCA + CbC |
| **2FA** | Mandatory TOTP | Password-only |
| **Entity Types** | FI, Trust, Multinational | FI, TDT, Non-Reporting FI, Other (CbC) |
| **FATCA** | Not supported | Full FATCA lifecycle |
| **TDT Handling** | Under Trustee cert reference | Dedicated TDT profile + trustee fields |
| **CbC Article 3** | Not required | Required notification filing |
| **DocRefID Prefix** | BM | BS |
| **CRS Compliance Cert** | Required annually | Not in scope |
| **FI Profile Tab** | Basic status | Extended with trustee details |

---

## Documents

| File | Location | Description |
|------|----------|-------------|
| Bermuda User Guide v8.0 | `docs/bermuda/Bermuda_Portal_User_Guide_v8.pdf` | 82-page official portal user guide |
| Bermuda Flowcharts | `docs/bermuda/Bermuda_Portal_Flowcharts.pdf` | 3-page visual flow diagrams |
| Task Backlog (Excel) | `docs/shared/Bermuda_and_Bahamas_Backlogs.xlsx` | 5 sheets: Task_Mapping, Bermuda (303 rows), Bermuda_Tickets (225), Bahamas (239), Bahamas_Tickets (169) |

---

## Quick Start

```bash
# Clone and enter
git clone <repo-url> && cd reg-tech

# Install backend deps
cd backend && pip install -r requirements.txt

# Install frontend deps
cd ../frontend && pnpm install

# Start infrastructure
docker compose up -d  # PostgreSQL, Redis, MinIO

# Run migrations + seed
cd ../backend && alembic upgrade head && python -m app.seed

# Start dev servers
uvicorn app.main:app --reload --port 8000   # API
cd ../frontend && pnpm dev                    # UI on :3000
```

---

## Glossary

| Term | Definition |
|------|-----------|
| **AEOI** | Automatic Exchange of Information — OECD framework for multilateral tax data sharing |
| **CRS** | Common Reporting Standard — financial account reporting between jurisdictions |
| **CbC** | Country-by-Country Reporting — transfer pricing reporting for MNE groups |
| **CTS** | Common Transmission System — OECD secure exchange channel |
| **FATCA** | Foreign Account Tax Compliance Act — US tax reporting for foreign FIs |
| **FI** | Financial Institution — bank, broker, fund, insurer subject to reporting |
| **TDT** | Trustee-Documented Trust — trust where trustee handles reporting |
| **GIIN** | Global Intermediary Identification Number — IRS-issued FI identifier |
| **UPE** | Ultimate Parent Entity — top entity in MNE group (CbC) |
| **SPE** | Surrogate Parent Entity — designated CbC reporter when UPE exempt |
| **DocRefID** | Document Reference ID — unique identifier per reported record |
| **TIN** | Taxpayer Identification Number |
| **XSD** | XML Schema Definition — structural validation standard |
| **ACK/NACK** | Acknowledgement / Negative Acknowledgement from partner jurisdictions |
| **WORM** | Write-Once-Read-Many — audit log storage pattern |

---

## License

Confidential. All rights reserved.
