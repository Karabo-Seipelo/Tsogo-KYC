# Manual checks before handover

Run these by hand. Leave the result column blank until you have done the check. Automated tests do not cover a real phone, a resized window, a keyboard-only pass, or Lighthouse.

## A real phone

Site: https://tsogo.karaboseipelo.com. Scan the QR from the desktop. Use **Take photo**, not the upload fallback. The rear camera should open, and the captured document photo should not be mirrored.

| Check                                                                   | iOS Safari | Android Chrome |
| ----------------------------------------------------------------------- | ---------- | -------------- |
| QR handoff opens the journey on the phone                               |            |                |
| Document capture uses the rear camera                                   |            |                |
| The document photo is not mirrored                                      |            |                |
| Selfie, liveness, and M7 ("All done on your phone")                     |            |                |
| Desktop review shows both photos, then submit reaches "You're verified" |            |                |

## Responsive

Check D1, D2, D3, M2, M4, D5, and E9 at 390, 768, and 1440 px. No horizontal scroll. Buttons are not clipped. The demo banner stays visible. Known: on desktop, "Take photo" can sit below the fold.

| Screen              | 390 | 768 | 1440 |
| ------------------- | --- | --- | ---- |
| D1 Start            |     |     |      |
| D2 Device choice    |     |     |      |
| D3 QR               |     |     |      |
| M2 Document capture |     |     |      |
| M4 Selfie           |     |     |      |
| D5 Review           |     |     |      |
| E9 Manual review    |     |     |      |

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
| `/`               |       |                |
| `/privacy`        |       |                |
| Review and submit |       |                |
