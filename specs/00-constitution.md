# 00 · Constitution

Project-wide rules. Every spec, plan and change must follow these. If a spec needs to break one, the spec says so and why.

## 1. Purpose

Build a front-end KYC journey that is clear for players, robust across devices and failures, accessible, and auditable. Verification services are mocked.

The business requirements (BR-1 – BR-9) live in `00-product-brief.md`. Every spec states which BRs it serves; a feature that serves none needs a reason to exist.

## 2. Stack

| Concern | Decision |
|---|---|
| Framework | Next.js (App Router), React, TypeScript in `strict` mode. No `any` |
| Journey state | XState v5, a single machine. The only place journey transitions are defined |
| Server state | Hand-written hooks. `useStatusPoll` polls every 2.5 s and pauses while the tab is hidden. Uploads are `fetch` calls, with retry in the capture journeys |
| Global client store | None. Journey data lives in the machine's context |
| Styling | Tailwind CSS |
| Copy | Bundled JSON (`content/{locale}.json`) read through a `ContentSource` interface (JSON source only). The content API route and a CMS are in the production backlog; see spec 09 |
| Session store | `SessionStore` interface. Memory adapter locally, Upstash Redis in production |
| Tests | Vitest + Testing Library; a hand-written test per machine transition and guard. Model-based paths (`createTestModel`) are in the production backlog |
| Versions | Pinned in `pnpm-lock.yaml`; listed with official docs links in [`docs/TECH-STACK.md`](../docs/TECH-STACK.md) |

Every dependency, including the agent's skills and checklists, is recorded in [`docs/TECH-STACK.md`](../docs/TECH-STACK.md) with its source, version, licence and reason. A new package is added there before it's installed.

## 3. UX rules

- Every async step has three visible states: loading, success, failure. No blank waits.
- Every failure tells the user what happened and gives a next action. No dead ends.
- Copy is plain and specific: the time estimate, what's needed, why something failed.
- Layouts are designed at 390 px and 1440 px and must not break at 768 px.
- **Visual values come from design tokens only** (spec 10): no raw colours, font sizes or radii in components. The brand is configuration, like the copy.
- Shown to the user as 4 steps on every path: document → selfie → liveness & face match → review. Device choice and QR handoff are setup and carry no step counter (spec 01, R-01.7).
- **No hard-coded user-facing strings**, including `aria-label`s and live-region messages. All copy comes through `useContent()` / `t()` (spec 09).

## 4. Accessibility rules (WCAG 2.2 AA fundamentals)

- The whole journey works by keyboard alone.
- On every step change, focus moves to that step's `h1`. On a blocking error, focus moves to the error.
- Status changes use `aria-live="polite"`. Blocking errors use `role="alert"`.
- Every input has a visible label. Errors are linked with `aria-describedby`.
- Never use colour alone for status; always icon + text.
- No tight time limits. Liveness prompts are generous; session timeouts can be extended (2.2.1).

## 5. Security & privacy rules

- **The server is the single source of truth** for session state across devices.
- The QR code contains a short-lived, single-use handoff token, **never** the session ID.
- Session identity travels in httpOnly, `SameSite=Lax` cookies, `Secure` when served over HTTPS.
- Every API call that changes data (`POST`) is rejected with 403 unless its `Origin` header matches the request host. We don't rely on the framework for this check.
- **Full-size images are never stored.** Images are resized on the device; only a ~320 px thumbnail is kept, and it expires with the session.
- Nothing personal in logs: session IDs and step names only.
- While `DEMO_MODE` is on (the default everywhere), every page shows the "don't use a real ID" banner (`common.demoBanner`) and the site is `noindex`. No page or component can hide the banner.
- Don't reveal which fraud check failed on a final rejection.

## 6. Testing rules

- Every machine transition and guard has a test.
- Every resilience scenario can be forced (`?fail=` switches or real conditions) and is listed in the README.
- Acceptance criteria are written so they can become tests directly.

## 7. Environments rule

The app must behave the same locally and on Vercel. Anything that would work only because of shared memory is a bug: all session state goes through `SessionStore`, never module-level variables. It's proven by running the full handoff on a Vercel preview with a real phone. The Docker `prodlike` proof (2 instances behind a round-robin proxy) is in the production backlog.

## 8. Working agreement (AI usage)

- Specs and acceptance criteria are written and reviewed by me before implementation.
- AI tools implement against a spec's tasks; I review every change against its acceptance criteria.
- **Logic tasks are test-first** (the machine, content and `t()`, the session store and API handlers): the agent writes failing tests from the ACs, shows they fail for the right reason, and **stops for my review**. Gaps I find go into the spec first. Then the code is written against the approved tests, with separate `test(NN)` and `feat(NN)` commits. UI tasks write tests and code together.
- Commit order follows `PLAN.md`; commit messages reference the spec (e.g. `feat(02): redeem handoff token`).
- When behaviour needs to change, the spec is updated first, then the code.

## 9. Agent boundaries

Applies to any AI agent working in this repo (see `.cursor/rules/`).

**Always**
- Read this constitution, `specs/PLAN.md` and the spec for the task before writing code. Load only the spec you're working on, not all of them.
- Get every user-facing string through `t()` / `useContent()`.
- Add journey behaviour as machine states, events or guards, never as ad-hoc component state.
- Name the AC in each test (`it('AC-03.4 …')`) and the spec in each commit (`feat(03): …`).
- Run `pnpm typecheck && pnpm lint && pnpm test` before every commit.
- Finish each task by listing the ACs it satisfies, any still unmet, and any skipped because they're tagged `production`.

**Ask first**
- Adding a dependency (record it in `docs/TECH-STACK.md` with a one-line reason first).
- Adding, removing or updating an agent skill or checklist (follow the update steps in `docs/TECH-STACK.md`).
- Changing the machine's states or events (R-01.1 – R-01.3), an API contract, a Redis key or the content schema.
- Changing any requirement or acceptance criterion in a spec.
- Changing environment variables, Docker or deployment configuration.
- Skipping, weakening or deleting a test, or changing a test after I've approved it.

**Never**
- Read or write git-ignored or git-excluded paths, or commit secrets or `.env*` files (other than `.env.example`).
- Hard-code user-facing copy.
- Store full-size images, or write personal data to logs.
- Put the session ID in the QR code.
- Use `any`, `@ts-ignore` or turn off strict mode to get past an error.
- Change a test so that it passes instead of fixing the code.
- Bypass git hooks (`--no-verify`) or push past a red CI run.
- Edit files under `.cursor/skills/` or `.cursor/references/`. They're pinned third-party dependencies; project behaviour is set by overrides in `.cursor/rules/spec-driven.mdc`.
- Implement a requirement, AC or task tagged `production` or `post-ship`. `production` items are designed and not built for the demo (see the production backlog in `specs/PLAN.md`). `post-ship` items are spec 11 and wait until P6 is started.

## 10. Repo conventions

### Commands

Scripts are created in spec 07; until then they're the contract.

| Command | Does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm bootstrap` | Check Node/pnpm, create `.env.local` from `.env.example`, print run modes |
| `pnpm dev` | Single-device journey on `http://localhost:3000` with the memory store |
| `pnpm dev:phone` | Dev server plus a `cloudflared` tunnel (HTTPS, no account, no Docker), for testing the QR handoff on a real phone |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint, including the hard-coded-string check (AC-09.1) |
| `pnpm test` | `vitest run`; pass a path to narrow it, e.g. `pnpm test src/machines` |
| `pnpm build` | Production build |

### Project structure

```
src/
  app/            # routes: (desktop)/verify D1–D7, m/[handoffToken] (QR entry), m/ (phone journey), api/ (mock handlers)
  machines/       # kycMachine.ts, progress.ts, useKycMachine.ts + tests
  features/       # capture/, handoff/, review/
  components/ui/  # Button, OptionCard, Progress, Alert…
  lib/            # api/, store/ (SessionStore + adapters), image/, analytics/, content/
content/          # en-ZA.json: all user-facing copy
specs/            # this folder
docs/             # ARCHITECTURE.md, wireframes.pdf
```

Tests sit next to the file they test (`kycMachine.test.ts`).

### Code style

Prettier defaults; ESLint `next/core-web-vitals` + `@typescript-eslint/strict`. Components are `PascalCase.tsx`, hooks and utilities `camelCase.ts`, hooks start with `use`. Named exports everywhere except Next.js route files. Props are a local `type Props`. One example:

```tsx
// src/features/capture/RetryNotice.tsx
import { useContent } from '@/lib/content';

type Props = { attempt: number; max: number; onRetry: () => void };

export function RetryNotice({ attempt, max, onRetry }: Props) {
  const { t } = useContent();
  return (
    <div role="alert">
      <p>{t('common.attempt', { attempt, max })}</p>
      <button type="button" onClick={onRetry}>
        {t('common.actions.tryAgain')}
      </button>
    </div>
  );
}
```

### Checks

The same checks run locally and in CI (spec 07, R-07.9 – R-07.10). Hooks keep commits clean; CI is the gate.

| Where | Runs |
|---|---|
| pre-commit | ESLint `--fix` and Prettier on staged files; `pnpm typecheck`; skill checksums |
| commit-msg | commitlint (Conventional Commits) |
| pre-push | `pnpm test` |
| CI (every push and PR) | Frozen-lockfile install, `typecheck`, `lint`, `test`, `build`, skill checksums |

### Git workflow

- `main` deploys to production; every branch gets a Vercel preview.
- Branches: `feat/NN-short-name`, `fix/NN-short-name` (`NN` = spec number).
- Commits: Conventional Commits scoped by spec, e.g. `feat(02): redeem handoff token`, `test(01): AC-01.3 retry guard`, `docs(specs): …`.
- One pull request per plan checkpoint or spec slice. The description lists the spec, the ACs covered, how each was verified, and any still unmet.
- Nothing merges to `main` while CI is red.
