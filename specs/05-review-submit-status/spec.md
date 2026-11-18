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

- [ ] D4 status list bound to the status poll
- [ ] M7 handback screen
- [ ] D5 review with thumbnails, results, retake links and confirmation
- [ ] Submit route handler + mock processing (random 3–8 s, `?fail=reject`)
- [ ] D6 processing (with the "taking longer" state) and D7 complete
