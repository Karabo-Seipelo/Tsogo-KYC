# Manual checks before handover

Run these by hand. Leave the result column blank until you have done the check. Automated tests do not cover a real phone, a resized window, a keyboard-only pass, or Lighthouse.

## A real phone

Site: https://tsogo.karaboseipelo.com. Scan the QR from the desktop. Use **Take photo**, not the upload fallback. The rear camera should open, and the captured document photo should not be mirrored.

| Check                                                                   | iOS Safari | Android Chrome |
| ----------------------------------------------------------------------- | ---------- | -------------- |
| QR handoff opens the journey on the phone                               | Pass       | Pass           |
| Document capture uses the rear camera                                   | Pass       | Pass           |
| The document photo is not mirrored                                      | Pass       | Pass           |
| Selfie, liveness, and M7 ("All done on your phone")                     | Pass       | Pass           |
| Desktop review shows both photos, then submit reaches "You're verified" | Pass       | Pass           |

## Responsive

Check D1, D2, D3, M2, M4, D5, and E9 at 390, 768, and 1440 px. No horizontal scroll. Buttons are not clipped. The demo banner stays visible. Known: on desktop, "Take photo" can sit below the fold.

| Screen              | 390  | 768  | 1440 |
| ------------------- | ---- | ---- | ---- |
| D1 Start            | Pass | Pass | Pass |
| D2 Device choice    | Pass | Pass | Pass |
| D3 QR               | Pass | Pass | Pass |
| M2 Document capture | Pass | Pass | Pass |
| M4 Selfie           | Pass | Pass | Pass |
| D5 Review           | Pass | Pass | Pass |
| E9 Manual review    | Pass | Pass | Pass |

## Keyboard only

Desktop-only path, from D1 to "You're verified". Do not use the pointer.

| Check                                                                                                            | Result |
| ---------------------------------------------------------------------------------------------------------------- | ------ |
| Tab order is logical                                                                                             |        |
| Every control can be reached, and it is visible when focused                                                     |        |
| Help traps focus and returns it to the opener on close                                                           |        |
| Save & exit traps focus and returns it to the opener on close                                                    |        |
| Focus lands on the h1 at every step change, including the document-type screen after Continue from device choice |        |

## Lighthouse accessibility

Chrome DevTools, accessibility category. Record the score and any failing audit.

| Page              | Score | Failing audits |
| ----------------- | ----- | -------------- |
| `/`               | 100   | None           |
| `/privacy`        | 100   | None           |
| Review and submit | 100   | None           |
