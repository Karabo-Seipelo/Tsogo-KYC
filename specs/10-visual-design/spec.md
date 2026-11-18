# 10 · Visual design

**Covers:** the look of the journey: design principles, design tokens, components and their states, and the high-fidelity screens.
**Serves:** BR-2 (a calm, trustworthy flow is one people finish), BR-9 (the brand is configuration, like the copy).
**Screens:** all. Thirteen high-fidelity reference screens and every component are on Figma page "6 · Visual design"; [`handoff.md`](handoff.md) maps them to code and to the screens that reuse their patterns.

## Context

People are handing over an ID document and a photo of their face. The design's job is to make that feel safe and simple: calm, banking-like, one clear action per screen, nothing decorative competing with the task.

The palette is **inspired by** the client's public colour scheme (charcoal, muted gold, warm white; Montserrat). It is not a copy of their brand: no logo, wordmark, product name or page layout of theirs is used, the product is called "Verify your identity", and the demo banner stays on every page (R-07.7). Because every colour, font and radius is a token, a real brand theme is a token swap, not a redesign (PB-15).

## Principles

1. **Calm over clever.** Warm white surfaces, charcoal text, gold used sparingly as an accent. No gradients, no imagery that competes with the camera view.
2. **One primary action per screen.** Charcoal filled button; everything else is secondary.
3. **Trust signals are quiet and specific.** Plain copy about what happens to the data, not badges.
4. **Status is never colour alone.** Every success, warning or error has an icon and text (constitution §4).
5. **Mobile first.** Capture happens on the phone; desktop is the calmer, wider version.

## Requirements

- R-10.1 All visual values come from design tokens defined once in `src/app/globals.css` with Tailwind v4 `@theme`, and mirrored as Figma variables with the same names. Components never use raw colour values, pixel font sizes or arbitrary radii.
- R-10.2 **Colour tokens.** Contrast ratios are on the token they're used with.

  | Token | Value | Use | Contrast |
  |---|---|---|---|
  | `ink` | `#323437` | Body text, primary button fill, dark surfaces | 12.49 : 1 on white |
  | `ink-muted` | `#5F6368` | Secondary text, hints | 6.05 : 1 on white; 5.55 : 1 on `canvas` |
  | `canvas` | `#F7F5F0` | Page background (warm white) | — |
  | `surface` | `#FFFFFF` | Cards, dialogs, inputs | — |
  | `line` | `#DDDDDD` | Decorative dividers only | — |
  | `line-strong` | `#8D8D8D` | Input and card borders that identify a control | 3.32 : 1 on white (non-text ≥ 3 : 1) |
  | `gold` | `#BC9860` | Decorative accent only: rules, illustration, selected-card edge **with** a second cue | 2.69 : 1 on white: never text, never the only indicator |
  | `gold-strong` | `#86683A` | Links, accent text, progress fill, focus ring | 5.18 : 1 on white |
  | `gold-bright` | `#EAC95D` | Accent on `ink` surfaces only (e.g. the demo banner) | 7.74 : 1 on `ink` |
  | `on-ink` | `#FFFFFF` | Text and icons on `ink` | 12.49 : 1 |
  | `success` / `success-soft` | `#1E7A46` / `#E8F3EC` | Passed checks | 5.35 : 1 on white |
  | `danger` / `danger-soft` | `#B3261E` / `#FBEAE9` | Errors, failed checks | 6.54 : 1 on white |
  | `warning` / `warning-soft` | `#9A5B00` / `#FBF1E3` | Timeouts, retries | 5.43 : 1 on white |
  | `info` / `info-soft` | `#2457A6` / `#EAF0FA` | Neutral notices | 7.03 : 1 on white |

- R-10.3 **Type.** Montserrat for everything (Google Fonts via `next/font`, self-hosted, `display: swap`). Scale: `display` 32/40 semibold (desktop h1), `title` 24/32 semibold (mobile h1, desktop h2), `heading` 18/26 semibold, `body` 16/24 regular, `small` 14/20 regular, `caption` 12/16 medium. Body text is never below 16 px on the phone.
- R-10.4 **Space, radius, elevation, motion.** Spacing on a 4 px base (4, 8, 12, 16, 24, 32, 48, 64). Radius: `sm` 6 (chips), `md` 10 (buttons, inputs), `lg` 16 (cards, dialogs), `full` (pills, avatars). One elevation for cards (`0 1px 2px rgb(50 52 55 / 0.06), 0 4px 16px rgb(50 52 55 / 0.06)`) and one for dialogs. Motion 150 ms for state changes, 250 ms for panels, ease-out; all of it off under `prefers-reduced-motion`.
- R-10.5 **Components**, each with every state it can be in:
  - Button: primary (`ink` fill), secondary (`surface` + `line-strong` border), text link (`gold-strong`); default, hover, focus-visible, pressed, disabled, loading.
  - OptionCard (device choice, document type): default, hover, selected (`ink` 2 px border **and** a check icon), focus-visible.
  - Progress: "Step n of 4 · name" plus four segments (`gold-strong` filled, `line` empty).
  - Alert / inline status: success, warning, danger, info; icon + title + text + optional action.
  - Checklist row (D4, M3a/M3b, review): icon + label + status text.
  - Dialog / sheet: Help, Save & exit, timeout warning (E5).
  - Camera frame: viewfinder, document or face-oval guide, capture button (64 px), "Upload instead".
  - QR panel: QR on `surface` with a quiet border, expiry countdown, "Get a new code".
  - Demo banner: `ink` background, `gold-bright` label, white text.
- R-10.6 **Layout.** Phone: single column, 16 px side padding, primary action pinned to the bottom safe area. Desktop: centred card, max width 560 px for task screens (720 px for review), on `canvas`. Must not break at 768 px (constitution §3).
- R-10.7 **Accessibility (on top of constitution §4).** Text meets 4.5 : 1 (3 : 1 for ≥ 24 px or ≥ 19 px bold); controls and focus indicators meet 3 : 1 against what's next to them; focus ring 2 px `gold-strong` with a 2 px offset; touch targets at least 44 × 44 px.
- R-10.8 `production` A dark theme and a client brand theme, each as a token set (PB-15).

## Acceptance criteria

- **AC-10.1** GIVEN the component source WHEN linted THEN no raw colour values (`#…`, `rgb(…)`, Tailwind palette classes like `bg-gray-500`) appear outside `globals.css`.
- **AC-10.2** GIVEN every text/background pair used in the components THEN it meets the contrast in R-10.2 / R-10.7 (checked by a test over the token table, and spot-checked with axe or the browser's contrast tool).
- **AC-10.3** GIVEN keyboard navigation THEN every interactive element shows the `gold-strong` focus ring.
- **AC-10.4** GIVEN `prefers-reduced-motion: reduce` THEN no transitions or animations run.
- **AC-10.5** GIVEN widths of 390, 768 and 1440 px THEN no screen overflows horizontally and the primary action is visible without horizontal scrolling.
- **AC-10.6** GIVEN the thirteen reference screens THEN the built screens match their Figma layouts, tokens and states.

## Design notes

- The gold is the one thing that carries the inspiration; it's used at most once or twice per screen. Most of the warmth comes from `canvas`, not from gold.
- Selected states use `ink` (strong contrast) rather than gold, so selection never depends on a colour that fails contrast.
- The demo banner is the only place `gold-bright` appears, which also keeps it visually distinct from the product.
- `next/font` self-hosts Montserrat, so there's no runtime request to Google, which also avoids a third-party call on a page handling ID documents.

## Tasks

- [ ] T-10.1 Tokens in `globals.css` (`@theme`) and Montserrat via `next/font` → R-10.1 – R-10.4 · verify: `pnpm build`; token values match this spec · files: `src/app/globals.css`, `src/app/layout.tsx`
- [ ] T-10.2 Contrast test over the token pairs **(tests first)** → AC-10.2 · verify: `pnpm test src/styles` · files: `src/styles/contrast.test.ts` · gate: tests reviewed
- [ ] T-10.3 Lint rule against raw colours → AC-10.1 · verify: `pnpm lint` flags a raw hex in a test fixture · files: `eslint.config.mjs`
- [ ] T-10.4 Restyle the shared components with all states → R-10.5, AC-10.3, AC-10.4 · verify: `pnpm test src/components` · files: `src/components/ui/*`
- [ ] T-10.5 Apply layouts to every screen using the patterns in `handoff.md`, and check the thirteen reference screens against `docs/design/hifi/` → R-10.6, AC-10.5, AC-10.6 · verify: manual at 390 / 768 / 1440 px; screenshots in the PR · files: screen components
- [ ] T-10.6 `production` Dark and brand themes (PB-15)
