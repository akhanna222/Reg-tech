# User Journey — Complete Screen-by-Screen Flow

This document maps the end-to-end user journey through the OECD AEOI Tax Information Reporting Portal, from initial enrolment to data transmission and error correction.

Click any screen link to view the SVG mockup directly on GitHub.

---

## Journey Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE USER JOURNEY MAP                                        │
│                                                                                         │
│  ENROLMENT          LOGIN           FILING            TA REVIEW         DATA BACK        │
│  ─────────          ─────           ──────            ─────────         ─────────        │
│  [01] CAPTCHA  ──►  [04] Login  ──► [07] Dashboard ──► [13] Browse  ──► [18] Inbound    │
│  [02] Form     ──►  [05] 2FA   ──► [08] Create    ──► [14] Detail  ──► [19] Errors     │
│  [03] Status   ──►  [06] Code  ──► [09] Upload    ──► [15] Transmit──► [20] Correct    │
│                                     [10] Manual    ──► [16] Status                      │
│                                     [11] Validate  ──► [17] Enrol                       │
│                                     [12] Confirm                                        │
│                                                                                         │
│  ADMIN                ANALYTICS                                                         │
│  ─────                ─────────                                                         │
│  [21] History         [24] Dashboard                                                    │
│  [22] Users                                                                             │
│  [23] Deactivate                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Journey 1: New Financial Institution (First-Time User)

> A new Financial Institution needs to register, create an account, submit their first CRS filing, and track it through to transmission.

### Phase 1 — Enrolment (Screens 01 → 03)

| Step | Screen | User Action | What Happens Next |
|------|--------|-------------|-------------------|
| 1 | [01 — CAPTCHA](screens/01-enrolment-captcha.svg) | FI accesses enrolment link, passes reCAPTCHA | → Proceeds to enrolment form |
| 2 | [02 — Enrolment Form](screens/02-enrolment-form.svg) | Fills in: Entity Name, Type (FI), Reporting Type (CRS), GIIN, Address, Primary User details. Uploads passport + authorization letter | → Submits form |
| 3 | [03 — Enrolment Status](screens/03-enrolment-status.svg) | Views "PENDING APPROVAL" status | → Waits for Tax Authority review (email notification on decision) |

**Tax Authority side:** TA reviewer sees the application at [Screen 17 — Enrolment Review](screens/17-ta-enrolment-review.svg) and approves/rejects.

**On Approval:** FI receives email with username (email) + temporary password.

---

### Phase 2 — First Login & 2FA Setup (Screens 04 → 06)

| Step | Screen | User Action | What Happens Next |
|------|--------|-------------|-------------------|
| 4 | [04 — Login](screens/04-login.svg) | Enters email + temp password | → Forced password change, then 2FA setup |
| 5 | [05 — 2FA Setup](screens/05-2fa-setup.svg) | Scans QR code with authenticator app, enters 6-digit verification code | → 2FA enabled for account |
| 6 | [06 — 2FA Login](screens/06-2fa-login.svg) | On subsequent logins: enters TOTP code from authenticator | → Accesses dashboard |

---

### Phase 3 — Create & Submit CRS Filing (Screens 07 → 12)

| Step | Screen | User Action | What Happens Next |
|------|--------|-------------|-------------------|
| 7 | [07 — Dashboard](screens/07-dashboard.svg) | Views draft filings, clicks "Create Filing" | → Filing creation form |
| 8 | [08 — Create Filing](screens/08-create-filing.svg) | Enters: Filing Name, Type=CRS, Period=31 Dec 2025. Clicks "Create" | → Draft filing created |
| 9a | [09 — XML Upload](screens/09-filing-xml-upload.svg) | **Option A:** Uploads OECD CRS XML v2.0 file via drag-and-drop | → File stored, validation triggered |
| 9b | [10 — Manual Entry](screens/10-filing-manual-entry.svg) | **Option B:** Manually enters Reporting FI info + account holder records | → Data saved as draft |
| 10 | [11 — Validation Issues](screens/11-validation-issues.svg) | Reviews pre-submission validation: fixes errors, acknowledges warnings | → All errors resolved |
| 11 | [12 — Filing Submitted](screens/12-filing-submitted.svg) | Clicks "Validate & Submit". Sees confirmation with reference number | → Filing status = SUBMITTED |

**Filing is now in the Tax Authority's queue.**

---

### Phase 4 — Tax Authority Reviews & Transmits (Screens 13 → 16)

| Step | Screen | Actor | Action | What Happens Next |
|------|--------|-------|--------|-------------------|
| 12 | [13 — TA Submissions](screens/13-ta-submissions.svg) | TA Reviewer | Filters submissions, finds the filing | → Opens detail view |
| 13 | [14 — TA Filing Detail](screens/14-ta-filing-detail.svg) | TA Reviewer | Reviews 4-stage validation results, clicks "Approve & Transmit" | → Transmission dialog |
| 14 | [15 — Transmit Dialog](screens/15-ta-transmit-dialog.svg) | TA Approver | Confirms destination country, reviews 7-step pipeline, clicks "Confirm" | → Transmission starts |
| 15 | [16 — Transmission Status](screens/16-ta-transmission-status.svg) | TA | Monitors: Dispatched → ACK received from partner jurisdiction | → Filing marked TRANSMITTED |

**7-Step OECD CTS Transmission Pipeline:**
1. Final Validation (OECD XSD re-check)
2. Dataset Lock (filing becomes immutable)
3. OECD XML Package Creation (MessageSpec metadata)
4. Encryption (recipient jurisdiction's public key, RSA-OAEP + AES-256)
5. Digital Signing (sender's private key, XMLDSig)
6. SFTP Upload to OECD CTS outbox
7. ACK/NACK receipt from partner jurisdiction

---

### Phase 5 — If Errors Received from Partner (Screens 19 → 20)

| Step | Screen | Actor | Action | What Happens Next |
|------|--------|-------|--------|-------------------|
| 16 | [19 — Error Notification](screens/19-error-notification.svg) | FI | Views OECD error codes (80001-80011) received from partner. Sees 60-day deadline. | → Creates correction |
| 17 | [20 — Correction Filing](screens/20-correction-filing.svg) | FI | Creates CRS702 correction referencing original DocRefID. Uploads corrected XML. | → Re-enters pipeline at Step 10 |

---

## Journey 2: Tax Authority — Inbound Data from Partner

> Another jurisdiction sends data TO us via OECD CTS.

| Step | Screen | Action | What Happens Next |
|------|--------|--------|-------------------|
| 1 | [18 — Inbound Transmissions](screens/18-ta-inbound.svg) | System polls OECD CTS inbox (every 4 hours) or receives webhook | → Package downloaded |
| 2 | [18 — Inbound Transmissions](screens/18-ta-inbound.svg) | System: Verifies signature → Decrypts → Validates XSD | → Status updated per step |
| 3 | [18 — Inbound Transmissions](screens/18-ta-inbound.svg) | If valid: ACK sent back to source. If invalid: NACK with error codes | → Data ingested for analysis |
| 4 | [24 — Analytics Dashboard](screens/24-analytics-dashboard.svg) | TA views cross-jurisdiction analytics, anomalies, trends | → Enforcement intelligence |

---

## Journey 3: Entity Lifecycle Management

> Primary User manages their entity's users and lifecycle events.

| Step | Screen | Action | What Happens Next |
|------|--------|--------|-------------------|
| 1 | [22 — User Management](screens/22-user-management.svg) | Primary User creates/edits/deactivates Secondary Users | → Users receive email credentials |
| 2 | [21 — Submission History](screens/21-submission-history.svg) | Any user views all past filings, downloads XML | → Audit trail |
| 3 | [23 — Entity Deactivation](screens/23-entity-deactivation.svg) | Primary User submits deactivation with evidence (if entity dissolves) | → Ministry reviews within 30 days |

---

## Screen Flow Diagram

```
                              ┌──────────────────┐
                              │    START HERE     │
                              │   New FI Entity   │
                              └────────┬─────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────┐
                    │  SCREEN 01: CAPTCHA Verification     │
                    └────────────────────┬────────────────┘
                                         │ Pass
                                         ▼
                    ┌─────────────────────────────────────┐
                    │  SCREEN 02: Enrolment Form           │
                    │  (Entity + User + Documents)         │
                    └────────────────────┬────────────────┘
                                         │ Submit
                                         ▼
                    ┌─────────────────────────────────────┐
                    │  SCREEN 03: Pending Approval         │
                    └────────────────────┬────────────────┘
                                         │ TA Approves (Screen 17)
                                         ▼
                    ┌─────────────────────────────────────┐
                    │  SCREEN 04: Login                    │
                    │  (email + temp password)             │
                    └────────────────────┬────────────────┘
                                         │ Authenticate
                                         ▼
                    ┌─────────────────────────────────────┐
                    │  SCREEN 05: 2FA Setup (first login)  │
                    │  (QR code + verify)                  │
                    └────────────────────┬────────────────┘
                                         │ Enabled
                                         ▼
                    ┌─────────────────────────────────────┐
                    │  SCREEN 06: 2FA Code Entry           │
                    │  (subsequent logins)                 │
                    └────────────────────┬────────────────┘
                                         │ Verified
                                         ▼
          ┌──────────────────────────────────────────────────────────┐
          │  SCREEN 07: Dashboard                                     │
          │  (Draft filings, notifications, create button)            │
          └──────────┬───────────────────────────────────┬───────────┘
                     │ Create Filing                      │ View History
                     ▼                                    ▼
    ┌─────────────────────────┐              ┌─────────────────────────┐
    │  SCREEN 08: Create       │              │  SCREEN 21: Submission   │
    │  (Name, Type, Period)    │              │  History                 │
    └────────────┬────────────┘              └─────────────────────────┘
                 │ Created
                 ▼
    ┌────────────────────────────────┐
    │  Choose Input Mode:             │
    │                                 │
    │  ┌──────────┐  ┌──────────┐   │
    │  │ XML      │  │ Manual   │   │
    │  │ Upload   │  │ Entry    │   │
    │  └────┬─────┘  └────┬─────┘   │
    └───────┼──────────────┼─────────┘
            │              │
            ▼              ▼
  ┌──────────────┐  ┌──────────────┐
  │ SCREEN 09:   │  │ SCREEN 10:   │
  │ XML Upload   │  │ Manual Entry │
  │ (Drag+Drop)  │  │ (Forms)      │
  └──────┬───────┘  └──────┬───────┘
         │                  │
         └────────┬─────────┘
                  │ Validate
                  ▼
    ┌─────────────────────────────────┐
    │  SCREEN 11: Validation Issues    │
    │  (Fix errors, ack warnings)      │
    └────────────────┬────────────────┘
                     │ All clear
                     ▼
    ┌─────────────────────────────────┐
    │  SCREEN 12: Filing Submitted ✓   │
    │  (Reference number, confirm)     │
    └────────────────┬────────────────┘
                     │
                     │ Filing now in TA queue
                     ▼
    ╔═════════════════════════════════════════════╗
    ║  TAX AUTHORITY SIDE                         ║
    ╚═════════════════════════╤═══════════════════╝
                              │
                              ▼
    ┌─────────────────────────────────┐
    │  SCREEN 13: TA Submissions       │
    │  (Filter, browse, select)        │
    └────────────────┬────────────────┘
                     │ Open
                     ▼
    ┌─────────────────────────────────┐
    │  SCREEN 14: TA Filing Detail     │
    │  (4-stage validation, review)    │
    └────────────────┬────────────────┘
                     │ Approve
                     ▼
    ┌─────────────────────────────────┐
    │  SCREEN 15: Transmit Dialog      │
    │  (7-step OECD CTS pipeline)      │
    └────────────────┬────────────────┘
                     │ Confirm
                     ▼
    ┌─────────────────────────────────┐
    │  SCREEN 16: Transmission Status  │
    │  (Monitor ACK/NACK from CTS)     │
    └──────────┬──────────────┬───────┘
               │              │
          ACK ✓│              │NACK ✗
               │              │
               ▼              ▼
    ┌──────────────┐  ┌───────────────────┐
    │  SUCCESS!    │  │ SCREEN 19: Error   │
    │  TRANSMITTED │  │ Notification       │
    │  (FI notified│  │ (OECD error codes) │
    └──────────────┘  └────────┬──────────┘
                               │ FI corrects
                               ▼
                  ┌─────────────────────────┐
                  │  SCREEN 20: Correction   │
                  │  Filing (CRS702)         │
                  │  → Re-enters at Step 10  │
                  └─────────────────────────┘


    ╔═════════════════════════════════════════════╗
    ║  INBOUND PATH (partner → us)                ║
    ╚═════════════════════════╤═══════════════════╝
                              │
                              ▼
    ┌─────────────────────────────────┐
    │  SCREEN 18: Inbound CTS Data     │
    │  (Poll → Decrypt → Validate)     │
    └────────────────┬────────────────┘
                     │ Ingested
                     ▼
    ┌─────────────────────────────────┐
    │  SCREEN 24: Analytics Dashboard  │
    │  (Cross-jurisdiction insights)   │
    └─────────────────────────────────┘


    ╔═════════════════════════════════════════════╗
    ║  ADMIN PATH                                 ║
    ╚════════════════��════════╤═══════════════════╝
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ SCREEN 22:   │  │ SCREEN 21:   │  │ SCREEN 23:   │
    │ User Mgmt    │  │ Sub History  │  │ Deactivation │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Screen Index (Quick Reference)

| # | Screen | Flow | Actor | OECD Element |
|---|--------|------|-------|--------------|
| 01 | [CAPTCHA Gate](screens/01-enrolment-captcha.svg) | Enrolment | FI | — |
| 02 | [Enrolment Form](screens/02-enrolment-form.svg) | Enrolment | FI | CRS Entity Classification |
| 03 | [Enrolment Status](screens/03-enrolment-status.svg) | Enrolment | FI | — |
| 04 | [Login](screens/04-login.svg) | Auth | All | — |
| 05 | [2FA Setup](screens/05-2fa-setup.svg) | Auth | All | — |
| 06 | [2FA Verification](screens/06-2fa-login.svg) | Auth | All | — |
| 07 | [Dashboard](screens/07-dashboard.svg) | Filing | FI | — |
| 08 | [Create Filing](screens/08-create-filing.svg) | Filing | FI | MessageTypeIndic (CRS701/702) |
| 09 | [XML Upload](screens/09-filing-xml-upload.svg) | Filing | FI | OECD CRS XML Schema v2.0 |
| 10 | [Manual Entry](screens/10-filing-manual-entry.svg) | Filing | FI | ReportingFI, AccountReport |
| 11 | [Validation Issues](screens/11-validation-issues.svg) | Validation | FI | DocRefID, TIN, XSD errors |
| 12 | [Filing Submitted](screens/12-filing-submitted.svg) | Filing | FI | MessageRefID |
| 13 | [TA Submissions](screens/13-ta-submissions.svg) | TA Review | TA | — |
| 14 | [TA Filing Detail](screens/14-ta-filing-detail.svg) | TA Review | TA | 4-stage OECD validation |
| 15 | [Transmit Dialog](screens/15-ta-transmit-dialog.svg) | Transmission | TA | OECD CTS 7-step pipeline |
| 16 | [Transmission Status](screens/16-ta-transmission-status.svg) | Transmission | TA | CTS ACK/NACK |
| 17 | [Enrolment Review](screens/17-ta-enrolment-review.svg) | TA Admin | TA | — |
| 18 | [Inbound Data](screens/18-ta-inbound.svg) | Data Back | TA | CTS Inbound, XMLDSig verify |
| 19 | [Error Notification](screens/19-error-notification.svg) | Corrections | FI | OECD Error Codes 80001-80011 |
| 20 | [Correction Filing](screens/20-correction-filing.svg) | Corrections | FI | CRS702, CorrDocRefID, OECD2 |
| 21 | [Submission History](screens/21-submission-history.svg) | History | FI | — |
| 22 | [User Management](screens/22-user-management.svg) | Admin | FI Primary | — |
| 23 | [Entity Deactivation](screens/23-entity-deactivation.svg) | Admin | FI Primary | — |
| 24 | [Analytics Dashboard](screens/24-analytics-dashboard.svg) | Analytics | TA | Cross-jurisdiction CRS data |

---

## OECD Standards Referenced in Screens

| Standard | Where Used | Screen(s) |
|----------|-----------|-----------|
| **OECD CRS XML Schema v2.0** | XML upload, validation, manual entry | 09, 10, 11, 14 |
| **OECD CbC XML Schema v1.0.1** | CbC filing upload | 08, 09 |
| **OECD CTS (Common Transmission System)** | Transmission pipeline, SFTP dispatch | 15, 16, 18 |
| **OECD MessageSpec** | Filing metadata (sender, receiver, timestamp, ref) | 12, 15 |
| **OECD DocSpec / DocRefID** | Record-level identification and correction references | 11, 19, 20 |
| **OECD MessageTypeIndic** | CRS701 (new), CRS702 (corrected) | 08, 20 |
| **OECD DocTypeIndic** | OECD1 (new), OECD2 (corrected), OECD3 (deleted) | 20 |
| **OECD Status Message Schema** | ACK/NACK from partner jurisdictions | 16, 19 |
| **OECD Error Codes (80001-80011)** | Partner error notifications | 19 |
| **XMLDSig (XML Digital Signatures)** | Signing transmitted packages | 15, 18 |
| **PKCS#7 / RSA-OAEP Encryption** | Per-jurisdiction public key encryption | 15, 18 |
