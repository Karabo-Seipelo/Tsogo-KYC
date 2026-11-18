# Tech stack and dependencies

Everything this project depends on, in one place: the runtime stack, the packages, and the **agent dependencies** (the Cursor rule, skills and checklists that shape how AI builds the code). Each entry records where it comes from, which version is pinned, its licence and why it's here, so changes are visible and reviewed rather than picked up silently.

The *decisions* behind the stack (one state machine, no global store, the `SessionStore` interface, and so on) live in [`specs/00-constitution.md`](../specs/00-constitution.md) §2. This file is the inventory.

## 1. Runtime stack

Versions are taken from `pnpm-lock.yaml` at scaffold time (PLAN, P0) and updated here whenever the lockfile changes.

| Technology | Role | Version | Official docs |
|---|---|---|---|
| Next.js (App Router) | App framework, route handlers for the mock API | 16.4.6 | https://nextjs.org/docs |
| React | UI | 19.3.0 | https://react.dev |
| TypeScript (`strict`) | Language | 5.9.3 | https://www.typescriptlang.org/docs/ |
| XState + `@xstate/react` | Journey state machine | 5.x | https://stately.ai/docs |
| TanStack Query | Server state, polling, mutations | 5.x | https://tanstack.com/query/latest |
| Tailwind CSS | Styling | tailwindcss 4.3.3 | https://tailwindcss.com/docs |
| Vitest + Testing Library | Unit and component tests | vitest 5.1.0, @testing-library/react 16.3.3 | https://vitest.dev · https://testing-library.com/docs/react-testing-library/intro/ |
| Upstash Redis (`@upstash/redis`) | Session store on Vercel | Pinned at P0 | https://upstash.com/docs/redis |
| Vercel | Hosting, previews, production | — | https://vercel.com/docs |
| Node.js / pnpm | Runtime / package manager | Node 20+, pnpm 9+ | https://nodejs.org/docs · https://pnpm.io |
| `cloudflared` (quick tunnel) | HTTPS tunnel for real-phone testing (`pnpm dev:phone`); dev tool, not shipped | Latest | https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/ |

These are the docs `source-driven-development` checks decisions against. Prefer the version-specific page over a general search result.

## 2. Package dependencies

One line per package, with the spec that needs it. A new package is added here with its reason **before** it's installed, and only after approval (constitution §9, *Ask first*).

| Package | Why | Needed by | Type |
|---|---|---|---|
| `next`, `react`, `react-dom` | Framework | All | runtime |
| `xstate`, `@xstate/react` | Journey machine | 01 | runtime |
| `@tanstack/react-query` | Server state and polling | 02–05 | runtime |
| `@upstash/redis` | Redis-backed `SessionStore` | 02, 07 | runtime |
| `qrcode.react` | QR code on D3 | 02 | runtime |
| `zod` | Content schema and API boundary validation | 09, 02–05 | runtime |
| `tailwindcss` | Styling | All | dev |
| `typescript`, `@types/*` | Types | All | dev |
| `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` | Tests | All | dev |
| `eslint`, `eslint-config-next`, `typescript-eslint` | Linting, incl. `@typescript-eslint/strict` (constitution §10) and the hard-coded-string check (AC-09.1) | All | dev |
| `eslint-config-prettier` | Turns off ESLint rules that conflict with Prettier. Required by the Next.js ESLint guide when Prettier is installed | All | dev |
| `prettier` | Formatting | All | dev |
| `@tailwindcss/postcss`, `postcss` | Tailwind v4's Next.js setup: the official PostCSS plugin | All | dev |
| `@vitejs/plugin-react`, `@testing-library/dom` | Vitest + Testing Library setup from the Next.js guide. `@/` paths use Vitest 5's `resolve.tsconfigPaths` | All | dev |

Versions come from `pnpm-lock.yaml`; this table records *why* each package is here.

## 3. Agent dependencies

The AI tooling is treated like any other dependency: pinned, licensed, checksummed and updated on purpose.

### Rule (project-owned)

| File | Owner | Purpose |
|---|---|---|
| `.cursor/rules/spec-driven.mdc` | This project | Always applied. Reading order, which skill to use, known overrides where skills conflict with the constitution, the test-first stop, and the per-task self-check. |

### Skills and checklists (third-party, vendored)

| | |
|---|---|
| **Source** | https://github.com/addyosmani/agent-skills |
| **Pinned at** | commit `39b723ceebf81474d0557c1fecd01eddab585563` (2026-11-13) |
| **Licence** | MIT, © 2025 Addy Osmani. Copy kept at `.cursor/skills/LICENSE` |
| **Local changes** | None. Files are byte-for-byte upstream (apart from a final newline). Project-specific behaviour is set by overrides in the rule, never by editing the skills. |
| **Checksums** | `.cursor/agent-deps.sha256` |

| Skill | Path | Why it's here |
|---|---|---|
| `test-driven-development` | `.cursor/skills/test-driven-development/` | Test-first for logic tasks (constitution §8) |
| `incremental-implementation` | `.cursor/skills/incremental-implementation/` | One task at a time, thin slices, a commit per step |
| `frontend-ui-engineering` | `.cursor/skills/frontend-ui-engineering/` | UI, responsive layout and accessibility |
| `source-driven-development` | `.cursor/skills/source-driven-development/` | Checks framework decisions against the docs in §1; Next.js 16 and XState 5 are newer than much agent training data |
| `debugging-and-error-recovery` | `.cursor/skills/debugging-and-error-recovery/` | Structured triage when something breaks |
| `security-and-hardening` | `.cursor/skills/security-and-hardening/` (incl. `references/hardening-patterns.md`) | Security review pass before handover |

| Shared checklist | Path | Used by |
|---|---|---|
| Accessibility checklist | `.cursor/references/accessibility-checklist.md` | `frontend-ui-engineering` |
| Definition of Done | `.cursor/references/definition-of-done.md` | `incremental-implementation` (with an override in the rule) |
| Security checklist | `.cursor/references/security-checklist.md` | `security-and-hardening` |
| Testing patterns | `.cursor/references/testing-patterns.md` | `test-driven-development` |

**Not installed, on purpose** (19 of the 25 upstream skills):

| Skills | Why not |
|---|---|
| `spec-driven-development`, `planning-and-task-breakdown`, `interview-me`, `idea-refine` | Already done in `specs/`; installed, they invite re-specifying and a second spec file |
| `constraint-driven-development` | Would create `CONSTRAINTS.md`, a second rulebook next to the constitution |
| `git-workflow-and-versioning` | Trunk-based; conflicts with constitution §10 |
| `using-agent-skills` | Routes to all 25 skills; the rule's skill table routes to the six installed |
| `ci-cd-and-automation`, `observability-and-instrumentation`, `shipping-and-launch`, `performance-optimization`, `documentation-and-adrs`, `deprecation-and-migration` | Production scope (see the production backlog in `specs/PLAN.md`) |
| `doubt-driven-development`, `code-simplification`, `code-review-and-quality`, `api-and-interface-design`, `context-engineering`, `browser-testing-with-devtools` | Useful, but extra time or extra tooling (Chrome DevTools MCP) the demo doesn't need |

### Verify

Check that nothing in the vendored files has changed since it was pinned:

```bash
cd .cursor && shasum -a 256 -c agent-deps.sha256
```

Every line should end in `OK`. A failure means a skill or checklist was edited or replaced; treat it like an unexpected change to `pnpm-lock.yaml`.

### Update

1. Clone upstream at the new commit and diff the installed skills and checklists against it.
2. Read the changes against `specs/00-constitution.md` and the overrides in `.cursor/rules/spec-driven.mdc`; add or remove overrides as needed.
3. Copy the files in, regenerate the checksums (`cd .cursor && find skills references -type f ! -name .DS_Store | sort | xargs shasum -a 256 > agent-deps.sha256`) and update the commit and date above.
4. Commit as `chore(agent): update skills to <short sha>` with a one-line summary of what changed.

Adding or removing a skill follows the same steps and is *Ask first* (constitution §9).
