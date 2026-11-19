# Digital KYC Journey

A front-end implementation of a digital Know Your Customer (KYC) onboarding journey: start → device choice → QR handoff to mobile → document capture and validation → selfie → liveness → face match → review and submit → status tracking.

OCR, facial recognition and liveness detection are **mocked**. The focus is workflow design, state management, UX, accessibility and resilience.

**Live demo:** the live site can be found at [tsogo.karaboseipelo.com](https://tsogo.karaboseipelo.com/).

> ⚠️ **This is a demo.** Please don't upload a real ID document.

> **Status:** ready for review. What is designed but not built is listed under Limitations.

## What I prioritised and why

The specs came first: the business requirements, then one spec per feature, and the code was checked against those acceptance criteria.

One machine owns the journey. The server is the source of truth for the handoff, so the desktop and the phone read the same session.

Resilience and manual review were built before extra features. A failed check has a next step, and a case the mock cannot decide goes to manual review instead of a dead end.

Visual design came last, once the journey worked. What was held back is the production backlog: a real verification provider, resume, an offline queue, insights, and go-live hardening.

## Where to start

| Read | What it covers |
|---|---|
| [`specs/`](specs/) | Product brief (business requirements), constitution, and one spec per feature, with a traceability table from business goal to test |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Structure, state management, QR/device handoff, security |
| [`docs/wireframes.pdf`](docs/wireframes.pdf) | Low-fi wireframes for every screen and error state, plus the state-machine flow map |
| [`specs/PLAN.md`](specs/PLAN.md) | Build order, checkpoints, risks and the production backlog |
| [`docs/TECH-STACK.md`](docs/TECH-STACK.md) | Stack, package dependencies and agent dependencies (skills), with sources, versions and licences |
| [`.cursor/rules/`](.cursor/rules/) | How the AI agent is held to the specs: boundaries, workflow, self-check |

## Setup

Node.js 20.9 or newer and pnpm 9 or newer. This repo pins pnpm 12.18.0.

```bash
pnpm install
pnpm bootstrap   # checks Node and pnpm, and creates .env.local from .env.example
pnpm dev         # http://localhost:3000, memory store
```

`pnpm dev:phone` adds an HTTPS tunnel so a real phone can scan the QR code. Local `STORE_DRIVER` stays `memory` (see `.env.example`). Preview and production each use their own Upstash database.

### Environments

The app behaves the same in every environment; only the session store changes.

| Environment | Store | Purpose |
|---|---|---|
| `pnpm dev` | memory | Zero-setup single-device run |
| `pnpm dev:phone` | memory or Upstash dev DB | Real phone over an HTTPS tunnel (`cloudflared`), for the QR handoff and camera |
| Vercel preview | Upstash (preview DB) | Per-branch real deploy |
| Production | Upstash (production DB) | `https://tsogo.karaboseipelo.com` |

## Testing failure states

Every error state can be reached on the live demo. Add a switch to the URL when you **start** the journey; it's saved on the session, so it still applies after you move to your phone.

| Force it | You'll see |
|---|---|
| `?fail=upload` | E2 after two automatic retries; "Try again" then succeeds |
| `?fail=document` | M3b (document check failed); the retake passes |
| `?fail=document:always` | M3b twice, then E9 manual review on the third failure |
| `?fail=match` | E3 (face match failed); the retake matches |
| `?fail=match:always` | E3 twice, then E9 manual review on the third failure |
| `?fail=reject` | E7 after processing |
| `?ttl=1` | A 1-minute session: E5 warning at 30 s left, then E6 expired |
| Block camera access in the browser | E1, with the upload fallback |
| Go offline (DevTools or flight mode) on the phone | E4 banner; uploads resume when you're back online |
| Close the phone tab and wait 30 s | E8 on the desktop |

Screen codes (E1–E9, M3b) match [`docs/wireframes.pdf`](docs/wireframes.pdf).

## Assumptions

These are the assumptions the demo was built on. The open questions are in [`specs/00-product-brief.md`](specs/00-product-brief.md).

- KYC sits before the first deposit.
- The accepted documents are a passport, a Smart ID card, and a driver's licence. Proof of address and the green ID book are out of scope.
- Cases the mock cannot decide go to manual review. The player is told this usually takes up to 24 hours. Who works that queue, and the real turnaround, are still open.
- Nothing is kept beyond the session. How long FICA requires a verification record to be kept is still open.
- Copy is one locale, `en-ZA`, in a bundled JSON file. A CMS and a second language are designed and not built (PB-1, PB-2).

## Trade-offs

- One XState machine holds the journey. There is no second client store. Refreshing the page starts again. Resume after Save & exit is PB-5.
- Status polling and uploads are small hand-written hooks: one endpoint, one interval, fewer dependencies. Components call them and `send()` the result, so the machine stays separate.
- `pnpm dev` keeps the session in memory. Preview and production each use their own Upstash database. The audit trail stays on the session in memory and is not written to Redis.
- Liveness shows the live camera and the prompts, then confirms each prompt on a timer. No face or movement is analysed.
- The phone path is the recommended one. "Can't scan? Continue on this computer instead" continues document capture on this computer.
- Photos are resized on the device. The server stores a thumbnail only. A session lasts 15 minutes, or 1 minute with `?ttl=1`.
- `DEMO_MODE` turns on both the demo banner and `noindex`. The site is not for crawlers.

## Limitations

The specs describe the full design; the demo builds the core journey. Items tagged `production` in the specs are designed but not built, each with a reason and a trigger in the [production backlog](specs/PLAN.md#production-backlog). The main ones:

- A real verification provider (SmileID, OCR, liveness, face match are mocked by design).
- Liveness is simulated: the live camera is shown and the prompts are real, but each prompt is confirmed on a short timer; no face or movement is analysed (brief requirement 7). A real provider would replace the decision (PB-11).
- Hardening for go-live: signed tokens, rate limiting, device binding, encryption at rest, durable audit storage, error tracking and alerts.
- A CMS behind the content layer (the interface is in place; copy is a bundled JSON file).
- Resume after Save & exit, an offline upload queue, and funnel reporting (`/insights`).
- A Docker setup that proves two-instance behaviour locally; for the demo this is checked on a Vercel preview.

Known issues from the [manual E2E run](docs/E2E-REPORT.md), not fixed for the demo:

- With the `?ttl=1` test switch, the expiry message reads "after 1 minutes".
- Device selection (D2) has no Back button and no tick on the selected card. Both are deliberate: there is no Back event from that screen, and a selected card is shown with the border and the filled radio.
- Each step change scrolls the page slightly, which can hide the demo banner until you scroll up.
- On desktop the viewfinder is portrait, so "Take photo" can sit below the fold.
- A heading that receives focus on a step change shows a visible outline.
- One failure tip on desktop mentions holding your phone steady.
- The offline banner shows on the phone only, as specified; the desktop-only path has none.
- The Content Security Policy allows inline scripts and styles, which Next.js needs without nonces (PB-16).

## Time spent

| Work | Hours |
|---|---|
| Specs, wireframes and planning | |
| Build P0–P4 | |
| Visual design (P4.5) | |
| Ship and E2E testing (P5) | |
| Hardening (P6) | |
| Total | |

AI agents wrote most of the code from the specs, and I reviewed every test and diff.
