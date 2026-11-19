# 07 · Environments & bootstrap

**Covers:** running the same app locally, on Vercel previews and in production (Docker is designed here but in the production backlog); deployment to `tsogo.karaboseipelo.com`; the automated checks that run locally (git hooks) and in CI.
**Serves:** BR-8 (noindex, demo safety); delivery confidence for everything else.

## Requirements

- R-07.1 A fresh clone runs with `pnpm install && pnpm dev`: no accounts, Docker or tunnel needed (memory store, single device).
- R-07.2 `STORE_DRIVER=memory|redis` selects the session store. Redis uses `@upstash/redis` everywhere: an Upstash dev database locally (optional), Upstash per environment on Vercel.
- R-07.3 `production` Docker Compose profiles (PB-3):
  - `dev`: `redis`, `srh`, `app-dev` (hot reload).
  - `prodlike`: `redis`, `srh`, `app` ×2, `proxy` (nginx, round robin, `client_max_body_size 4500k`).
  - `phone`: adds `tunnel` (cloudflared).
- R-07.4 Scripts: `bootstrap`, `dev`, `dev:phone` (dev server plus a `cloudflared` tunnel). `production`: `docker:dev`, `docker:prod`, `docker:phone`, `docker:url` (PB-3).
- R-07.5 Vercel: production on `main` → `tsogo.karaboseipelo.com`; preview per branch. Separate Upstash databases per environment, and keys prefixed by environment.
- R-07.6 The demo is `noindex` (`X-Robots-Tag` + `robots.txt`) and shows the demo banner.
- R-07.7 `DEMO_MODE` (server-side env var, default `true` in every environment) controls both. The banner is rendered once in the root layout, above every route including `/privacy` and the saved page, with copy from `common.demoBanner` (`long` on desktop, `short` on the phone).
- R-07.8 `production` Starting with `DEMO_MODE=false` while the mock verification API is in use fails at startup with a clear error, so the demo can never run as if it were real (PB-8).
- R-07.9 **CI.** GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and the agent-skill checksum check (`shasum -a 256 -c .cursor/agent-deps.sha256`, run in `.cursor/`). Node and pnpm versions come from the repo (`package.json` `engines` / `packageManager`), not hard-coded in the workflow. CI is the gate: nothing merges to `main` red.
- R-07.10 **Local hooks.** Installed automatically by `pnpm install` (husky, via the `prepare` script):
  - **pre-commit:** lint-staged runs ESLint `--fix` and Prettier on staged files only; then `pnpm typecheck` and the checksum check.
  - **commit-msg:** commitlint with `@commitlint/config-conventional`, so every message follows Conventional Commits (constitution §10).
  - **pre-push:** `pnpm test`.
  `pnpm build` runs in CI only, to keep commits fast. Hooks can be skipped with `--no-verify`, which is why CI is the gate, and why skipping them is a *Never* (constitution §9).

## Acceptance criteria

- **AC-07.1** GIVEN a fresh clone with no `.env.local` WHEN `pnpm install && pnpm dev` THEN the full single-device journey works.
- **AC-07.2** GIVEN `pnpm bootstrap` THEN it checks Node/pnpm versions, creates `.env.local` from `.env.example` if missing, and prints the run modes.
- **AC-07.3** `production` GIVEN `pnpm docker:phone` + `pnpm docker:url` WHEN the tunnel URL is opened on desktop and the QR is scanned THEN the full handoff works across 2 app instances.
- **AC-07.4** GIVEN a Vercel preview deployment THEN its QR code points at the preview URL AND sessions use the preview database.
- **AC-07.5** GIVEN production THEN `https://tsogo.karaboseipelo.com` serves over HTTPS AND responses carry `X-Robots-Tag: noindex`.
- **AC-07.6** GIVEN `DEMO_MODE` is unset or `true` THEN every route, including error pages, `/privacy` and the saved page, shows the banner AND carries `noindex`.
- **AC-07.7** `production` GIVEN `DEMO_MODE=false` with the mock API THEN the app refuses to start.
- **AC-07.8** GIVEN `pnpm dev:phone` THEN it prints an HTTPS tunnel URL; WHEN that URL is opened on desktop and the QR is scanned with a phone THEN the handoff works and the phone camera opens.
- **AC-07.9** GIVEN a push or pull request THEN CI runs all six checks; GIVEN any check fails THEN the run fails and the commit shows a red ✗; GIVEN a file under `.cursor/skills/` or `.cursor/references/` is edited THEN the checksum step fails.
- **AC-07.10** GIVEN a fresh clone WHEN `pnpm install` runs THEN the hooks are installed; GIVEN a staged file with a lint or type error WHEN committing THEN the commit is rejected; GIVEN staged files with fixable formatting THEN they're fixed and included.
- **AC-07.11** GIVEN a commit message that isn't Conventional Commits (e.g. `chore:missing space`) THEN the commit is rejected with the reason; GIVEN `feat(01): add retry guard` THEN it's accepted. GIVEN a failing test WHEN pushing THEN the push is rejected.

## Design notes

- `production` `Dockerfile` (repo root) stages: `deps` → `dev` → `builder` → `runner` (Next `output: 'standalone'`).
- `production` macOS: `WATCHPACK_POLLING=true` for the `dev` profile. Check the SRH image supports arm64.
- DNS: add the domain in Vercel and create the CNAME it shows at the DNS provider (or nothing more if the domain already uses Vercel's nameservers).

## Tasks

P0 is the local scaffold. `dev:phone` is P3. The banner, `noindex`, Vercel and the domain are P5.

- [x] T-07.1 Scaffold Next.js (App Router, TypeScript strict, Tailwind, `src/`, alias `@/*`) into this repo without replacing `README.md`, `content/` or `.cursor/`. Home page is an empty `<main>` → P0 scaffold · verify: `git diff -- README.md content` is empty · files: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`
- [x] T-07.2 ESLint (`next/core-web-vitals` + `@typescript-eslint/strict` + Prettier), Tailwind via PostCSS, merge `.gitignore` → P0 scaffold · verify: `pnpm lint` · files: `eslint.config.mjs`, `postcss.config.mjs`, `src/app/globals.css`, `.gitignore`
- [x] T-07.3 P0 scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `bootstrap` → constitution §10 · verify: `pnpm run` · files: `package.json`
- [x] T-07.4 `.env.example` with demo defaults (`STORE_DRIVER`, Upstash URL and token, session and handoff TTLs, `MOCK_FAILURE_RATE`, `DEMO_MODE`) → R-07.2, R-07.7 · verify: file review · files: `.env.example`
- [x] T-07.5 `scripts/bootstrap.mjs`: Node ≥ 20.9, pnpm ≥ 9, create `.env.local` from `.env.example` if missing, print the run modes → AC-07.2 · verify: `pnpm bootstrap` · files: `scripts/bootstrap.mjs`, `package.json`
- [x] T-07.6 Vitest + one test that the home page renders `<main>` → P0 scaffold · verify: `pnpm test` · files: `vitest.config.mts`, `src/app/page.test.tsx`
- [x] T-07.7 Record lockfile versions in `docs/TECH-STACK.md` §1 → P0 scaffold · verify: cells match `pnpm-lock.yaml` · files: `docs/TECH-STACK.md`
- [x] T-07.8 Checkpoint → AC-07.2 · verify: `pnpm typecheck && pnpm lint && pnpm test`, then `pnpm dev` serves a page, then `pnpm bootstrap` · files: none

P0.5 · Checks:

- [x] T-07.9 CI workflow with the six checks → R-07.9, AC-07.9 · verify: push the branch and see a green run; then a deliberately failing commit shows red · files: `.github/workflows/ci.yml`, `package.json` (`engines`, `packageManager`)
- [x] T-07.10 husky + lint-staged: pre-commit (staged lint and format, typecheck, checksum) and pre-push (tests) → R-07.10, AC-07.10 · verify: a staged lint error is rejected; `git push` with a failing test is rejected · files: `package.json` (`prepare`, `lint-staged`), `.husky/pre-commit`, `.husky/pre-push`
- [x] T-07.11 commitlint commit-msg hook → R-07.10, AC-07.11 · verify: `chore:missing space` is rejected, `chore(07): add commitlint` is accepted · files: `commitlint.config.mjs`, `.husky/commit-msg`, `package.json`
- [x] T-07.12 Checkpoint → AC-07.9 – AC-07.11 · verify: all three hooks fire on a throwaway commit; CI is green on the branch · files: none

Later phases, not built in P0 or P0.5:

- [x] T-07.13 (P3) `pnpm dev:phone` prints an HTTPS tunnel URL. Scanning that QR from a phone completes the handoff and opens the camera → AC-07.8 · verify: manual · files: `package.json`
- [ ] `production` `docker-compose.yml`, `Dockerfile`, `docker/nginx.conf` (PB-3)

P5 · Ship:

- [x] T-07.14 (P5) Show the demo banner from the root layout on every route, including `/privacy`, the saved page and error pages, while `DEMO_MODE` is unset or `true`. Long copy from 768 px up, short copy below → AC-07.6 · verify: `pnpm test src/app` · files: `src/app/layout.tsx`, `src/components/DemoBanner.tsx`, `src/app/layout.test.tsx`
- [x] T-07.15 (P5) Send `X-Robots-Tag: noindex` and add `robots.txt` while `DEMO_MODE` is unset or `true` → AC-07.6 · verify: `pnpm test` · files: `src/app/robots.ts`, `next.config.ts`
- [x] T-07.16 (P5) Vercel project with preview and production env vars, and a separate Upstash database for each. The preview QR uses the preview URL and the preview database → AC-07.4 · verify: a preview deploy · files: `src/lib/store`, `docs/TECH-STACK.md`, `.env.example`
- [x] T-07.17 (P5) Attach `tsogo.karaboseipelo.com` and the DNS record Vercel shows → AC-07.5 · verify: `https://tsogo.karaboseipelo.com` over HTTPS with `X-Robots-Tag: noindex` · files: none
- [x] T-07.18 (P5) Keyboard-only run of the full journey → P5 checkpoint · verify: manual · files: none
- [x] T-07.19 (P5) Fill the `_TBC_` marks in `README.md` and the test column in `specs/README.md` → P5 checkpoint · verify: no `_TBC_` left · files: `README.md`, `specs/README.md`
- [ ] T-07.20 (P5) Handover check of a fresh local journey, the preview, production `noindex`, and `pnpm dev:phone` → AC-07.1, AC-07.4 – AC-07.6, AC-07.8 · verify: manual · files: none
