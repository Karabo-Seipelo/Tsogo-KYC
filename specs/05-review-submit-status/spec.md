# 05 · Review, submit & status

**Covers:** brief requirements 9 (verification status tracking) and 10 (review and submit); API: session status, submit.
**Serves:** BR-1, BR-2, BR-3.
**Screens:** D4, D5, D6, D7, M7.

## Context

While the phone does the capture steps, the desktop shows live progress. When the phone is done, the desktop moves to review, the user submits, and the result is shown.

## Requirements

- R-05.1 D4 lists the steps with status (Done / In progress / Waiting), driven by the status poll (spec 02, R-02.6).
- R-05.2 M7 tells phone users to return to their computer. Single-device users go straight to review.
- R-05.3 Review shows the document type, both thumbnails, each check's result, a "Retake" link per capture, and a confirmation checkbox.
- R-05.4 `POST /api/session/submit` moves the session to `processing`; the result arrives via the status poll.
- R-05.5 Processing that takes longer than ~2 minutes shows "Taking longer than usual".

## Acceptance criteria

- **AC-05.1** GIVEN the phone is capturing WHEN the server step changes THEN D4 updates within one poll AND the change is announced via `aria-live`.
- **AC-05.2** GIVEN each row in D4 THEN its status is shown as icon + text, never colour alone.
- **AC-05.3** GIVEN the phone reaches M7 THEN the desktop moves to D5 within one poll.
- **AC-05.4** GIVEN D5 WHEN the confirmation box is not ticked THEN "Submit" is disabled AND explains why (`aria-describedby`).
- **AC-05.5** GIVEN D5 WHEN "Retake" is used THEN the user returns to that step and other captures are kept (spec 01, AC-01.7).
- **AC-05.6** GIVEN submit WHEN processing completes THEN D7 shows "You're verified", AND the session and handoff token are closed.

## API

| Method | Endpoint | Response |
|---|---|---|
| `POST` | `/api/session/submit` | `202 { step: 'processing' }` |
| `GET` | `/api/session/status` | (spec 02) |

## Tasks

- [x] T-05.1 D5 review: document type, thumbnails, check results, a retake per capture, and the confirmation checkbox → R-05.3, AC-05.4, AC-05.5 · verify: `pnpm test src/features/review` · files: `src/features/review/ReviewScreen.tsx`, `src/features/review/ReviewScreen.test.tsx`
- [x] T-05.2 `POST /api/session/submit` moves the session to `processing`; the mock result follows after 3–8 s → R-05.4, AC-05.6 · verify: `pnpm test src/app/api/session/submit` · files: `src/app/api/session/submit/route.ts`, `src/app/api/session/submit/route.test.ts` · gate: tests reviewed
- [x] T-05.3 D6 processing, including "taking longer", and D7 complete → R-05.5, AC-05.6 · verify: `pnpm test src/features/review` · files: `src/features/review/ProcessingScreen.tsx`, `src/features/review/CompleteScreen.tsx`
- [ ] T-05.4 (P3) D4 status list and M7 handback → R-05.1, R-05.2, AC-05.1 – AC-05.3 · verify: `pnpm test src/features/review` · files: `src/features/review/StatusScreen.tsx`, `src/features/review/PhoneDone.tsx`
- [ ] T-05.5 (P4) `?fail=reject` on submit → spec 06 · verify: `pnpm test src/app/api/session/submit` · files: `src/app/api/session/submit/route.ts`
