# 04 · Selfie, liveness & face match

**Covers:** brief requirements 6 (selfie), 7 (mock liveness), 8 (face match via mocked API); API: selfie upload, face match.
**Serves:** BR-1, BR-2, BR-4.
**Screens:** M4, M5, M6, E3 (and E1 for camera denial).

## Context

After the document passes, the user takes a selfie, completes a mocked liveness check, and the mocked API compares the selfie to the document photo. No real biometrics are processed.

## Requirements

- R-04.1 Selfie uses the front camera (`facingMode: 'user'`) with a mirrored preview and an oval face guide.
- R-04.2 Liveness (mocked): a random sequence of 3 prompts (turn left / turn right / blink). The mock confirms each prompt after about 3–4 s with a short "Got it" (`liveness.confirmed`), then shows the next. No face or movement is analysed; the mock always resolves "pass" unless forced.
- R-04.3 `POST /api/session/selfie` stores a thumbnail only. `POST /api/session/liveness` returns `{ passed }`. `POST /api/session/face-match` returns `{ match, confidence }`.
- R-04.4 Face match: up to 3 attempts, then manual review (spec 01, AC-01.5).
- R-04.5 M5 shows the same mirrored live front-camera preview as M4, reusing the stream that is already open (no second permission prompt), with the oval guide over it. Liveness **shows** the camera but never captures, uploads or stores a frame: the only request it makes is the `POST /api/session/liveness` result.

## Acceptance criteria

- **AC-04.1** GIVEN M4 with camera permission THEN a mirrored live preview shows with the oval guide AND instructions ("Remove glasses and hats…").
- **AC-04.2** GIVEN the selfie is taken THEN it's resized like documents (spec 03, R-03.4) and uploaded with a loading state.
- **AC-04.3** GIVEN M5 THEN prompts show one at a time with "Prompt n of 3", AND each prompt is announced via `aria-live`.
- **AC-04.4** GIVEN a liveness prompt THEN there's no deadline the user can fail: the step still passes if they take longer, AND "Having trouble?" is always available (WCAG 2.2.1).
- **AC-04.5** GIVEN face matching is in progress THEN "Comparing photos…" shows with both thumbnails.
- **AC-04.6** GIVEN the mock returns a match THEN M6 shows "It's a match" and "Continue".
- **AC-04.7** GIVEN no match (or `?fail=match`) THEN E3 shows the reason, tips and "Attempt n of 3", with "Retake selfie" and "Use a different document".
- **AC-04.8** GIVEN front-camera permission is denied THEN E1 behaviour applies (spec 03, AC-03.7) with selfie-specific copy.
- **AC-04.9** GIVEN M5 with camera permission THEN the mirrored live preview shows behind the oval guide, without a second permission prompt; AND no frame is captured or sent anywhere (only the liveness result call is made).
- **AC-04.10** GIVEN each liveness prompt THEN "Got it" confirms it within about 4 s and is announced via `aria-live`; the whole check takes about 10–15 s.

## API

| Method | Endpoint | Response |
|---|---|---|
| `POST` | `/api/session/selfie` | `{ ok: true }` |
| `POST` | `/api/session/liveness` | `{ passed }` |
| `POST` | `/api/session/face-match` | `{ match, confidence }` |

## Design notes

- Reuses `useCamera` and `resizeImage` from spec 03.
- The liveness mock is client-driven (prompt timing) with a server call to record the result, so the desktop status can show it.
- Confidence is shown only in dev tools / logs, never to the user.

## Tasks

- [x] T-04.1 Passing selfie, liveness, and face-match handlers. Confidence stays out of any copy shown to the user → R-04.3 · verify: `pnpm test src/app/api/session` · files: `src/app/api/session/selfie/route.ts`, `src/app/api/session/liveness/route.ts`, `src/app/api/session/face-match/route.ts` · gate: tests reviewed
- [x] T-04.2 M4 selfie, M5 liveness, and passing M6 → R-04.1, R-04.2, AC-04.1 – AC-04.6 · verify: `pnpm test src/features/capture` · files: `src/features/capture/SelfieCapture.tsx`, `src/features/capture/LivenessCheck.tsx`, `src/features/capture/FaceMatch.tsx`
- [x] T-04.3 Send `SELFIE_CAPTURED`, `LIVENESS_PASSED`, `MATCHED`, and `NO_MATCH` → spec 01 · verify: `pnpm test src/features/capture` · files: `src/features/capture/SelfieCapture.tsx`, `src/features/capture/LivenessCheck.tsx`, `src/features/capture/FaceMatch.tsx`
- [x] T-04.4 (P4) E3 no match and the failure switches → AC-04.7, AC-04.8 · verify: `pnpm test src/features/capture` · files: `src/features/capture/FaceMatch.tsx`
- [x] T-04.5 (P5) Live front-camera preview on M5, reusing the open stream; no frames captured → R-04.5, AC-04.9 · verify: `pnpm test src/features/capture` (asserts the only request is the liveness result) · files: `src/features/capture/LivenessCheck.tsx`, `src/features/capture/SelfieJourney.tsx`, `src/features/capture/useCamera.ts`
- [x] T-04.6 (P5) Shorter confirmation timing with "Got it" copy (`liveness.confirmed`) → R-04.2, AC-04.4, AC-04.10 · verify: `pnpm test src/features/capture` with fake timers · files: `src/features/capture/LivenessCheck.tsx`, `content/en-ZA.json`, the content schema
