# Feature Backlog — DahaMiz

All planned features, organized by domain with phase, priority, and status.

**Status:** 🔲 Planned | ⏳ In Progress | ✅ Done | 🚫 Blocked | 🔄 Deferred

---

## Visual Identity and Design System

| Feature                        | Phase | Priority | Status | Notes                                                  |
| ------------------------------ | ----- | -------- | ------ | ------------------------------------------------------ |
| Visual direction exploration   | 1     | P0       | ✅     | Three directions compared; Mahalle Editoryali selected |
| Semantic design token system   | 1     | P0       | ✅     | Semantic color, type, spacing, motion, light and dark  |
| Reusable mobile UI primitives  | 1     | P0       | ✅     | Accessible, token-driven components and preview        |
| Fatih Abi character reference  | 1     | P0       | ✅     | Reference sheet and canonical pose                     |
| Mascot expressions and poses   | 1     | P0       | ✅     | Ten transparent state assets                           |
| Environmental illustrations    | 1     | P1       | ✅     | Two original editorial scenes                          |
| Asset manifest and usage guide | 1     | P1       | ✅     | File locations, states, sizes and usage guidance       |

## Identity and Onboarding

| Feature                         | Phase | Priority | Status | Notes                                                                            |
| ------------------------------- | ----- | -------- | ------ | -------------------------------------------------------------------------------- |
| Splash screen                   | 2     | P0       | ✅     | Branded Expo splash; onboarding explains permissions                             |
| Welcome screen (Fatih Abi)      | 2     | P0       | ✅     | Turkish-first welcome with mascot                                                |
| Onboarding flow (3-4 screens)   | 2     | P0       | ✅     | Trust, privacy and contribution basics                                           |
| Permission education screens    | 2     | P0       | ✅     | Camera, location, notifications; no prompt requested                             |
| Language selection              | 2     | P1       | ✅     | TR default with working TR/EN toggle                                             |
| Firebase email/password auth    | 4     | P0       | ✅     | Firebase JS SDK; SecureStore persistence; local Auth Emulator                    |
| Profile setup flow              | 2     | P0       | ✅     | Display name set on Firebase account during registration                         |
| Development demo authentication | 2     | P0       | ✅     | Retained only as completed Phase 2 history; replaced in Phase 4                  |
| Privacy consent screen          | 3     | P0       | ⏳     | Explicit local-demo consent exists; real processing consent needs legal approval |
| Account deletion                | 8     | P0       | 🚫     | Requires approved identity, report and evidence retention policy                 |

## Reporting

| Feature                      | Phase | Priority | Status | Notes                                                                                                                             |
| ---------------------------- | ----- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Media capture (camera)       | 3     | P0       | ✅     | Photo capture wired; simulator has no camera                                                                                      |
| Media selection (gallery)    | 3     | P0       | ✅     | Multi-select up to 3 files                                                                                                        |
| Incident category selection  | 3     | P0       | ✅     | Shared incident taxonomy                                                                                                          |
| Location selection (map)     | 3     | P0       | ✅     | Manual map pin, optional on-demand GPS and district; stays in the local secure draft                                              |
| Report description input     | 3     | P1       | ✅     | Optional free text, 400-character limit                                                                                           |
| Event details (time, repeat) | 3     | P2       | ✅     | Optional date with format validation                                                                                              |
| Draft persistence            | 3     | P1       | ✅     | Local SecureStore metadata and resume                                                                                             |
| Privacy review screen        | 3     | P0       | ✅     | Explicit consent; real legal review still required                                                                                |
| Report preview               | 3     | P1       | ✅     | Category, media, location and description                                                                                         |
| Secure submission            | 4     | P0       | ⏳     | Authenticated mobile API client exists; shared bucket names fail closed; UI wiring waits for approved consent and private storage |
| Submission acknowledgement   | 3     | P0       | ✅     | Device-only demo receipt, not verified                                                                                            |
| Status timeline              | 3     | P0       | ✅     | Separate local demo and authenticated server timelines; only reporter-safe status messages shown                                  |
| Report history               | 3     | P0       | ✅     | Own device-only demo records                                                                                                      |
| Report withdrawal request    | 4     | P1       | ✅     | Authenticated history UI offers confirmed withdrawal only when the API says the report is eligible                                |
| Multiple media per report    | 4     | P1       | ⏳     | API supports up to three verified upload IDs                                                                                      |

## Community Feed

| Feature                     | Phase | Priority | Status | Notes                                                     |
| --------------------------- | ----- | -------- | ------ | --------------------------------------------------------- |
| Home feed screen (mock)     | 2     | P0       | ✅     | Clearly labeled sample content, no backend                |
| Feed endpoint               | 5     | P0       | ✅     | Paginated, approved-only; derivative URLs are short-lived |
| Environmental story cards   | 5     | P1       | 🔲     | Before/after, resolved reports                            |
| Full-screen vertical video  | 5     | P1       | 🔲     | Short-form content experience                             |
| Public post detail screen   | 5     | P1       | 🔲     | Expanded view                                             |
| Content categories / filter | 5     | P2       | ✅     | By category, city and district                            |
| Likes                       | 5     | P2       | 🔲     | Positive engagement                                       |
| Bookmarks                   | 5     | P2       | 🔲     | Save posts                                                |
| Moderated comments          | 6     | P2       | 🔲     | Strictly moderated                                        |
| Share stories               | 6     | P2       | 🔲     | Share public links                                        |
| Local vs global discovery   | 5     | P1       | 🔲     | Filter by region                                          |

## Map

| Feature                 | Phase | Priority | Status | Notes                                       |
| ----------------------- | ----- | -------- | ------ | ------------------------------------------- |
| Map screen (mock)       | 2     | P0       | ✅     | Honest empty state; no fabricated locations |
| Public report markers   | 5     | P0       | ✅     | PostGIS offsets randomized 400–600 m        |
| Report status markers   | 5     | P0       | 🔲     | Color by status                             |
| Resolved area markers   | 5     | P1       | 🔲     | Positive transformation                     |
| Region filters          | 5     | P1       | ✅     | City and district                           |
| Pollution density layer | 5     | P2       | 🔲     | Heatmap aggregation                         |
| Nearby projects         | 6     | P2       | 🔲     | Community cleanup events                    |
| City statistics         | 5     | P2       | 🔲     | Reports by category, area                   |

## Gamification

| Feature                  | Phase | Priority | Status | Notes                                                               |
| ------------------------ | ----- | -------- | ------ | ------------------------------------------------------------------- |
| Challenges screen (mock) | 2     | P0       | ✅     | Clearly labeled sample ideas; no real campaign                      |
| XP points system         | 6     | P0       | ✅     | 20 XP only for moderator-verified event attendance                  |
| Level system             | 6     | P0       | ✅     | Server-calculated from verified participation                       |
| Achievement badges       | 6     | P0       | ✅     | 1/5/10 verified community events                                    |
| Daily missions           | 6     | P0       | 🔄     | Positive community event participation; scheduled rotation deferred |
| Weekly missions          | 6     | P1       | 🔲     | Community goals                                                     |
| Local leaderboard        | 6     | P1       | ✅     | City/district, user opt-in required                                 |
| Global leaderboard       | 6     | P2       | 🔲     | Platform-wide                                                       |
| Community teams          | 6     | P2       | ✅     | Moderator-created, join/leave, aggregate scores                     |
| City competitions        | 6     | P2       | 🔲     | Inter-city positive competition                                     |
| Impact statistics        | 6     | P1       | ✅     | Verified attendance and XP; no inferred cleanup totals              |
| Anti-abuse safeguards    | 6     | P0       | ✅     | Server-only awards, moderator verification, idempotency             |

## Profile

| Feature                 | Phase | Priority | Status | Notes                                                                                            |
| ----------------------- | ----- | -------- | ------ | ------------------------------------------------------------------------------------------------ |
| Profile screen (mock)   | 2     | P0       | ✅     | Local demo identity, language/theme, sign out                                                    |
| Profile info display    | 4     | P0       | 🔲     | Name, avatar, join date                                                                          |
| Contribution statistics | 6     | P0       | 🔲     | Reports, XP, level                                                                               |
| Badge display           | 6     | P0       | 🔲     | Earned achievements                                                                              |
| Report history          | 4     | P1       | ✅     | Authenticated report-tab history uses the reporter-scoped API; local demo history stays separate |
| Privacy controls        | 4     | P0       | 🔲     | Public profile toggle                                                                            |
| Settings screen         | 4     | P1       | 🔲     | Notifications, language, theme                                                                   |
| Account deletion        | 8     | P0       | 🚫     | Requires approved identity, report and evidence retention policy                                 |

## Notifications

| Feature                    | Phase | Priority | Status | Notes                                                     |
| -------------------------- | ----- | -------- | ------ | --------------------------------------------------------- |
| Push notifications (FCM)   | 6     | P0       | 🚫     | Requires approved Firebase/APNs credentials and dev build |
| In-app notification center | 6     | P1       | ✅     | Authenticated inbox and read state                        |
| Report status updates      | 4     | P0       | 🔲     | Status changes notify reporter                            |
| Milestone notifications    | 6     | P1       | ✅     | In-app notifications                                      |
| Community news             | 6     | P2       | 🔲     | Local area updates                                        |
| Notification preferences   | 6     | P1       | ✅     | In-app controls; push unavailable                         |

## Moderation and Safety (Internal)

| Feature                         | Phase | Priority | Status | Notes                                                                                                                       |
| ------------------------------- | ----- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Admin web placeholder           | 0     | P0       | ✅     | README created                                                                                                              |
| Content review queue            | 7     | P0       | ✅     | Admin panel; human moderation required                                                                                      |
| Privacy transformation pipeline | 4     | P0       | ⏳     | Local internal JPEG/PNG worker blurs cascade-detected regions; secure-storage/job wiring and Turkish plate QA still pending |
| Content flagging by users       | 5     | P1       | ✅     | Authenticated reports enter a moderator queue; actioned posts are removed                                                   |
| Abuse prevention                | 6     | P0       | 🔲     | Rate limiting, ban system                                                                                                   |
| User appeals                    | 7     | P1       | 🔲     | Appeal rejected reports                                                                                                     |
| Audit logs                      | 4     | P0       | ✅     | API-level activity audit; cloud logs pending deployment                                                                     |

## Public Authority Tools

| Feature                    | Phase | Priority | Status | Notes                                                      |
| -------------------------- | ----- | -------- | ------ | ---------------------------------------------------------- |
| Government web placeholder | 0     | P0       | ✅     | README created                                             |
| Institution onboarding     | 7     | P0       | ✅     | Admin provisions members; real use awaits legal agreements |
| Org-scoped RBAC            | 7     | P0       | ✅     | Cross-organization case access is denied                   |
| Report assignment          | 7     | P0       | ✅     | Organization admins assign cases to officers               |
| Evidence review UI         | 7     | P0       | ✅     | Purpose-required, audited short-lived links                |
| Case status workflow       | 7     | P0       | ✅     | Limited institution transitions and safe reporter copy     |
| Status notifications       | 7     | P1       | ✅     | Reporter-safe status timeline entries                      |
| Institution case history   | 7     | P1       | ✅     | Organization-scoped case list and details                  |
| Audit and reporting        | 7     | P1       | ✅     | Audited summary CSV export; no precise location/evidence   |

---

## Production Readiness

| Feature                           | Phase | Priority | Status | Notes                                                                                                                                 |
| --------------------------------- | ----- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility and touch targets   | 8     | P0       | ⏳     | Secondary targets are 44 dp and source-token contrast checks pass; VoiceOver/TalkBack, rendered contrast and large-text audit pending |
| Native permission minimization    | 8     | P0       | ⏳     | Purpose strings and iOS/Android source manifests verified; physical prompts and merged release manifest pending                       |
| Physical-device and network QA    | 8     | P0       | ⏳     | iOS/Android simulators only; real-device and degraded-network matrix pending                                                          |
| Report submission pilot readiness | 8     | P0       | 🚫     | Requires approved consent, retention policy and private evidence storage                                                              |
| Release, monitoring and security  | 8     | P1       | 🔲     | Signing, alert ownership, independent security review and rollback rehearsal pending                                                  |

## Permanently Out of Scope

These features will never be built regardless of request:

| Feature                              | Reason                           |
| ------------------------------------ | -------------------------------- |
| Facial recognition                   | Legal prohibition, KVKK, ethical |
| Automated offender identification    | Legal, ethical                   |
| Automated penalties or fines         | Legal, ethical                   |
| Public shaming of alleged offenders  | Legal, ethical, harmful          |
| Live location tracking of reporters  | Privacy                          |
| Selling report data to third parties | Privacy, trust                   |
| AI-automated enforcement decisions   | Legal, ethical                   |
