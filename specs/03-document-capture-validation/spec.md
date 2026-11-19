# 03 · Document capture & validation

**Covers:** brief requirements 4 (document capture) and 5 (validation with success/failure); API: document upload; resilience: camera denial, upload failure.
**Serves:** BR-1, BR-2, BR-4, BR-7, BR-8 (clear failure reasons fix problems before another paid check; no full images stored).
**Screens:** M1, M2, M3a, M3b, E1, E2.

## Context

The user picks a document type, captures it with the device camera (or uploads a photo), and gets a clear pass or fail. OCR is mocked; the mock returns per-check results so the UI can explain what was checked.

## Requirements

- R-03.1 Document types: passport (1 side), national ID / Smart ID card (front + back), driver's licence (front + back).
- R-03.2 Capture uses `getUserMedia({ video: { facingMode: 'environment' } })` with a document outline guide.
- R-03.3 An upload fallback ("Upload a photo instead") is always visible.
- R-03.4 Before upload, images are resized on the device to ~1600 px JPEG, plus a ~320 px thumbnail (stays under Vercel's ~4.5 MB request limit).
- R-03.5 `POST /api/session/document` returns `{ passed, checks: [{ id, label, passed, hint? }] }`. Only the thumbnail and the results are stored.
- R-03.6 Up to 3 attempts, then manual review (spec 01, AC-01.4).
- R-03.7 A 400 from `POST /api/session/document` means the image itself was refused (spec 11, R-11.2), so sending it again can't help. The user is asked to retake the photo, with the upload fallback, instead of seeing E2. E2 and its "Try again" stay for network failures and 5xx responses.

## Acceptance criteria

- **AC-03.1** GIVEN M1 WHEN a type is chosen THEN the number of sides to capture is set (1 or 2) AND the choice is a keyboard-usable radio group.
- **AC-03.2** GIVEN M2 with camera permission WHEN the camera starts THEN a live preview shows inside the outline AND "Take photo" is a real `<button>` with an accessible name.
- **AC-03.3** GIVEN an ID or licence WHEN the front is captured THEN the user is asked for the back with a clear "Side 2 of 2" label.
- **AC-03.4** GIVEN an upload is in progress THEN a "Checking your document…" state shows (no blank wait).
- **AC-03.5** GIVEN the mock passes THEN M3a lists each check with ✓ and offers "Continue" and "Retake photo".
- **AC-03.6** GIVEN the mock fails (or `?fail=document`) THEN M3b shows the specific reason and how to fix it; focus moves to the error heading; the attempt count shows.
- **AC-03.7** GIVEN camera permission is denied (`NotAllowedError`) THEN E1 shows browser-specific steps to re-enable the camera AND the upload fallback; `NotFoundError` shows "No camera found" with the upload fallback.
- **AC-03.8** GIVEN an upload fails (or `?fail=upload`) THEN it retries twice with backoff automatically; then E2 shows "Your photo is saved", with "Try again" re-sending the **same** image (no retake).
- **AC-03.9** GIVEN any upload THEN the request body is under 4.5 MB AND the server stores no full-size image.
- **AC-03.10** GIVEN "Take photo" WHEN the request is sent THEN `image` and `thumbnail` are JPEGs drawn from the live video frame and resized as in R-03.4 (the thumbnail starts `FF D8 FF` and is at most 150 KB), on desktop and phone; AND the server returns 200.
- **AC-03.11** GIVEN the document route returns 400 THEN the user sees a retake prompt with the upload fallback, not E2, AND no automatic retry is made.

## API

| Method | Endpoint | Request | Response |
|---|---|---|---|
| `POST` | `/api/session/document` | `multipart/form-data`: `side`, `image` (resized), `thumbnail` | `{ passed, checks[] }` |

## Design notes

- `useCamera()` hook: start/stop, error mapping (`NotAllowedError`, `NotFoundError`, `NotReadableError`), cleanup on unmount (stop tracks).
- `resizeImage(file|blob, maxEdge, quality)` in `src/lib/image/` using a canvas. Unit-tested with a fixture.
- React Query `useMutation({ retry: 2, retryDelay: backoff })`; the blob is held in component state so a manual retry re-sends it.
- Mock: random latency 300–1500 ms; `MOCK_FAILURE_RATE` and `?fail=` switches (rules in spec 06, R-06.6).

## Tasks

- [x] T-03.1 `useCamera`: start, stop, and map `NotAllowedError`, `NotFoundError`, `NotReadableError` → R-03.2 · verify: `pnpm test src/features/capture` · files: `src/features/capture/useCamera.ts`, `src/features/capture/useCamera.test.ts` · gate: tests reviewed
- [x] T-03.2 `resizeImage` to ~1600 px JPEG and a ~320 px thumbnail → R-03.4, AC-03.9 · verify: `pnpm test src/lib/image` · files: `src/lib/image/resizeImage.ts`, `src/lib/image/resizeImage.test.ts` · gate: tests reviewed
- [x] T-03.3 `POST /api/session/document` passing mock; store the thumbnail and checks only → R-03.5, AC-03.9 · verify: `pnpm test src/app/api/session/document` · files: `src/app/api/session/document/route.ts`, `src/app/api/session/document/route.test.ts` · gate: tests reviewed
- [x] T-03.4 M1 document type, M2 capture with front and back, upload fallback, and passing M3a → R-03.1 – R-03.3, AC-03.1 – AC-03.5 · verify: `pnpm test src/features/capture` · files: `src/features/capture/DocumentType.tsx`, `src/features/capture/DocumentCapture.tsx`, `src/features/capture/DocumentPassed.tsx`
- [x] T-03.5 Send `DOC_CAPTURED`, `DOC_VALID`, `DOC_INVALID`, and `UPLOAD_FAILED` → R-03.6 · verify: `pnpm test src/features/capture` · files: `src/features/capture/DocumentCapture.tsx`
- [x] T-03.6 (P4) M3b, E1, E2, and the `?fail=` switches → AC-03.6 – AC-03.8 · verify: `pnpm test src/features/capture` · files: `src/features/capture/DocumentFailed.tsx`
- [x] T-03.7 (P6) The document-type screen shows "Step 1 of 4" (E2E F-9). Device selection and the QR screen stay without a counter → AC-01.9 · verify: `pnpm test src/features/capture` · files: `src/features/capture/DocumentType.tsx`, `src/features/capture/DocumentType.test.tsx`
- [x] T-03.8 (P6) **Tests first:** "Take photo" draws the current video frame to a canvas and sends it through `resizeImage`, like an upload, instead of a placeholder blob (E2E R-1) → R-03.4, AC-03.10 · verify: `pnpm test src/features/capture` · files: `src/features/capture/DocumentJourney.tsx`, `src/features/capture/DocumentCapture.tsx`, `src/features/capture/DocumentJourney.test.tsx` · gate: tests reviewed
- [x] T-03.9 (P6) **Tests first:** a 400 from the document route asks for a retake with the upload fallback, with no automatic retry and no E2 → R-03.7, AC-03.11 · verify: `pnpm test src/features/capture/DocumentJourney.test.tsx` · files: `src/features/capture/DocumentJourney.tsx`, `src/features/capture/DocumentFailed.tsx`, `src/features/capture/DocumentJourney.test.tsx` · gate: tests reviewed
