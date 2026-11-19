# Digital KYC Journey

A front-end implementation of a digital Know Your Customer (KYC) onboarding journey: start → device choice → QR handoff to mobile → document capture and validation → selfie → liveness → face match → review and submit → status tracking.

OCR, facial recognition and liveness detection are **mocked**. The focus is workflow design, state management, UX, accessibility and resilience.

**Live demo:** https://tsogo.karaboseipelo.com _(TBC)_

> ⚠️ **This is a demo.** Please don't upload a real ID document.

> **Status:** work in progress. Sections marked _TBC_ are filled in as the build lands.

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

_TBC: confirmed once the code exists._

```bash
# Requirements: Node 20+, pnpm 9+
pnpm install
pnpm dev            # http://localhost:3000
```

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

_TBC._

## Trade-offs

_TBC._

## Limitations

The specs describe the full design; the demo builds the core journey. Items tagged `production` in the specs are designed but not built, each with a reason and a trigger in the [production backlog](specs/PLAN.md#production-backlog). The main ones:

- A real verification provider (OCR, liveness, face match are mocked by design).
- Liveness is simulated: the live camera is shown and the prompts are real, but each prompt is confirmed on a short timer; no face or movement is analysed (brief requirement 7). A real provider would replace the decision (PB-11).
- Hardening for go-live: signed tokens, rate limiting, device binding, encryption at rest, durable audit storage, error tracking and alerts.
- A CMS behind the content layer (the interface is in place; copy is a bundled JSON file).
- Resume after Save & exit, an offline upload queue, and funnel reporting (`/insights`).
- A Docker setup that proves two-instance behaviour locally; for the demo this is checked on a Vercel preview.

_Anything else found during the build is added here._
