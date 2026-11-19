# Manual E2E report · production

**Run:** 19 Nov 2026, against https://tsogo.karaboseipelo.com (deployed from `main` at `8c629a1`, before the P6 hardening branch).
**How:** desktop Chrome, a second tab standing in for the phone, the real webcam for capture. The failure switches in the README were used to force each error state. Requests and the DOM were checked through browser scripts.
**Not covered:** a real phone (iOS Safari, Android Chrome), a screen reader run, keyboard-only from start to finish.

## Summary

The happy path and every forced failure state passed except E8 (phone disconnected). E8 surfaced the most serious problem of the run: **the server accepts a submit for a session with no completed checks and marks it verified** (F-1).

## Results

| Area | Check | Spec | Result |
|---|---|---|---|
| Happy path | Desktop only: passport → photo → liveness → selfie → review → submit → "You're verified" | 01, 05 | Pass |
| Happy path | Phone handoff: QR link, phone capture, desktop mirrors each step, desktop review, submit | 02, 05 | Pass (see F-2, F-3) |
| Liveness | Live mirrored camera; "Got it" about every 4 s; about 12 s total; only `/api/session/liveness` is called, with no frame | AC-04.9, AC-04.10 | Pass |
| Handoff token | Response has only `handoffToken` and `handoffExpiresAt`; token is 32 hex characters; `/m/{token}` becomes `/m` | R-02.9 – R-02.15 | Pass |
| E2 upload failed | `?fail=upload`: three attempts, then `role="alert"`; Try again re-sends the same image | 06 | Pass (see F-12) |
| Document rejected | `?fail=document`: blurry reason and tips, "Attempt 1 of 3", focus on the heading, retake passes | 03, 06 | Pass |
| E9 manual review | `?fail=document:always` and `?fail=match:always`: E9 on the third failure, with a reference | 06, 08 | Pass |
| E3 face match failed | `?fail=match`: E3, retake passes | 04 | Pass |
| E7 rejected | `?fail=reject`: reference shown, no check detail | 05, 06 | Pass |
| E5 / E6 timeout | `?ttl=1`: `alertdialog` with focus at 0:30, then E6 "nothing submitted" with focus | 06 | Pass |
| Phone offline | Banner is `role="status"`; Take photo still works; banner clears when back online | 06 | Pass |
| Help, Save & exit | Dialogs labelled, focus kept inside, Escape returns focus | 02 | Pass (see F-5) |
| Privacy, indexing | `/privacy` renders; `X-Robots-Tag: noindex`; robots.txt `Disallow: /` | 07 | Pass |
| Latency | API responses 80–180 ms (Vercel `cpt1`, Upstash `af-south-1`) | 07 | Pass |
| **E8 phone disconnected** | Phone connected, phone tab closed, waited over 45 s | AC-02.7, T-05.4 | **Fail** (F-1, F-2) |

## Findings

### F-1 · Critical · Submit is accepted without completed checks

In the E8 run, the session status was `step: documentUpload`, `checks: []`. `POST /api/session/submit` returned `202 {"step":"processing"}` and the session ended at `complete`. The UI showed "You're verified".

Cause: `src/app/api/session/submit/route.ts` checks the origin and the cookie, then sets `processing` whatever the session holds. A guard on `step === "review"` alone is not enough, because the heartbeat (R-11.3) lets the client move the step to `review`.

Fix: accept a submit only when the session holds a document thumbnail, a selfie thumbnail and passed results for all three checks, and the step is not already `processing`, `complete` or `error`. Otherwise return 409 and leave the session unchanged. Add route tests for each missing piece.

### F-2 · High · Desktop shows check results the server doesn't have

In the same run, the desktop showed Review with Liveness ✓ and Face match ✓ and an empty Document check while the phone was still on the document-type screen. The tab had done an earlier handoff run, so the desktop seems to keep results from the previous session. This explains the empty Document check row after a normal handoff too (F-3), and it's why E8 never showed: T-05.4 shows E8 from D4, and the desktop had already left D4.

I didn't see the moment the desktop jumped to Review (the page stopped responding to my watch script), so reproduce it by hand first: fresh browser, handoff, phone opens the link, close the phone tab.

Fix: reset the machine context when a new session is created, and build Review's check rows from the server's `checks` rather than the client context.

### F-3 · High · Document check row is empty after a handoff

After a successful handoff the desktop Review shows "Document check" with no result, although `/api/session/status` lists all three checks. Spec R-05.3 says Review shows each check's result. Likely the same cause as F-2.

### F-4 · High · Phone joins only after tapping Start (AC-02.4)

After opening `/m/{token}`, the phone shows the start screen and sends no heartbeat until "Start verification" is tapped. Until then the desktop stays on "Waiting for your phone". AC-02.4 expects "Phone connected" within one poll of the link being opened.

Fix: send the first heartbeat when `/m` loads after a redeem.

### Medium

| # | Finding | Spec | Suggested fix |
|---|---|---|---|
| F-5 | The page shown after Save & exit promises you can come back and resume. Resume isn't built | PB-5 | Change the copy to say progress isn't kept in the demo, until PB-5 ships |
| F-6 | No page `<title>` on any route | WCAG 2.4.2 | Set titles through Next.js metadata, one per screen |
| F-7 | D3 has no live region, so "Phone connected" isn't announced | AC-02.4 | Put `aria-live="polite"` on the connection status |

### Low

| # | Finding | Spec | Suggested fix |
|---|---|---|---|
| F-8 | Copy reads "after 1 minutes" | 09 | Plural form in the content file |
| F-9 | Desktop document-type screen has no progress indicator | 10 (D2) | Add the progress bar |
| F-10 | D2 has no Back button, and the selected card has no tick | 10, Figma 51:155 | Match the design |
| F-11 | Each step change scrolls about 36 px and hides the demo banner | §5 | Scroll to the top on step change; use `preventScroll` when focusing the heading |
| F-12 | Upload retries come almost at once (three requests in about 1 s) | 06 | Back off between attempts, e.g. 1 s then 2 s |
| F-13 | Desktop viewfinder is portrait, pushing "Take photo" below the fold | 10 (D5) | Landscape ratio on desktop |
| F-14 | A heading focused by code shows a gold outline box | 10 | No visible ring on `tabindex="-1"` headings |
| F-15 | A failure tip on desktop says "Your phone held steady" | 09 | Separate tips for desktop and phone |

### To decide

| # | Item | Note |
|---|---|---|
| Q-1 | No offline banner on the desktop-only path | Spec 06 scopes the banner to the phone. Add it, or list it under Limitations |
| Q-2 | The QR SVG has `role="img"`; its accessible name wasn't confirmed | Check it has a label, or hide it with a text alternative beside it |

## How this relates to P6 hardening

P6 (`feat/11-hardening`) was not live during this run. It does not close F-1: the submit route only gained the shared origin check. R-11.3 makes F-1 easier to reach, since a heartbeat may set the step to `review`. Re-run E8 and the happy path once P6 is deployed.

## Fix tasks

Added to the specs as P6 tasks. The low findings are listed under Limitations in the README instead.

| Task | Finding | Spec |
|---|---|---|
| T-11.6 Submit guard: 409 unless both thumbnails and three passed results exist | F-1 | 11 · R-11.6, AC-11.6 |
| T-01.9 Clean context on a new session | F-2 | 01 · AC-01.11 |
| T-05.6 Review rows from the server's `checks` | F-2, F-3 | 05 · R-05.3, AC-05.7 |
| T-02.21 Phone heartbeat on `/m` load | F-4 | 02 · R-02.7, AC-02.4 |
| T-02.23 Save & exit copy promises only the idle window | F-5 | 02 · R-02.10, AC-02.10 |
| T-09.9 Document title per screen | F-6 | 09 · R-09.10, AC-09.8 |
| T-02.22 D3 status in a live region | F-7 | 02 · AC-02.4 |
| README Limitations | F-8 – F-15, Q-1 | — |
| Check the QR's accessible name during the re-run | Q-2 | 02 design note |
