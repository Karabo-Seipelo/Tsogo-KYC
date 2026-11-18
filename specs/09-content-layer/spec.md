# 09 · Content layer

**Covers:** all user-facing copy, including accessibility text.
**Serves:** BR-9 (copy editable without a code release), BR-1 (compliance wording can change quickly), BR-2 (copy can be tested and improved).
**Screens:** all.

## Context

Compliance may need to change legal wording, marketing will want to tune tone, and South African players would benefit from more languages. None of that should need a code release. So no copy lives in components: it comes through one interface. For the demo, that's a JSON file bundled with the app; in production, a CMS endpoint with the same shape, and no component changes.

## Requirements

- R-09.1 No hard-coded user-facing strings in components, including button names, `aria-label`s and live-region messages.
- R-09.2 Copy is read from the bundled `content/{locale}.json` through `ContentSource` on the server and passed to the client through `ContentProvider`.
- R-09.3 A `ContentSource` interface with a `json` source that reads the bundled file. `production`: a `cms` source chosen by `CONTENT_SOURCE=json|cms`, which fetches from the CMS and maps it to the same shape (PB-1).
- R-09.4 The bundled file is validated against a schema (e.g. Zod) in a test, and the schema is the source of the TypeScript type. `production`: the CMS payload is validated at runtime; invalid or unreachable → **fall back to the bundled JSON** and log a warning (PB-1).
- R-09.5 Keys are grouped by screen and element (`start.title`, `document.capture.instruction`); lists are arrays, not HTML, so components render real `<ul>`/`<ol>` elements.
- R-09.6 Variable parts use named placeholders (`"Code expires in {time}"`), filled in by a `t(key, values)` helper. No string concatenation in components.
- R-09.7 API error codes map directly to copy: an error `{ code: 'SESSION_EXPIRED' }` renders `errors.SESSION_EXPIRED.*`.
- R-09.8 The locale comes from a single setting (`en-ZA` today). Adding a language means adding a file or a CMS locale, not changing code. Supporting a second locale is `production` (PB-2).
- R-09.9 `production` `GET /api/content/{locale}` serves the payload, so the client can refresh copy and a CMS publish can revalidate it without a deploy (PB-1).

## Acceptance criteria

- **AC-09.1** GIVEN the codebase WHEN a lint rule or test scans the components THEN no user-facing string literals are found (outside tests and content files).
- **AC-09.2** GIVEN `content/en-ZA.json` is missing a key that a component uses THEN the type check or a test fails before deploy.
- **AC-09.3** `production` GIVEN `CONTENT_SOURCE=cms` and the CMS is unreachable or returns an invalid payload THEN the journey renders with the bundled copy AND a warning is logged.
- **AC-09.4** `production` GIVEN `CONTENT_SOURCE` is switched between `json` and `cms` THEN no component code changes.
- **AC-09.5** GIVEN a placeholder value (`{time}`, `{reference}`, `{attempt}`) THEN it's filled in correctly; a missing value fails in development, not silently in production.
- **AC-09.6** `production` GIVEN a second locale file (e.g. a test `xx-XX.json`) and the locale setting changed THEN every screen renders that locale's copy.
- **AC-09.7** GIVEN any API error with a known code THEN the matching `errors.{CODE}` copy is shown; an unknown code falls back to a generic error message.

## API

`production` (R-09.9, PB-1). The demo reads the bundled file directly.

| Method | Endpoint | Response |
|---|---|---|
| `GET` | `/api/content/:locale` | The content payload (shape of `content/en-ZA.json`), cached; `404` for unknown locales |

## Design notes

- **Where it loads:** read on the server for the first render, then passed to the client through a `ContentProvider` context. Components call `useContent()` and `t()`.
- **Caching:** `production`. Cached per locale; with a real CMS, revalidate on a publish webhook (e.g. Storyblok webhook → revalidate the content route), so edits go live without a deploy.
- **Types:** the schema is the source of the TypeScript type, so `t('start.titel')` is a type error.
- **Structure of the payload:** a `meta` block (locale, version, source) plus one object per screen, a `common` block and an `errors` block keyed by API error code.
- **Not content:** icons, layout and behaviour stay in code. Only words are content.
- **Starting point:** `content/en-ZA.json` was extracted from the wireframes, so the build's copy matches the designs. Copy the specs need but the wireframes don't have yet is listed in `meta.notes`.
- **Unknown codes:** `errors.generic` is the fallback for AC-09.7. Title: "Something went wrong". Body: "We couldn't complete that step. Please try again." Known codes stay `errors.{CODE}`.

## Tasks

- [x] T-09.1 Content schema and the type inferred from it → R-09.4, AC-09.2 · verify: `pnpm test src/lib/content` fails because the schema is missing · files: `src/lib/content/schema.ts`, `src/lib/content/schema.test.ts` · gate: tests reviewed
- [x] T-09.2 `ContentSource` and the `json` source that reads `content/en-ZA.json`, plus a test that the bundled file matches the schema → R-09.2, R-09.3, AC-09.2 · verify: `pnpm test src/lib/content` · files: `src/lib/content/source.ts`, `src/lib/content/jsonSource.ts`, `src/lib/content/jsonSource.test.ts` · gate: tests reviewed
- [x] T-09.3 `t(key, values)` fills `{time}`, `{reference}`, and `{attempt}`; a missing value fails in development → R-09.6, AC-09.5 · verify: `pnpm test src/lib/content` · files: `src/lib/content/t.ts`, `src/lib/content/t.test.ts` · gate: tests reviewed
- [x] T-09.4 `ContentProvider` and `useContent()` pass the server-loaded copy to the client → R-09.2 · verify: `pnpm test src/lib/content` · files: `src/lib/content/ContentProvider.tsx`, `src/lib/content/useContent.ts`, `src/lib/content/ContentProvider.test.tsx` · gate: tests reviewed
- [ ] T-09.5 Known API codes resolve to `errors.{CODE}`; an unknown code uses `errors.generic` → R-09.7, AC-09.7 · verify: `pnpm test src/lib/content` · files: `src/lib/content/errors.ts`, `src/lib/content/errors.test.ts`, `content/en-ZA.json` · gate: tests reviewed
- [ ] T-09.6 (P2) Lint or test that components contain no hard-coded user-facing strings → AC-09.1 · verify: `pnpm lint` · files: `eslint.config.mjs`
- [ ] T-09.7 `production` `GET /api/content/[locale]` and the CMS fallback (PB-1)
- [ ] T-09.8 `production` `cms` source and publish revalidation (PB-1)
