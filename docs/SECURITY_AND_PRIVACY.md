# Security and Privacy Design

**This document is a required read before implementing any feature that touches user data, media, reports, or
authentication.**

---

## 1. Core Privacy Principles

This platform processes sensitive media that may contain images of real people, vehicles, and locations in the context
of potential legal proceedings.

### Privacy by Design Requirements

1. **Data Minimization** — Collect only what is necessary for the specific purpose.
2. **Purpose Limitation** — Data collected for reporting must not be repurposed for other uses.
3. **Separation of Concerns** — Private evidence and public community content must be completely separate.
4. **Default to Private** — New reports are private by default. Public publication requires separate explicit
   authorization.
5. **Access Limitation** — Only authorized roles can access sensitive data, and only for the documented purpose.
6. **Permission Minimization** — Ask only for permissions needed for the action the user chooses; map pin selection
   needs no system location permission, GPS is foreground-only and requested on demand, and the app does not request
   microphone or background location.

---

## 2. Evidence Media Handling

Evidence media (photos and videos submitted by reporters) is the most sensitive data category.

### Storage Architecture

```
[Mobile App]
     |
     | (1) Request short-lived signed upload URL from API
     v
[DahaMiz API]
     |
     | (2) Generate signed URL (15 min expiry, content-type restricted)
     |     — requires auth token
     v
[Mobile App]
     |
     | (3) PUT file directly to Cloud Storage via signed URL
     |     — signed URL is scoped to a single object path
     v
[Cloud Storage: Evidence Bucket]
     |
     | PRIVATE — no public access, no listing, uniform bucket access
     | Access: only via service account in authorized backend processes
     | Audit: every access logged
     |
[Media Worker]
     |
     | (4) Privacy transformation pipeline (async)
     |     — detected face/plate-region blur (advisory, not guaranteed anonymization)
     |     — human comparison and review required
     v
[Cloud Storage: Public Media Bucket]
     |
     | Only approved, processed derivatives — never originals
     | Public read access for approved community content ONLY
```

The API refuses media operations when the configured evidence and public bucket names are identical. This prevents an
accidental same-bucket configuration; it does not validate deployed IAM, uniform bucket-level access or public-access
prevention, which must still be reviewed before any cloud use.

The local media worker accepts JPEG/PNG only, reads the image in memory, mosaics and blurs cascade-detected face and
license-plate regions, strips source metadata by encoding a fresh JPEG, and returns an explicit human-review-required
signal. It does not identify people, decide publication, persist the image, access Cloud Storage or integrate with a job
queue. Haar cascades can miss faces/plates and may produce false detections; Turkish plate performance has not been
measured. Do not treat its output as anonymized or publishable. A reviewer must compare the derivative with the private
original, and production use requires separate-bucket storage, audited access and a human approval workflow.

### What is NEVER permitted:

- ❌ Returning a permanent public URL to an original evidence file to any client
- ❌ Serving evidence files directly from Cloud Storage without authorization
- ❌ Storing evidence object paths/names in any response visible to end users
- ❌ Automatic public publication of newly submitted reports
- ❌ Associating original evidence with public community posts without human review

### Signed URL properties:

- **Expiry:** 15 minutes (upload) / 60 minutes (authorized preview for moderators)
- **Scope:** Single object, single operation (PUT for upload, GET for preview)
- **Content-Type:** Restricted to allowed media types only
- **Auth:** Requires valid Firebase JWT to obtain from API

---

## 3. Location Data

Reporters provide precise coordinates for accurate routing to authorities. These coordinates are sensitive.

### Handling Rules:

- **Store:** Precise coordinates are stored privately, associated only with the internal report record
- **Display to reporter:** Show general area (district/city), not precise coordinates
- **Display publicly:** Show only approximate, randomized coordinates (~500m radius offset)
- **Never expose:** Precise coordinates to any public API endpoint
- **Authority access:** Precise coordinates available to authorized authority officials for investigation, with audit
  log

---

## 4. Authentication and Authorization

### Architecture

```
[Mobile App]
     | Firebase SDK signs in user
     | Receives Firebase JWT
     |
[DahaMiz API]
     | Verifies JWT with Firebase Admin SDK
     | Extracts uid, email, phone
     | Looks up/creates DahaMiz user record
     | Applies RBAC based on role
```

### Role Hierarchy

```
CITIZEN          — standard user; can create reports; sees only own report status
MODERATOR        — internal staff; reviews reports; cannot access investigation data
AUTHORITY_OFFICIAL — public institution staff; sees forwarded reports; org-scoped
ADMIN            — internal platform admin; full access with audit trail
```

### Principles:

- All API endpoints require authentication unless explicitly public (e.g., public feed, health check)
- Authority officials are **org-scoped** — cannot see reports assigned to other institutions
- No privilege escalation — users cannot self-promote to higher roles
- Service accounts used for background workers — never user accounts
- Token refresh handled by Firebase SDK — API validates on every request (no session state)

---

## 5. KVKK (Turkish Personal Data Law) Considerations

> **IMPORTANT: This section documents requirements and open questions for legal review. It does not constitute legal
> advice or confirmed compliance.**

### Data Controller Responsibilities

The operating entity of DahaMiz is the **data controller** under KVKK for:

- User profile data (name, phone, email)
- Report metadata (category, approximate location, timestamps)
- App usage analytics

### Personal Data Categories Processed

| Category                          | Purpose                      | Basis                                  |
| --------------------------------- | ---------------------------- | -------------------------------------- |
| Phone number / email              | User authentication          | Contract performance                   |
| Report content (text description) | Environmental accountability | Legitimate interest / explicit consent |
| Evidence media (photos/videos)    | Report substantiation        | Explicit consent                       |
| Location data (precise)           | Report routing               | Explicit consent                       |
| Location data (approximate)       | Public community map         | Legitimate interest                    |
| Usage analytics                   | Product improvement          | Legitimate interest                    |

### Third-Party Processors (Requires DPA agreements)

| Processor              | Purpose                    | Region               |
| ---------------------- | -------------------------- | -------------------- |
| Google (Firebase Auth) | Authentication             | US/EU — needs review |
| Google Cloud Platform  | Storage, compute, database | Region TBD           |

### Hosting Region — Open Questions for Legal Review

- Turkish law may impose restrictions on where certain categories of data can be hosted
- EU-based hosting (e.g., `europe-west3` Frankfurt) may satisfy adequacy requirements
- Public authority institutional requirements may mandate Turkish-hosted solutions
- **Decision pending: do not provision real data storage until legal review is complete**

### Retention Policy — Pending Legal Determination

| Data                                | Current Default        | Requires Review               |
| ----------------------------------- | ---------------------- | ----------------------------- |
| Evidence media (private)            | Indefinite             | ✅ Determine retention period |
| Evidence media (public derivatives) | Indefinite             | ✅ Determine retention period |
| User profile                        | Until deletion request | ✅ Confirm minimum period     |
| Report metadata                     | Indefinite             | ✅ Regulatory requirements    |
| Audit logs                          | 2 years                | ✅ Review statutory minimums  |

### International Transfer

- Uploading to GCP Cloud Storage outside Turkey constitutes international data transfer
- Firebase Authentication processes data on Google servers
- Legal basis for international transfer requires documentation
- **Do not process real user data internationally until legal basis is confirmed**

### User Rights Under KVKK

Must implement support for:

- Right of access (export own data)
- Right of correction
- Right of deletion (account deletion path)
- Right to object to processing
- Right to data portability

---

## 6. Content Moderation

### Principle

Content moderation exists to protect:

1. Platform integrity (spam, false reports, abuse)
2. Individual privacy (accidental exposure of identifying information)
3. Legal compliance (removing content without proper authorization)
4. Public authority relationship integrity

### Moderation Flow

```
Report submitted
    |
    v
Automated checks (file type, size, basic content analysis)
    |
    v
Queued for human moderation review
    |
    v
Moderator decision:
  ├── APPROVE → Forward to authority queue
  ├── APPROVE PUBLIC DERIVATIVE → Create public community post (separate action)
  ├── REQUEST CLARIFICATION → Notify reporter
  └── REJECT → Notify reporter with reason (not detailed investigation reason)
```

### What Moderators Can and Cannot Do

**Can:**

- Review report content and metadata
- Mark reports as needing clarification
- Reject spam or false-positive reports
- Create an approved public derivative post (different from original evidence)
- Escalate to authority queue

**Cannot:**

- Access original evidence without explicit audit-logged reason
- Identify or accuse third parties shown in media
- Publish original evidence
- Share investigation findings with the reporter beyond approved status messages

---

## 7. No Automated Enforcement

This principle is immutable:

- **No automated enforcement decisions** based on AI analysis
- **No automated fines, penalties, or legal actions** triggered by the platform
- **No automated identification of alleged offenders**
- AI classification results are suggestions for human moderators — not actions
- Public authority officials determine whether to open an investigation — the platform does not

---

## 8. Security Engineering Checklist

### API Security

- [x] All endpoints authenticated except explicitly public ones (health and development-only Swagger)
- [x] Input validation on report and upload DTOs; unknown properties rejected
- [x] Output filtering — reporter endpoints only return the caller's own reports and safe location fields
- [x] Global in-memory rate limiting; production deployment still needs a shared edge/distributed policy
- [x] Helmet.js HTTP headers
- [x] Sanitized production error responses
- [x] Request ID tracking in HTTP logs and audit rows
- [x] Structured HTTP/security logs omit tokens, request bodies and personal data

### Storage Security

- [ ] Evidence bucket: uniform bucket-level access and public access prevention (Terraform prepared, not applied)
- [ ] Evidence bucket: Cloud Data Access audit logging (Terraform prepared, not applied)
- [ ] Derivative bucket is separate and private; public access delivery waits for moderation and legal decisions
- [x] Signed uploads: 15-minute expiry, content type restricted, create-only object generation precondition
- [ ] Service account: minimum required permissions (Terraform prepared, not provisioned or reviewed)

These checks describe code-level implementation separately from cloud deployment. No production environment has been
provisioned or audited.

### Mobile Security

- [ ] No secrets in app bundle (only EXPO_PUBLIC_ vars, never service account keys)
- [ ] Firebase JWT passed in Authorization header, never in query parameters
- [x] SecureStore for Firebase Auth persistence and sensitive local data (not AsyncStorage)
- [ ] No caching of evidence media URLs longer than their signed URL expiry
- [ ] Certificate pinning (Phase 8)

### Compliance

- [ ] Privacy policy screen shown before first report submission
- [ ] Explicit consent checkbox before submitting evidence
- [ ] Account deletion flow implemented
- [ ] Data export capability (Phase 8)
- [ ] Audit log for all evidence access
- [ ] Legal review completed before launching with real users
