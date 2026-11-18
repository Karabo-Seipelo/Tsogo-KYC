# 07 · Environments & bootstrap

**Covers:** running the same app locally, on Vercel previews and in production (Docker is designed here but in the production backlog); deployment to `tsogo.karaboseipelo.com`.
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

## Acceptance criteria

- **AC-07.1** GIVEN a fresh clone with no `.env.local` WHEN `pnpm install && pnpm dev` THEN the full single-device journey works.
- **AC-07.2** GIVEN `pnpm bootstrap` THEN it checks Node/pnpm versions, creates `.env.local` from `.env.example` if missing, and prints the run modes.
- **AC-07.3** `production` GIVEN `pnpm docker:phone` + `pnpm docker:url` WHEN the tunnel URL is opened on desktop and the QR is scanned THEN the full handoff works across 2 app instances.
- **AC-07.4** GIVEN a Vercel preview deployment THEN its QR code points at the preview URL AND sessions use the preview database.
- **AC-07.5** GIVEN production THEN `https://tsogo.karaboseipelo.com` serves over HTTPS AND responses carry `X-Robots-Tag: noindex`.
- **AC-07.6** GIVEN `DEMO_MODE` is unset or `true` THEN every route, including error pages, `/privacy` and the saved page, shows the banner AND carries `noindex`.
- **AC-07.7** `production` GIVEN `DEMO_MODE=false` with the mock API THEN the app refuses to start.
- **AC-07.8** GIVEN `pnpm dev:phone` THEN it prints an HTTPS tunnel URL; WHEN that URL is opened on desktop and the QR is scanned with a phone THEN the handoff works and the phone camera opens.

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

Later phases, not built in P0:

- [ ] `dev:phone` script (cloudflared) → AC-07.8 (P3)
- [ ] `production` `docker-compose.yml`, `Dockerfile`, `docker/nginx.conf` (PB-3)
- [ ] Vercel project, environment variables per environment, Upstash databases (preview + production)
- [ ] Domain `tsogo.karaboseipelo.com` + DNS
- [ ] `DEMO_MODE` banner in the root layout, `noindex` headers + `robots.txt` → AC-07.6 (P5). The variable itself is in `.env.example` (T-07.4)
- [ ] Run AC-07.1, AC-07.4 – AC-07.6 and AC-07.8 before handover
