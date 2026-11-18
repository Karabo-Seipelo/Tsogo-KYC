# 06 · Resilience (cross-cutting)

**Covers:** the brief's Resilience section, for problems that span the whole journey. Feature-specific failures live in their own specs: camera denial and upload failure in 03, face-match failure in 04.
**Serves:** BR-2 (every dead end is a lost player), BR-8 (expiry discards data).
**Screens:** E4, E5, E6, E7, E8.

## Requirements

- R-06.1 **Offline (phone):** detected via `online`/`offline` events and failed fetches. Capture keeps working. An upload attempted while offline fails into E2, where "Try again" re-sends the same image. Heartbeats resume on reconnect.
- R-06.2 **Phone disconnected (desktop):** see spec 02, R-02.7.
- R-06.3 **Session timeout warning:** with 2 minutes left of the 15-minute idle window, show a dialog with a countdown and "I'm still here". With `?ttl=1` the session lasts 1 minute and the warning shows at 30 s left.
- R-06.4 **Session expired:** server reports `expired`; every device shows E6; the QR link no longer works; captures are discarded.
- R-06.5 **Final rejection:** show a support reference, not which check failed.
- R-06.6 Every scenario can be forced for review (`?fail=` / `?ttl=` or real conditions) and is listed in the README.
  - Switches are read when the session is created and **stored on the session**, so they apply on both devices after the QR handoff. On the mobile-only path they're added to the phone URL.
  - `?fail=<kind>` (`upload`, `document`, `match`) fails **the first time only**, so the reviewer sees the error and then the recovery. `?fail=<kind>:always` keeps failing; for `document` and `match` this ends in manual review (E9).
  - `?fail=reject` rejects at processing (E7). `?ttl=1` shortens the session to 1 minute (R-06.3).
  - Switches only change the mock API's responses; they never skip a state or a check.
- R-06.7 `production` Uploads made while offline queue on the phone and send automatically when the connection returns (PB-7).

## Acceptance criteria

- **AC-06.1** GIVEN the phone goes offline THEN a banner (`role="status"`) says "You're offline. We'll carry on when you're back." AND "Take photo" still works.
- **AC-06.2** `production` GIVEN a queued upload WHEN the phone comes back online THEN the upload completes without user action AND the banner clears.
- **AC-06.3** GIVEN 2 minutes of the session remain THEN E5 opens as `role="alertdialog"`, traps focus, Esc = "I'm still here", and the countdown is announced at most every 30 s.
- **AC-06.4** GIVEN the session expires (or `?ttl=1`) THEN E6 says nothing was submitted, with "Start again" → `idle`.
- **AC-06.5** GIVEN processing is rejected (or `?fail=reject`) THEN E7 shows a support reference and next steps, with no fraud-check detail.

## Design notes

- `useOnlineStatus()` hook. `production`: an upload queue in machine context (blobs held in memory on the phone).
- Idle timer as an XState `after` delay or a separate hook that sends `SESSION_EXPIRED`; the server is authoritative (its status reports `expired`).
- Session TTL is refreshed on every request, so activity on either device keeps the session alive.

## Tasks

- [x] T-06.1 Read `?fail=` and `?ttl=` when the session is created and store them on the session, so the phone keeps the same switch after the QR handoff. The README table already lists the switches → R-06.6 · verify: `pnpm test src/app/api/session` · files: `src/app/api/session/route.ts`, `src/app/api/session/route.test.ts` · gate: tests reviewed
- [ ] T-06.2 `useOnlineStatus` and the offline banner. Taking a photo still works, and a failed upload can be sent again → AC-06.1, R-06.1 · verify: `pnpm test src/features/resilience` · files: `src/features/resilience/useOnlineStatus.ts`, `src/features/resilience/useOnlineStatus.test.ts`, `src/features/resilience/OfflineBanner.tsx` · gate: tests reviewed
- [ ] T-06.3 The status response reports the session as expired. `?ttl=1` makes the window 1 minute → R-06.3, R-06.4 · verify: `pnpm test src/app/api/session/status` · files: `src/app/api/session/status/route.ts`, `src/app/api/session/status/route.test.ts` · gate: tests reviewed
- [ ] T-06.4 E5 opens with 2 minutes left (30 seconds when `?ttl=1`). E6 says nothing was submitted, and "Start again" returns to the start → AC-06.3, AC-06.4 · verify: `pnpm test src/features/resilience` · files: `src/features/resilience/TimeoutWarning.tsx`, `src/features/resilience/SessionExpired.tsx`, `src/features/resilience/SessionExpired.test.tsx`
- [ ] T-06.5 E7 shows a support reference and the next step, with no fraud-check detail → AC-06.5 · verify: `pnpm test src/features/resilience` · files: `src/features/resilience/Rejected.tsx`, `src/features/resilience/Rejected.test.tsx`
- [ ] `production` Upload queue (PB-7)
