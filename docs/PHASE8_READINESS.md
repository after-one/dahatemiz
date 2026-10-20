# Phase 8 — Pilot Readiness Assessment

**Assessment date:** 2026-10-21  
**Decision:** Engineering baseline passes automated checks; **not ready for a real-user pilot**.  
**Scope:** Local code, disposable Auth Emulator accounts, and a local PostGIS-compatible database only. No production
credentials, real reporter data, cloud resources, or government accounts were used.

## Evidence reviewed

- Final workspace strict TypeScript, ESLint, production build, Prettier and CI-ordered unit tests passed. Mobile
  coverage is 28 tests, API coverage is 15 unit tests plus 7 E2E tests in 6 suites, and the internal media worker has 8
  unit/HTTP tests. Report-draft validation, authenticated report/upload API client contracts and native permission
  policy are covered in the mobile suite.
- Re-ran `pnpm typecheck`, `pnpm lint`, `pnpm test:ci`, `pnpm build`, `pnpm format:check`, and
  `pnpm --filter @dahamiz/api test:e2e` on 2026-10-20: all passed. E2E and worker HTTP tests needed local loopback
  permission because the default sandbox rejects test servers bound to `127.0.0.1`.
- On 2026-10-21, mobile strict typecheck and lint passed. The suite now has 8 suites and 28 tests. Two report-flow tests
  verify gallery selection, local draft save without report submission, and restoring/removing a saved image.
- On 2026-10-21, a WCAG 2.1 AA contrast regression test was added for semantic secondary text, all report status colors,
  and success/warning/error/info labels on tinted surfaces in both themes. It caught low-contrast tertiary, warning,
  error and several report-status colors; the tokens were adjusted, and all four contrast cases now pass.
  Device-rendered contrast, VoiceOver/TalkBack, and dynamic-text checks remain open because CoreSimulatorService was
  unavailable during this follow-up.
- Expo produced an iOS simulator bundle from the current app entry (3,420 modules), and the app was opened in Expo Go
  58.0.5 on iPhone 16e / iOS 26.2. This verifies a local simulator flow, not physical-device behavior or performance.
- Firebase Auth Emulator + local API/PostGIS-compatible database verified report authorization, moderation, organization
  isolation, community events and verified participation. The admin and institution web panels were exercised with
  disposable emulator users. The institution panel listed scoped cases, opened a case timeline, and downloaded its
  audited CSV summary.
- The institution CSV contains only case/report identifiers, category, safe status, city/district and timestamps. It
  excludes precise coordinates, descriptions, internal notes, media identifiers and object keys.
- Manual source review confirms user-facing controls use labels/accessible text and semantic buttons. No VoiceOver or
  TalkBack session, rendered-screen contrast measurement, dynamic-text stress test, or independent accessibility audit
  was available. A source-token contrast regression test was added on 2026-10-21; it does not replace device review.
- A code review found interactive map/feed filters and several secondary actions below a 44 dp target. Their minimum
  heights are now 44 dp, including category filters, content-report actions, notification read, team membership and
  screen-header back. Automated tests verify the shared action button's accessible name, activation and disabled state.
  These source-level fixes do not replace device screen-reader, contrast, large-text or touch testing.
- Permission copy and scope were corrected: iOS explains foreground location use only when the reporter chooses it for a
  report, and camera/photo access now describes report capture/drafts. iOS always-location, full-accuracy, motion and
  microphone usage descriptions are omitted. Android audio recording is marked for manifest-merge removal; foreground
  location remains and background location is absent. Three mobile regression tests and temporary Expo prebuild output
  verify the config and native source manifests. Physical-device prompts and a merged release manifest remain open.
- The Phase 3 backlog audit found the promised manual report-map pin was still deferred. It is now connected to the
  local secure draft; selecting/removing a pin does not request device location permission. Two component tests cover
  tapped coordinates and restoration of an existing pin, and Android Expo export bundled 3,281 modules successfully.
- Booted the iPhone 16e simulator, installed the compatible Expo Go 58.0.5 after freeing temporary build artifacts, and
  visually checked welcome, onboarding, Home, Map, Report, Events and Profile/Notifications. A disposable Firebase Auth
  Emulator account authenticated against the local API. Home and Map now return their honest empty states; the app does
  not imply that any report was published. No camera or location permission was requested, no report was submitted, and
  no physical-device test was completed. Docker Desktop 4.96.0 later reported its engine running, but the PostGIS
  container could not be started.
- Earlier photo-picker testing stopped before selection. A 2026-10-20 follow-up successfully opened the limited-access
  system picker, selected one built-in simulator sample image, and confirmed it appeared in the report composer. Saving
  and exiting surfaced the resume-draft action; resuming restored the attached image. The image was removed from the
  draft afterward. No report was submitted and no evidence was sent to a backend.
- Simulator verification exposed a live 400 on `/public/feed`: DTOs used only as erased types meant Nest saw `Object`
  and rejected valid query parameters. The controller imports now preserve DTO runtime metadata; explicit E2E tests
  cover feed, map and leaderboard query fields and reject undeclared keys.
- Final local HTTP checks returned 200 for API health, empty public feed with numeric pagination, and the empty map
  response. These endpoints ran against the disposable local database and development API only.
- Mobile API client methods now match the backend contract for signed upload authorization, private report creation,
  reporter history/detail and withdrawal; strict typecheck and request-contract tests pass. The report screen remains an
  explicitly labeled device-only demo because its displayed consent covers only local saving, and real consent and
  private storage are not approved/configured. No live report flow was enabled.
- The report tab now loads only the signed-in reporter's API history and keeps it separate from local demo records. It
  renders reporter-safe status events and allows withdrawal only when the API sets `canWithdraw`; a confirmation step
  precedes the authenticated request. Mobile tests cover safe-field rendering and withdrawal eligibility.
- A disposable Firebase Auth Emulator account and the local Compose PostGIS database passed an authenticated report
  create/list/withdraw smoke test. The reporter response contained neither precise coordinates nor media object keys;
  the temporary Auth Emulator account and database rows were deleted afterward.
- `StorageService` now fails closed if `GCS_BUCKET_EVIDENCE` and `GCS_BUCKET_PUBLIC` resolve to the same bucket name; a
  regression test confirms neither private upload authorization nor public derivative access can use that configuration.
  This is a local code guard and does not verify deployed bucket IAM or public-access-prevention policy.
- Android 15 / API 35 Expo Go loaded the latest SDK 58 bundle; Android export bundled 3,281 modules (5.4 MB Hermes
  bundle). The emulator walkthrough completed disposable Auth Emulator signup, API-backed report history, confirmed
  withdrawal and sign-out. The synthetic account and database rows were deleted afterward. This does not replace
  physical-device behavior, TalkBack or accessibility verification.
- `docker compose -f infrastructure/docker/docker-compose.yml config` and a clean local Compose startup passed. The
  PostGIS 16 / PostGIS 3.4.3 container became healthy, all five project migrations applied, and 21 public tables were
  present. Docker reports the image as linux/amd64 on this linux/arm64 host; despite that emulation warning, PostGIS
  health checks and SQL queries passed. The development database remains running for continued local testing.

## Readiness gates

| Priority | Finding                                                                                                                                                                                                                                                   | Owner / next action                                                                                                                                                   | Exit evidence                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P0       | Reporting composer still stores a local demo receipt. Authenticated mobile API client methods now exist, but the composer is not wired to them because its consent text authorizes only local demo storage and no private storage is approved/configured. | Product/legal + mobile/API owners: approve the exact consent and evidence policy, then connect signed upload, report creation, retry and withdrawal. Preserve drafts. | Physical-device end-to-end test with an approved private test bucket and verified deletion/retention behavior. |
| P0       | No user-facing account deletion workflow exists. Identity and report retention/deletion behavior require an approved policy before deletion semantics can be implemented safely.                                                                          | Product/legal + mobile/API owners: approve identity, report, evidence and audit retention rules; implement deletion and confirmation.                                 | End-to-end deletion verifies the approved retention policy, access revocation and audit behavior.              |
| P0       | Production Firebase, private Cloud Storage, database, region, retention and key-management configuration are not provisioned or approved.                                                                                                                 | Platform/security owner: obtain legal and security decisions, provision only after approval, verify private IAM and access logs.                                      | Reviewed threat model and deployment evidence; no public original-evidence object.                             |
| P0       | KVKK controller/processor roles, consent language, retention, user rights, cross-border transfers and government data-sharing agreements remain legally unresolved.                                                                                       | Product/legal owner: obtain counsel and institution approval; define controller, DPAs, retention/deletion and user-rights workflow.                                   | Written legal approval and signed agreements before real data.                                                 |
| P0       | No physical-device Phase 8 pass is available; camera behavior, location permission wording, accessibility, poor connectivity and performance remain unverified. The simulator covered the primary screens only.                                           | QA owner: run the documented checklist on supported iOS and Android devices, including VoiceOver/TalkBack and large text.                                             | Device matrix with reproducible results and resolved P0/P1 defects.                                            |
| P1       | Crash/error monitoring and production alert ownership are not configured.                                                                                                                                                                                 | Operations owner: select an approved provider/region, redact sensitive payloads, define retention and alert routing.                                                  | A test crash reaches a scrubbed dashboard and alert; no tokens, evidence or precise locations in telemetry.    |
| P1       | Release signing, store metadata, privacy disclosures, staged rollout and rollback have not been exercised.                                                                                                                                                | Release owner: configure approved signing and build channels after legal and project setup.                                                                           | Reproducible signed candidate, store review checklist and rollback rehearsal.                                  |
| P1       | Security verification is local automated coverage, not an independent penetration test; the local in-memory rate limit is not a cross-instance production control.                                                                                        | Security/platform owner: perform authorization abuse testing and select shared production rate limiting before public launch.                                         | Security review with no unresolved critical/high findings and tested distributed controls.                     |
| P1       | **Resolved locally:** the declared PostGIS container is healthy and all five migrations apply successfully. Compose warns that its amd64 image is running on an arm64 host, but health checks and SQL queries pass.                                       | Keep the local Compose database available for continued development; verify on CI/release architecture as part of release qualification.                              | Healthy Compose service, all migrations recorded, and 21 public tables verified on 2026-10-20.                 |
| P2       | Remote push notifications remain unavailable; in-app notifications are implemented.                                                                                                                                                                       | Mobile/release owner: configure approved FCM/APNs credentials and development builds if push is required for the pilot.                                               | Opt-in/out, delivery, revocation and device-token lifecycle test.                                              |

## Cost and production boundary

No Terraform plan/apply, cloud project, bucket, paid service, production database, or store release was created. The
current verified state is a local engineering prototype with useful moderation and institution workflows. It must not be
presented as an active government service, verified investigation channel, legal evidence system, or production
reporting service until every P0 gate is closed and the pilot is explicitly approved.

## Suggested physical-device checklist

1. Install a signed test build on one supported iPhone and Android device; complete registration, sign-in, sign-out and
   session restoration.
2. Exercise camera, gallery, location denial/grant, draft resume, upload interruption/retry, report status and account
   deletion with test data only.
3. Check Turkish/English text, light/dark mode, small and large text, VoiceOver/TalkBack labels, focus order, contrast,
   safe areas and minimum touch targets.
4. Record cold start, feed/map scroll, media memory use, battery/network behavior, API latency and crash-free sessions
   on representative Wi-Fi and mobile connections.
5. Verify moderator and institution roles, cross-organization denial, evidence audit trail, CSV scope, data deletion and
   recovery against the approved staging stack.
