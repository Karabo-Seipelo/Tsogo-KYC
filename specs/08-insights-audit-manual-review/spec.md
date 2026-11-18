# 08 · Funnel events, audit trail & manual review

**Covers:** the business requirements that aren't in the take-home brief: BR-1, BR-4, BR-5, BR-6, BR-7 (see `00-product-brief.md`).
**Screens:** E9 (manual review). `/insights` is in the production backlog.

## Context

The technical brief describes the player's journey. The business also needs to **measure** it (BI, marketing, finance), **reconstruct** decisions (compliance) and **hand off** cases the system can't decide (operations). These are small to build, and they turn the business requirements into something a reviewer can see.

## Requirements

- R-08.1 **Funnel events.** A `track(event, props)` helper records typed events as structured server log lines. No personal data: session ID (server-side only), step, reason codes and timings.
- R-08.2 **Audit trail.** Every machine transition is appended to the session as `{ at, from, to, event, outcome? }`. It's append-only and expires with the session in the demo; in production it would be kept for the FICA retention period.
- R-08.3 **Manual review handoff.** When document or face-match attempts are exhausted (`error` with reason `maxAttempts`, spec 01), the player sees E9: "We'll review this manually" with a reference number and an expected timeframe, instead of only an error. The session is marked `manualReview`.
- R-08.4 `production` Funnel counters per event and step, and an `/insights` page with sessions per step, completion rate and top failure reasons. Events also flow to a BI pipeline (PB-9).
- R-08.5 **Request logs.** Every API request writes one structured log line: route, status, duration, step and error code. No personal data. These are what you read in Vercel's runtime logs.

## Funnel events

| Event | Props | Answers |
|---|---|---|
| `kyc_started` | `device` | How many begin? On which device? |
| `kyc_device_selected` | `choice` (`phone` / `this_device`) | Is the QR handoff used? |
| `kyc_handoff_completed` | `secondsToScan` | Is the handoff smooth? |
| `kyc_step_viewed` | `step` | Where do players reach? |
| `kyc_step_failed` | `step`, `reason` (`blurry`, `glare`, `expired`, `no_match`, `camera_denied`, `upload_failed`…) | Why do players fail? |
| `kyc_retry` | `step`, `attempt` | How many attempts do fixes take? (provider cost, BR-7) |
| `kyc_manual_review` | `step` | How often do people need to step in? |
| `kyc_submitted` | `secondsSinceStart` | Time to verify (BR-3) |
| `kyc_completed` | `result` (`verified` / `rejected`) | Completion and rejection rates |

## Acceptance criteria

- **AC-08.1** GIVEN any step is viewed, failed or retried THEN the matching event is recorded with the props above AND contains no personal data or images.
- **AC-08.2** GIVEN a completed session THEN its audit trail lists every transition in order, with timestamps, from `idle` to the final state.
- **AC-08.3** GIVEN two failed document or face-match attempts WHEN the third attempt fails THEN E9 shows a reference number, what happens next and the expected timeframe; focus moves to its heading; there's no "try again" loop.
- **AC-08.4** GIVEN the desktop is tracking a phone session that moves to manual review THEN D4 shows the same outcome within one poll.
- **AC-08.5** `production` GIVEN several demo sessions THEN `/insights` shows per-step counts, completion rate and the top three failure reasons.
- **AC-08.6** GIVEN any API request THEN exactly one structured log line is written with route, status, duration, step and error code, AND it contains no personal data or images.

## Design notes

- The audit trail is stored as a list on the session (`audit`) through `SessionStore`, so it works locally and on Vercel and expires with the session. Funnel events go to the logs only; storing or counting them is `production` (PB-9).
- P1 appends each transition to an in-memory list the tests read: `{ at, from, to, event, outcome? }`. P2's `SessionStore` keeps that same list on the session. The subscriber stays the only writer.
- The audit entry is written in one place: the machine's transition hook (`actor.subscribe`) on the device that owns the step, plus the server's own state changes.
- In production, events would go to the BI pipeline (e.g. a warehouse via an event collector), and the audit trail to durable, access-controlled storage.

## Tasks

- [x] T-08.1 `track()` and the typed event union from the funnel table; a recorded event has those props and no personal data → R-08.1, AC-08.1 · verify: `pnpm test src/lib/analytics` · files: `src/lib/analytics/events.ts`, `src/lib/analytics/track.ts`, `src/lib/analytics/track.test.ts` · gate: tests reviewed
- [x] T-08.2 One subscriber appends every transition, in order, to an in-memory list → R-08.2, AC-08.2 · verify: `pnpm test src/lib/analytics` · files: `src/lib/analytics/audit.ts`, `src/lib/analytics/audit.test.ts` · gate: tests reviewed
- [x] T-08.3 (P2) One structured log line per API request → R-08.5, AC-08.6 · verify: `pnpm test src/lib/analytics` · files: `src/lib/analytics/requestLog.ts`
- [x] T-08.4 (P4) E9 manual-review screen and the `manualReview` outcome → AC-08.3 · verify: `pnpm test src/features/review` · files: `src/features/review/ManualReview.tsx`, `src/features/review/ManualReview.test.tsx`
- [ ] T-08.5 Desktop shows the same manual-review outcome within one poll → AC-08.4 · verify: `pnpm test src/features/review` · files: `src/features/review/StatusScreen.tsx`, `src/features/review/StatusScreen.test.tsx`
- [ ] T-08.6 `production` Funnel counters and `/insights` (PB-9)
