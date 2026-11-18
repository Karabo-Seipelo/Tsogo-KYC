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

Requirements, ACs and tasks tagged `production` are designed but not built for the demo; they're collected in the [production backlog](PLAN.md#production-backlog). Spec numbers are stable IDs, not the build order; the order is in [`PLAN.md`](PLAN.md) (content and the machine come first). Each spec can be tested on its own.

The workflow is gated: **specify → plan → tasks → implement**, and each step is reviewed before the next starts. When behaviour changes, the spec changes first.

| # | Spec | Status |
|---|---|---|
| 00 | [Product brief](00-product-brief.md) | Draft |
| 00 | [Constitution](00-constitution.md) | Draft |
| — | [Plan](PLAN.md) | Draft |
| 01 | [Journey state machine](01-journey-state-machine/spec.md) | Draft · backlog: PB-4, PB-10 |
| 02 | [Start, session & QR handoff](02-session-and-qr-handoff/spec.md) | Draft · backlog: PB-3, PB-5, PB-6 |
| 03 | [Document capture & validation](03-document-capture-validation/spec.md) | Draft |
| 04 | [Selfie, liveness & face match](04-selfie-liveness-face-match/spec.md) | Draft |
| 05 | [Review, submit & status](05-review-submit-status/spec.md) | Draft |
| 06 | [Resilience (cross-cutting)](06-resilience/spec.md) | Draft · backlog: PB-7 |
| 07 | [Environments & bootstrap](07-environments-bootstrap/spec.md) | Draft · backlog: PB-3, PB-8 |
| 08 | [Funnel events, audit trail & manual review](08-insights-audit-manual-review/spec.md) | Draft · backlog: PB-9 |
| 09 | [Content layer](09-content-layer/spec.md) | Draft · backlog: PB-1, PB-2 |

## Traceability: business goal → requirement → spec → screen → test

Screen codes refer to `docs/wireframes.pdf`: **D** = desktop, **M** = mobile, **E** = error states.

### Functional requirements

| Brief requirement | Serves | Spec | Acceptance criteria | Screens | Test |
|---|---|---|---|---|---|
| 1. Start screen with time estimate and requirements | BR-2, BR-3 | 02 | AC-02.1 | D1 | _TBC_ |
| 2. Device selection (this device / phone via QR) | BR-2 | 02 | AC-02.2 | D2 | _TBC_ |
| 3. QR-code mobile handoff | BR-2, BR-4, BR-7 | 02 | AC-02.3 – AC-02.7 | D3, D3b | _TBC_ |
| 4. Document capture (passport, national ID, licence) | BR-1 | 03 | AC-03.1 – AC-03.3 | M1, M2 | _TBC_ |
| 5. Document validation with success/failure | BR-2, BR-4, BR-7 | 03 | AC-03.4 – AC-03.6 | M3a, M3b | _TBC_ |
| 6. Selfie capture with device camera | BR-1 | 04 | AC-04.1 – AC-04.2 | M4 | _TBC_ |
| 7. Mock liveness step | BR-4 | 04 | AC-04.3 – AC-04.4 | M5 | _TBC_ |
| 8. Face matching via mocked API | BR-1, BR-4 | 04 | AC-04.5 – AC-04.7 | M6, E3 | _TBC_ |
| 9. Verification status tracking | BR-2, BR-3 | 05 | AC-05.1 – AC-05.3 | D4, D6 | _TBC_ |
| 10. Review and submit | BR-1, BR-2 | 05 | AC-05.4 – AC-05.6 | D5, D7, M7 | _TBC_ |

### Business requirements not in the take-home brief

| Business requirement | Spec | Acceptance criteria | Screens | Test |
|---|---|---|---|---|
| BR-1, BR-4 · Audit trail of every decision | 08 | AC-08.2 | — | _TBC_ |
| BR-5 · Manual review instead of dead ends | 08 | AC-08.3 – AC-08.4 | E9, D4 | _TBC_ |
| BR-6, BR-7 · Funnel events | 08 | AC-08.1 | — | _TBC_ |
| BR-6 · Insights page (`production`, PB-9) | 08 | AC-08.5 | `/insights` | _TBC_ |
| BR-8 · Data minimisation and expiry | Constitution §5, 03 | AC-03.9 | — | _TBC_ |
| BR-9 · Copy editable without a release | 09 | AC-09.1 – AC-09.7 | All | _TBC_ |

### State management, API and architecture requirements

| Brief requirement | Spec | Acceptance criteria |
|---|---|---|
| Journey modelled as a workflow with defined states | 01 | AC-01.1 – AC-01.9 |
| Mock APIs: session, document, selfie, face match, status | 02, 03, 04, 05 | See each spec's API section |
| Architecture doc ≤ 2 pages | — | `docs/ARCHITECTURE.md` |
| Session security: cookie-only session identity, cookie flags, cross-site request check (not in the brief) | 02 | AC-02.13, AC-02.14 |

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
| Help, Save & exit and privacy notice (not in the brief; shown in the wireframes' header and D1) | 02, AC-02.9 – AC-02.12 |
