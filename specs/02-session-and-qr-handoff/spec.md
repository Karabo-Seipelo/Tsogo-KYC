# 02 · Start, session & QR handoff

**Covers:** brief requirements 1 (start screen), 2 (device selection), 3 (QR handoff); API: session creation and status.
**Serves:** BR-2, BR-3, BR-4 (smooth handoff; better phone photos mean fewer failures).
**Screens:** D1, D2, D3, D3b, E8; the header's Help and Save & exit; `/privacy`.

## Context

Users may start on desktop and switch to their phone to capture documents and a selfie. The two devices must share one session even though, on Vercel, their requests can land on different serverless instances. The server (Redis) is the single source of truth.

```mermaid
sequenceDiagram
  participant D as Desktop
  participant API as API
  participant S as SessionStore
  participant P as Phone

  D->>API: POST /api/session
  API->>S: session + handoff token
  API-->>D: cookie + token for QR

  P->>API: POST /api/handoff/token
  API->>S: GETDEL once
  API-->>P: cookie + redirect /m

  loop every 10s
    P->>API: heartbeat + step
  end

  loop every 2–3s while visible
    D->>API: GET status
    API-->>D: mirror into machine
  end
```

## Requirements

- R-02.1 The start screen shows the time estimate (3–5 minutes), what's needed, a privacy line and "Start verification".
- R-02.2 Device selection offers "Use my phone" (pre-selected on desktop) and "Continue on this computer". It's skipped on mobile.
- R-02.3 `POST /api/session` creates `session:{id}` (15-min sliding TTL) and `handoff:{token}` (10-min TTL, ≥128-bit random). The session ID goes in an httpOnly cookie and nowhere else: it's never in a response body, a URL or the client's JavaScript. Every other `/api/session/*` call finds the session from that cookie, and returns 401 without one.
- R-02.4 The QR code encodes `https://<host>/m/{token}`, where `<host>` is the host of the page the desktop is open on. It contains no session ID.
- R-02.5 `POST /api/handoff/{token}` redeems the token with `GETDEL` (single use), sets the phone's cookie and redirects to `/m`.
- R-02.6 The desktop polls `GET /api/session/status` every 2–3 s (paused while the tab is hidden) and mirrors the server step into its machine. D4's step counter is taken from that same `session.step`, so desktop and phone always show the same number (R-01.7).
- R-02.7 The phone sends its first `POST /api/session/heartbeat` as soon as `/m` loads after a redeem, before the user taps anything, and then every 10 s. The desktop treats `lastSeen > 30 s` as disconnected.
- R-02.8 `POST /api/session/handoff` issues a new token and revokes the old one, without restarting the session.
- R-02.9 **Help** (header, every screen, desktop and phone) opens one responsive dialog. It holds three short answers (why we need this, which documents are accepted, what happens to my photos), a link to the privacy notice and a support contact line. It doesn't change the journey state.
- R-02.10 **Save & exit** (desktop header) asks for confirmation, then shows a "saved" page saying the session is kept for its normal 15-minute idle window. It doesn't promise more, because the demo has no account. "Return to Tsogo" is a stub link in the demo.
- R-02.11 **Privacy notice** at `/privacy`, linked from D1 and from Help: what's collected, that full-size images are never stored, that everything expires with the session, that it's a demo, and POPIA in plain language.
- R-02.12 All three use copy from `help.*`, `saveExit.*` and `privacy.*` (spec 09). They have no wireframe yet; Help and the confirmation follow the E5 dialog pattern.
- R-02.13 Session cookies are `httpOnly`, `SameSite=Lax`, `Path=/`, host-only (no `Domain`), and `Secure` over HTTPS. Every `POST` under `/api` checks that `Origin` matches the origin of the request URL (spec 11, R-11.5) and returns 403 otherwise, with no state change.
- R-02.14 `production` On the phone, Help opens as a bottom sheet instead of a dialog (PB-6).
- R-02.15 `production` Returning to the same browser within the idle window after Save & exit resumes the journey at the same step (PB-5).

## Acceptance criteria

- **AC-02.1** GIVEN a new visitor WHEN D1 loads THEN they see the time estimate, the requirements list (as a `<ul>`), the privacy line and "Start verification", AND focus is on the `h1`.
- **AC-02.2** GIVEN desktop WHEN D2 loads THEN "Use my phone" is selected AND the options are a radio group usable with arrow keys.
- **AC-02.3** GIVEN D3 WHEN the QR is rendered THEN its URL contains the handoff token and no session ID, AND the host matches the address the desktop is using.
- **AC-02.4** GIVEN a valid token WHEN the phone opens the link THEN the phone joins the session, the URL becomes `/m`, AND within one poll the desktop chip reads "Phone connected" (announced via `aria-live`), without the user tapping anything on the phone.
- **AC-02.5** GIVEN a token that has been redeemed WHEN it's opened again THEN it's rejected with a friendly "This link has already been used" page.
- **AC-02.6** GIVEN D3 WHEN the token expires before redemption THEN D3b shows; "Get a new code" shows a fresh QR, AND the session and step are unchanged.
- **AC-02.7** GIVEN the phone is connected WHEN no heartbeat arrives for 30 s THEN D4 switches to the E8 state with "Show the QR code again"; WHEN heartbeats resume THEN it returns to normal. WHEN "Show the QR code again" is activated THEN a new token is issued (R-02.8), the QR and countdown show the new code with its full 10 minutes, the old token returns 410, AND the session step is unchanged.
- **AC-02.8** `production` GIVEN the Docker `prodlike` profile (2 instances) WHEN the full handoff is run THEN it succeeds (proves no in-memory dependency).
- **AC-02.9** GIVEN any screen WHEN "Help" is activated THEN the panel opens with focus on its heading, traps focus, closes with Esc or "Close", returns focus to "Help", AND the journey state is unchanged.
- **AC-02.10** GIVEN desktop WHEN "Save & exit" is confirmed THEN the saved page says how long the session is kept AND does not say the user can pick up where they left off (resume is PB-5).
- **AC-02.11** GIVEN the "Save & exit" confirmation WHEN "Keep going" or Esc is chosen THEN nothing changes and focus returns to the trigger.
- **AC-02.12** GIVEN D1 or the Help panel WHEN the privacy link is followed THEN `/privacy` opens with every section from R-02.11, AND the journey can be resumed from it.
- **AC-02.13** GIVEN any `POST` to `/api` WHEN its `Origin` doesn't match the request host THEN it returns 403 AND the session is unchanged; GIVEN the session cookie THEN it carries `HttpOnly`, `SameSite=Lax` and, over HTTPS, `Secure`.
- **AC-02.14** GIVEN any `/api/session/*` call without a valid session cookie THEN it returns 401; AND no API response body or URL contains the session ID.
- **AC-02.15** `production` GIVEN a saved session WHEN the user returns in the same browser within 15 minutes THEN the journey resumes at the same step; after that THEN E6 shows.
- **AC-02.16** GIVEN D3 WHEN "Can't scan? Continue on this computer instead" is activated, OR GIVEN D3b WHEN "Continue on this computer instead" is activated, THEN the desktop continues at document capture (spec 01, AC-01.10).

## API

| Method | Endpoint | Response |
|---|---|---|
| `POST` | `/api/session` | `{ handoffToken, handoffExpiresAt }` + cookie |
| `GET` | `/api/session/status` | `{ step, phoneConnected, lastSeen, checks, livenessPassed, match, handoffExpired }` |
| `POST` | `/api/session/handoff` | `{ handoffToken, handoffExpiresAt }` |
| `POST` | `/api/handoff/:token` | redirect to `/m` + cookie, or 410 if used/expired |
| `POST` | `/api/session/heartbeat` | `204` |

## Design notes

- `SessionStore` interface: `get`, `set(ttl)`, `getDel`, `expire`. Memory adapter on `globalThis` (survives hot reload); Redis adapter via `@upstash/redis`. Keys are prefixed by environment.
- Cookie flags per R-02.13; `Secure` is set from the request protocol, so plain-HTTP localhost still works. `SameSite=Lax` doesn't affect the QR flow: the phone has no cookie until it redeems the token with a same-origin `POST`, which passes the `Origin` check.
- `qrcode.react` SVG with an accessible name ("QR code to continue on your phone") plus a text fallback ("Can't scan? Continue on this computer").
- Polling via `useQuery({ refetchInterval: 2500, refetchIntervalInBackground: false })`.

## Tasks

- [x] T-02.1 `SessionStore` (`get`, `set`, `getDel`, `expire`) and the memory adapter on `globalThis` → design note · verify: `pnpm test src/lib/store` · files: `src/lib/store/sessionStore.ts`, `src/lib/store/memoryStore.ts`, `src/lib/store/memoryStore.test.ts` · gate: tests reviewed
- [x] T-02.2 `POST /api/session`: create the session, set the httpOnly cookie, reject a bad `Origin` with 403, return 401 without a cookie, and keep the session id out of the body and the URL → R-02.3, R-02.13, AC-02.13, AC-02.14 · verify: `pnpm test src/app/api/session` · files: `src/app/api/session/route.ts`, `src/app/api/session/route.test.ts` · gate: tests reviewed
- [x] T-02.3 `GET /api/session/status` returns the single-device step and checks → R-02.6 · verify: `pnpm test src/app/api/session` · files: `src/app/api/session/status/route.ts`, `src/app/api/session/status/route.test.ts` · gate: tests reviewed
- [x] T-02.4 D1 start screen → R-02.1, AC-02.1 · verify: `pnpm test src/features/start` · files: `src/features/start/StartScreen.tsx`, `src/features/start/StartScreen.test.tsx`
- [x] T-02.5 D2 device choice. "Use my phone" is pre-selected; choosing this computer continues. The QR screen is T-02.9 → R-02.2, AC-02.2 · verify: `pnpm test src/features/start` · files: `src/features/start/DeviceSelection.tsx`, `src/features/start/DeviceSelection.test.tsx`
- [x] T-02.6 Help dialog → R-02.9, R-02.12, AC-02.9 · verify: `pnpm test src/features/help` · files: `src/features/help/HelpDialog.tsx`, `src/features/help/HelpDialog.test.tsx`
- [x] T-02.7 Save & exit confirmation and the saved page → R-02.10, AC-02.10, AC-02.11 · verify: `pnpm test src/features/save-exit` · files: `src/features/save-exit/SaveExit.tsx`, `src/features/save-exit/SaveExit.test.tsx`
- [x] T-02.8 `/privacy` → R-02.11, AC-02.12 · verify: `pnpm test src/app/privacy` · files: `src/app/privacy/page.tsx`, `src/app/privacy/page.test.tsx`
- [x] T-02.9 Request host from `x-forwarded-host` then `host`, and the same for the protocol. `POST /api/session` uses it for the origin check → R-02.4, R-02.13 · verify: `pnpm test src/lib/http` · files: `src/lib/http/requestHost.ts`, `src/lib/http/requestHost.test.ts`, `src/app/api/session/route.ts` · gate: tests reviewed
- [x] T-02.13 `POST /api/handoff/{token}` redeems with `GETDEL`, sets the phone cookie, and redirects to `/m`. A used or expired token is 410. The session id stays out of the URL → R-02.5, AC-02.5 · verify: `pnpm test src/app/api/handoff` · files: `src/app/api/handoff/[token]/route.ts`, `src/app/api/handoff/[token]/route.test.ts` · gate: tests reviewed
- [x] T-02.14 `POST /api/session/handoff` issues a new token and revokes the old one. The session and step stay as they are → R-02.8, AC-02.6 · verify: `pnpm test src/app/api/session/handoff` · files: `src/app/api/session/handoff/route.ts`, `src/app/api/session/handoff/route.test.ts` · gate: tests reviewed
- [x] T-02.15 `POST /api/session/heartbeat` returns 204 and stores `lastSeen`. Status treats a `lastSeen` within 30 seconds as connected → R-02.7 · verify: `pnpm test src/app/api/session/heartbeat` · files: `src/app/api/session/heartbeat/route.ts`, `src/app/api/session/heartbeat/route.test.ts`, `src/app/api/session/status/route.ts` · gate: tests reviewed
- [x] T-02.16 D3 shows the QR for `https://<host>/m/{token}`. The URL has the token and no session id, and the host is the one the desktop is using → R-02.4, AC-02.3 · verify: `pnpm test src/features/handoff` · files: `src/features/handoff/QrHandoff.tsx`, `src/features/handoff/QrHandoff.test.tsx`
- [x] T-02.17 D3b shows when the token expires. "Get a new code" shows a fresh QR and does not change the session or step → AC-02.6 · verify: `pnpm test src/features/handoff` · files: `src/features/handoff/QrExpired.tsx`, `src/features/handoff/QrExpired.test.tsx`
- [x] T-02.18 Opening `/m/{token}` redeems it and lands on `/m`. Opening it again shows "This link has already been used". The phone journey starts without the device choice → AC-02.4, AC-02.5, R-02.2 · verify: `pnpm test src/app/m` · files: `src/app/m/[handoffToken]/page.tsx`, `src/app/m/[handoffToken]/page.test.tsx`, `src/app/m/page.tsx`
- [x] T-02.19 The desktop polls status every 2.5 seconds, pauses while the tab is hidden, and mirrors the server step. "Phone connected" is announced with `aria-live` → R-02.6, AC-02.4 · verify: `pnpm test src/features/handoff` · files: `src/features/handoff/useStatusPoll.ts`, `src/features/handoff/useStatusPoll.test.ts`
- [ ] T-02.10 `production` Docker `prodlike` handoff (PB-3) → AC-02.8
- [ ] T-02.11 `production` Resume a saved session in the same browser (PB-5) → AC-02.15
- [ ] T-02.12 `production` Phone Help opens as a bottom sheet (PB-6) → R-02.14
- [x] T-02.20 "Can't scan? Continue on this computer instead" on D3, and "Continue on this computer instead" on D3b, leaves the QR for document capture → AC-02.16 · verify: `pnpm test src/machines` · files: `src/features/start/Journey.tsx`
- [ ] T-02.21 (P6) `/m` sends a heartbeat on load, so the desktop shows "Phone connected" before the phone user taps Start (E2E F-4) → R-02.7, AC-02.4 · verify: `pnpm test src/app/m src/features/handoff` · files: `src/app/m/page.tsx`, `src/features/start/Journey.tsx` · gate: tests reviewed
- [ ] T-02.22 (P6) D3's connection status sits in an `aria-live="polite"` region that is already in the DOM while waiting, so the change to "Phone connected" is announced (E2E F-7) → AC-02.4 · verify: `pnpm test src/features/handoff` · files: `src/features/handoff/QrHandoff.tsx`, `src/features/handoff/QrHandoff.test.tsx`
- [ ] T-02.23 (P6) Save & exit copy promises only the idle window, not resume (E2E F-5) → R-02.10, AC-02.10 · verify: `pnpm test src/features/save-exit` · files: `content/en-ZA.json`, `src/features/save-exit/SaveExit.test.tsx`
- [ ] T-02.24 (P6) "Show the QR code again" on E8 calls `POST /api/session/handoff` and shows the new code and timer, without changing the session step (E2E R-3) → R-02.8, AC-02.7 · verify: `pnpm test src/features/handoff/QrExpired.test.tsx` · files: `src/features/handoff/QrExpired.tsx`, `src/features/handoff/QrExpired.test.tsx`
