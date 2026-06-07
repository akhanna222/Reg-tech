# UI Mock Screens

Visual wireframes for the Bermuda Tax Information Reporting Portal. Each SVG renders directly on GitHub — click any file to view.

---

## Flow A — Enrolment & Onboarding

| Screen | Preview | Description |
|--------|---------|-------------|
| [01 — CAPTCHA Gate](screens/01-enrolment-captcha.svg) | Security verification before enrolment form | reCAPTCHA challenge |
| [02 — Enrolment Form](screens/02-enrolment-form.svg) | Entity info + Primary User + document upload | Multi-section form |
| [03 — Enrolment Status](screens/03-enrolment-status.svg) | Pending approval state with entity details | Status tracking |

## Flow B — Login & Authentication

| Screen | Preview | Description |
|--------|---------|-------------|
| [04 — Login](screens/04-login.svg) | Email + password entry | Credential login |
| [05 — 2FA Setup](screens/05-2fa-setup.svg) | QR code + manual key + 6-digit verification | TOTP provisioning |
| [06 — 2FA Login](screens/06-2fa-login.svg) | Authenticator code challenge during login | 2FA verification |

## Flow C — CRS Filing Submission

| Screen | Preview | Description |
|--------|---------|-------------|
| [07 — Dashboard](screens/07-dashboard.svg) | Draft filings, notifications, entity context | Main portal view |
| [08 — Create Filing](screens/08-create-filing.svg) | Name, type, period selection | Filing creation |
| [09 — XML Upload](screens/09-filing-xml-upload.svg) | Drag-and-drop OECD CRS XML upload | File submission |
| [10 — Manual Entry](screens/10-filing-manual-entry.svg) | Account holder + account data table | Form-based entry |
| [11 — Validation Issues](screens/11-validation-issues.svg) | Errors (blocking) + warnings (non-blocking) | Pre-submit validation |
| [12 — Filing Submitted](screens/12-filing-submitted.svg) | Confirmation with reference number | Success state |

## Flow G — Tax Authority Review & Transmission

| Screen | Preview | Description |
|--------|---------|-------------|
| [13 — TA Submissions](screens/13-ta-submissions.svg) | Filterable table with batch select checkboxes | Submission browser |
| [14 — Filing Detail](screens/14-ta-filing-detail.svg) | 4-stage validation, approve/reject actions | TA review view |
| [15 — Transmit Dialog](screens/15-ta-transmit-dialog.svg) | 7-step pipeline confirmation modal | Transmission trigger |
| [16 — Transmission Status](screens/16-ta-transmission-status.svg) | ACK/NACK tracking dashboard | Dispatch monitoring |
| [17 — Enrolment Review](screens/17-ta-enrolment-review.svg) | Pending FI approvals with document links | TA approval queue |

## Flow I — Inbound Data (Layer 5)

| Screen | Preview | Description |
|--------|---------|-------------|
| [18 — Inbound Transmissions](screens/18-ta-inbound.svg) | CTS polling, signature/decrypt/XSD verification | Data reception |

## Flow J — Error Correction

| Screen | Preview | Description |
|--------|---------|-------------|
| [19 — Error Notification](screens/19-error-notification.svg) | OECD error codes from partner jurisdiction | NACK details |
| [20 — Correction Filing](screens/20-correction-filing.svg) | CRS702 corrected data upload | Error remediation |

## Flow K — History & Administration

| Screen | Preview | Description |
|--------|---------|-------------|
| [21 — Submission History](screens/21-submission-history.svg) | All submitted filings with download links | Filing archive |
| [22 — User Management](screens/22-user-management.svg) | Create/edit/deactivate secondary users | Admin panel |
| [23 — Entity Deactivation](screens/23-entity-deactivation.svg) | Deactivation form with evidence upload | Entity lifecycle |

## Flow L — Analytics

| Screen | Preview | Description |
|--------|---------|-------------|
| [24 — Analytics Dashboard](screens/24-analytics-dashboard.svg) | Metrics, charts, anomaly detection | TA intelligence |

---

## Design System

| Element | Value |
|---------|-------|
| Header | Navy `#1a365d` |
| Primary Button | Blue `#2563eb` |
| Success / Approved | Green `#10b981` |
| Warning / Pending | Amber `#f59e0b` |
| Error / Rejected | Red `#ef4444` |
| Input Background | `#f7f8fa` |
| Input Border | `#d1d5db` |
| Table Header | `#f1f5f9` |
| Table Alt Row | `#f9fafb` |
| Font | Inter, -apple-system, sans-serif |
