# Specs

This project is built spec-first: each feature is specified here before it's implemented, and commits follow the spec order. The specs are the source of intent; the code is checked against their acceptance criteria.

It starts from the business, not the screens: `00-product-brief.md` states the business requirements (BR-1 – BR-9) I inferred, how I'd measure them and the questions I'd ask to confirm them. Every spec says which BRs it serves.

## How specs are organised

| File | Contains |
|---|---|
| `00-product-brief.md` | Problem, business requirements (BR-1 – BR-9), stakeholders, scope, open questions |
| `00-constitution.md` | Project-wide rules every spec must follow (stack, UX, accessibility, security, testing, AI usage), agent boundaries (Always / Ask first / Never) and repo conventions (commands, structure, code style, git) |
| `PLAN.md` | Build order in phases with checkpoints, dependencies, risks, and the task format |
| `NN-name/spec.md` | One feature: context, requirements, acceptance criteria (Given/When/Then), design notes, tasks (format in `PLAN.md`) |

Requirements, ACs and tasks tagged `production` are designed but not built for the demo; they're collected in the [production backlog](PLAN.md#production-backlog). Anything tagged `post-ship` belongs to P6 ([spec 11](11-hardening/spec.md)). P6 is built: AC-11.1 – AC-11.6. PB-16 stays in the backlog. Spec numbers are stable IDs, not the build order; the order is in [`PLAN.md`](PLAN.md) (content and the machine come first). Each spec can be tested on its own.

The workflow is gated: **specify → plan → tasks → implement**, and each step is reviewed before the next starts. When behaviour changes, the spec changes first.

| #   | Spec                                                                                  | Status                               |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| 00  | [Product brief](00-product-brief.md)                                                  | Approved                             |
| 00  | [Constitution](00-constitution.md)                                                    | Approved                             |
| —   | [Plan](PLAN.md)                                                                       | Approved                             |
| 01  | [Journey state machine](01-journey-state-machine/spec.md)                             | Approved · backlog: PB-4, PB-10      |
| 02  | [Start, session & QR handoff](02-session-and-qr-handoff/spec.md)                      | Approved · backlog: PB-3, PB-5, PB-6 |
| 03  | [Document capture & validation](03-document-capture-validation/spec.md)               | Approved                             |
| 04  | [Selfie, liveness & face match](04-selfie-liveness-face-match/spec.md)                | Approved                             |
| 05  | [Review, submit & status](05-review-submit-status/spec.md)                            | Approved                             |
| 06  | [Resilience (cross-cutting)](06-resilience/spec.md)                                   | Approved · backlog: PB-7             |
| 07  | [Environments & bootstrap](07-environments-bootstrap/spec.md)                         | Approved · backlog: PB-3, PB-8       |
| 08  | [Funnel events, audit trail & manual review](08-insights-audit-manual-review/spec.md) | Approved · backlog: PB-9             |
| 09  | [Content layer](09-content-layer/spec.md)                                             | Approved · backlog: PB-1, PB-2       |
| 10  | [Visual design](10-visual-design/spec.md)                                             | Approved · backlog: PB-15 |
| 11  | [Hardening (post-ship)](11-hardening/spec.md)                                         | Built · AC-11.1 – AC-11.6 · backlog: PB-16 |

## Traceability: business goal → requirement → spec → screen → test

Screen codes refer to `docs/wireframes.pdf`: **D** = desktop, **M** = mobile, **E** = error states.

### Functional requirements

| Brief requirement | Serves | Spec | Acceptance criteria | Screens | Test |
|---|---|---|---|---|---|
| 1. Start screen with time estimate and requirements | BR-2, BR-3 | 02 | AC-02.1 | D1 | `pnpm test src/features/start/StartScreen.test.tsx` |
| 2. Device selection (this device / phone via QR) | BR-2 | 02 | AC-02.2 | D2 | `pnpm test src/features/start/DeviceSelection.test.tsx` |
| 3. QR-code mobile handoff | BR-2, BR-4, BR-7 | 02 | AC-02.3 – AC-02.7 | D3, D3b | `pnpm test src/features/handoff src/app/m`. Real phone: `pnpm dev:phone`. Preview QR checked on the preview deploy. |
| 4. Document capture (passport, national ID, licence) | BR-1 | 03 | AC-03.1 – AC-03.3 | M1, M2 | `pnpm test src/features/capture/DocumentType.test.tsx src/features/capture/DocumentCapture.test.tsx` |
| 5. Document validation with success/failure | BR-2, BR-4, BR-7 | 03 | AC-03.4 – AC-03.6 | M3a, M3b | `pnpm test src/features/capture/DocumentPassed.test.tsx src/features/capture/DocumentJourney.test.tsx src/app/api/session/document` |
| 6. Selfie capture with device camera | BR-1 | 04 | AC-04.1 – AC-04.2 | M4 | `pnpm test src/features/capture/SelfieCapture.test.tsx` |
| 7. Mock liveness step | BR-4 | 04 | AC-04.3 – AC-04.4 | M5 | `pnpm test src/features/capture/LivenessCheck.test.tsx` |
| 8. Face matching via mocked API | BR-1, BR-4 | 04 | AC-04.5 – AC-04.7 | M6, E3 | `pnpm test src/features/capture/FaceMatch.test.tsx src/app/api/session/face-match` |
| 9. Verification status tracking | BR-2, BR-3 | 05 | AC-05.1 – AC-05.3 | D4, D6 | `pnpm test src/features/review/StatusScreen.test.tsx` |
| 10. Review and submit | BR-1, BR-2 | 05 | AC-05.4 – AC-05.6 | D5, D7, M7 | `pnpm test src/features/review/ReviewScreen.test.tsx src/features/review/ProcessingScreen.test.tsx src/features/review/CompleteScreen.test.tsx src/features/review/PhoneDone.test.tsx src/app/api/session/submit` |

### Business requirements not in the take-home brief

| Business requirement | Spec | Acceptance criteria | Screens | Test |
|---|---|---|---|---|
| BR-1, BR-4 · Audit trail of every decision | 08 | AC-08.2 | — | `pnpm test src/lib/analytics/audit.test.ts` |
| BR-5 · Manual review instead of dead ends | 08 | AC-08.3 – AC-08.4 | E9, D4 | `pnpm test src/features/review/ManualReview.test.tsx src/features/review/StatusScreen.test.tsx src/app/api/session/manual-review` |
| BR-6, BR-7 · Funnel events | 08 | AC-08.1 | — | `pnpm test src/lib/analytics/track.test.ts` |
| BR-6 · Insights page (`production`, PB-9) | 08 | AC-08.5 | `/insights` | Not built (PB-9) |
| BR-8 · Data minimisation and expiry | Constitution §5, 03 | AC-03.9 | — | `pnpm test src/lib/image/resizeImage.test.ts src/app/api/session/document` |
| BR-9 · Copy editable without a release | 09 | AC-09.1 – AC-09.7 | All | `pnpm test src/lib/content` and `pnpm lint`. AC-09.3, AC-09.4 and AC-09.6 are production (PB-1, PB-2). |

### State management, API and architecture requirements

| Brief requirement | Spec | Acceptance criteria |
|---|---|---|
| Journey modelled as a workflow with defined states | 01 | AC-01.1 – AC-01.9 |
| Mock APIs: session, document, selfie, face match, status | 02, 03, 04, 05 | See each spec's API section |
| Architecture doc ≤ 2 pages | — | `docs/ARCHITECTURE.md` |
| Session security: cookie-only session identity, cookie flags, cross-site request check (not in the brief) | 02 | AC-02.13, AC-02.14 |
| Post-ship hardening: headers, thumbnail check, heartbeat step, cookie `Max-Age`, origin host, submit guard (not in the brief) | 11 | AC-11.1 – AC-11.6 built |

### Resilience requirements

| Brief requirement | Spec | Acceptance criteria | Screens |
|---|---|---|---|
| Camera denial | 03, 04 | AC-03.7, AC-04.8 | E1 |
| Upload failures | 03 | AC-03.8 | E2 |
| Verification failures | 03, 04, 06, 08 | AC-03.6, AC-04.7, AC-06.5, AC-08.3 | M3b, E3, E7, E9 |
| Network interruptions | 02, 06 | AC-06.1 – AC-06.2, AC-02.7 | E4, E8 |
| Session timeout | 06 | AC-06.3 – AC-06.4 | E5, E6 |

### UX and accessibility requirements

| Brief requirement | Where |
|---|---|
| Responsive (desktop, tablet, mobile) | Constitution §3; every spec's UI criteria |
| Keyboard navigation, ARIA labels, clear validation/error messaging | Constitution §4; every spec's a11y criteria |
| Visual design: tokens, contrast, focus, reduced motion, layouts (not in the brief) | 10 | AC-10.1 – AC-10.6 |
| Help, Save & exit and privacy notice (not in the brief; shown in the wireframes' header and D1) | 02, AC-02.9 – AC-02.12 |
