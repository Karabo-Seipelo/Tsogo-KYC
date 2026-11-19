# 11 · Hardening (post-ship)

**Covers:** the gaps found in the handover security review. These tighten the session cookie, the cross-site check, the thumbnail the server stores, the step a heartbeat may write, the response headers, and when a submit is accepted (found in the [E2E run](../../docs/E2E-REPORT.md), F-1). Rate limiting, signed handoff tokens, encryption at rest and refusing to boot with `DEMO_MODE=false` stay in the production backlog (PB-12, PB-13, PB-8) and are not repeated here.
**Serves:** BR-8 (personal data is bounded); constitution §5 (the server is the source of truth, and only a thumbnail is kept).
**Screens:** none. The journey looks the same. Capture must still be able to open the camera.

Every requirement, acceptance criterion and task below is `post-ship`. None of it is built until P6 is started.

## Requirements

- R-11.1 `post-ship` Every response, including API routes, `/privacy` and error pages, sends:
  - `Content-Security-Policy` with `default-src 'self'` and `frame-ancestors 'none'`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` that allows the camera on this origin only (`camera=(self)`)
  `X-Robots-Tag` stays as spec 07 defines it. `Strict-Transport-Security` stays the platform's header on HTTPS. The app does not add a CORS header.
- R-11.2 `post-ship` `POST /api/session/document` and `POST /api/session/selfie` store a thumbnail only when the part is a JPEG (bytes start `FF D8 FF`) and its size is at most 150 KB. Anything else is 400 and the session's stored thumbnail is unchanged. On the document route, `side` must be `front` or `back`; any other value is 400. The browser resize in spec 03 still runs; this is the server's own check.
- R-11.3 `post-ship` `POST /api/session/heartbeat` may set `session.step` only to a state name from spec 01 (`idle`, `deviceSelection`, `qrHandoff`, `documentUpload`, `documentValidation`, `selfieCapture`, `livenessCheck`, `faceMatch`, `review`, `processing`, `complete`, `error`). Any other string is ignored. `processing`, `complete` and `error` are not replaced by an earlier state. `lastSeen` is still updated, and the response is still 204.
- R-11.4 `post-ship` The session cookie set by `POST /api/session` and by `POST /api/handoff/{token}` has `Max-Age` equal to the session window: 900 seconds, or 60 seconds when the session was created with `?ttl=1`. Later requests do not slide that `Max-Age`. The flags in R-02.13 are unchanged.
- R-11.5 `post-ship` The `Origin` check in R-02.13 compares `Origin` to the protocol and host of the request URL. A client-supplied `x-forwarded-host` or `x-forwarded-proto` that names a different host does not change the expected origin. The QR host in R-02.4 is unchanged.
- R-11.6 `post-ship` `POST /api/session/submit` moves the session to `processing` only when the session holds a document thumbnail and a selfie thumbnail, and has a passed result for the document check, liveness and face match. A session already in `processing`, `complete` or `error` is not submitted again. Anything else is 409 and the session is unchanged. The stored `step` is not the test, because a heartbeat may set it (R-11.3).

## Acceptance criteria

- **AC-11.1** `post-ship` GIVEN any route WHEN the response is sent THEN it carries the headers in R-11.1 AND `Permissions-Policy` does not disable the camera AND the document and selfie screens can still open it.
- **AC-11.2** `post-ship` GIVEN a session WHEN the thumbnail is not a JPEG or is larger than 150 KB, OR the document `side` is not `front` or `back` THEN the response is 400 AND the stored session is unchanged.
- **AC-11.3** `post-ship` GIVEN a session in `complete` WHEN a heartbeat reports `review` or `not-a-step` THEN the stored step stays `complete` AND `lastSeen` changes AND the response is 204. GIVEN a session in `documentUpload` WHEN a heartbeat reports `selfieCapture` THEN the stored step becomes `selfieCapture`.
- **AC-11.4** `post-ship` GIVEN `POST /api/session` THEN `Set-Cookie` includes `Max-Age=900`, or `Max-Age=60` when `?ttl=1`. GIVEN a redeemed handoff THEN the phone's cookie has the same `Max-Age` as that session's window.
- **AC-11.5** `post-ship` GIVEN a `POST` whose request URL host is the app AND `x-forwarded-host` is `evil.example` AND `Origin` is `https://evil.example` THEN the response is 403 AND the session is unchanged. GIVEN the same request WHEN `Origin` matches the request URL THEN it is accepted.
- **AC-11.6** `post-ship` GIVEN a session missing either thumbnail, OR without a passed document check, liveness or face match, OR whose step was set to `review` by a heartbeat alone WHEN `POST /api/session/submit` THEN the response is 409 AND the session is unchanged AND no result is recorded later. GIVEN a session in `processing`, `complete` or `error` WHEN submit THEN 409. GIVEN both thumbnails and three passed results THEN 202 `{ step: 'processing' }` as in R-05.4.

## Design notes

- Confirm the CSP against a production build of Next.js 16 before locking `script-src` and `style-src`. The policy may need the inline styles the framework emits. It does not use a wildcard origin, and `frame-ancestors` stays `'none'`.
- 150 KB is the server cap for the ~320 px thumbnail from R-03.4. It is far below Vercel's request-body limit, which only bounds the whole request.
- The cached HTML response from the platform can include `access-control-allow-origin: *`. That header is not set by this app, it is not on `/api`, and it is not paired with credentials. This spec does not add CORS.
- P6 does not start just because P5 passed. Start it only when asked.

## Tasks

- [x] T-11.1 (P6) `post-ship` Send the R-11.1 headers on every response, with `camera=(self)` → AC-11.1 · verify: `pnpm test` and a header check on `/` and `/api/session/status` · files: `next.config.ts`
- [x] T-11.2 (P6) `post-ship` Reject a document or selfie thumbnail that is not a JPEG of at most 150 KB, and a document `side` other than `front` or `back` → AC-11.2 · verify: `pnpm test src/app/api/session/document src/app/api/session/selfie` · files: `src/app/api/session/document/route.ts`, `src/app/api/session/document/route.test.ts`, `src/app/api/session/selfie/route.ts`, `src/app/api/session/selfie/route.test.ts` · gate: tests reviewed
- [x] T-11.3 (P6) `post-ship` Accept only spec 01 state names on heartbeat, and do not overwrite `processing`, `complete` or `error` → AC-11.3 · verify: `pnpm test src/app/api/session/heartbeat` · files: `src/app/api/session/heartbeat/route.ts`, `src/app/api/session/heartbeat/route.test.ts` · gate: tests reviewed
- [x] T-11.4 (P6) `post-ship` Set the session cookie `Max-Age` to the session window on create and on redeem → AC-11.4 · verify: `pnpm test src/app/api/session src/app/api/handoff` · files: `src/app/api/session/route.ts`, `src/app/api/session/route.test.ts`, `src/app/api/handoff/[token]/route.ts`, `src/app/api/handoff/[token]/route.test.ts` · gate: tests reviewed
- [x] T-11.5 (P6) `post-ship` Judge `Origin` against the request URL host, so a conflicting `x-forwarded-host` cannot move the check → AC-11.5 · verify: `pnpm test src/lib/http src/app/api/session` · files: `src/lib/http/requestHost.ts`, `src/lib/http/requestHost.test.ts` · gate: tests reviewed
- [ ] T-11.6 (P6) `post-ship` **Tests first:** submit returns 409 unless both thumbnails and three passed results are on the session, and never re-submits a finished session → R-11.6, AC-11.6 · verify: `pnpm test src/app/api/session/submit` · files: `src/app/api/session/submit/route.ts`, `src/app/api/session/submit/route.test.ts` · gate: tests reviewed
