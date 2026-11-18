# 10 · Visual design: build handoff

How to turn the Figma designs into code for P4.5. Read with [`spec.md`](spec.md): the spec says *what* is required; this file says *where each piece is* and *how the patterns apply to every screen*.

**Figma:** [Tsogo Sun – KYC Journey Wireframes](https://www.figma.com/design/NKnT6Cq3Logva3bE5tC8gd/), page **"6 · Visual design"**. Variables collection **"Tokens"** holds every colour, space and radius below, with the same names.
**Images:** export each `HF · …` frame as PNG (1×) into `docs/design/hifi/`, named by screen code (`D1.png`, `M2.png`…), so the agent can compare its output with the design without Figma access.

## 1. Token contract

`src/app/globals.css` defines these in Tailwind v4 `@theme`, so the classes below exist (`bg-ink`, `text-ink-muted`, `border-line-strong`, `rounded-lg`…). Values must match spec 10, R-10.2 – R-10.4.

```css
@theme {
  --color-ink: #323437;          --color-ink-muted: #5F6368;
  --color-canvas: #F7F5F0;       --color-surface: #FFFFFF;
  --color-line: #DDDDDD;         --color-line-strong: #8D8D8D;
  --color-gold: #BC9860;         --color-gold-strong: #86683A;  --color-gold-bright: #EAC95D;
  --color-on-ink: #FFFFFF;
  --color-success: #1E7A46;      --color-success-soft: #E8F3EC;
  --color-danger: #B3261E;       --color-danger-soft: #FBEAE9;
  --color-warning: #9A5B00;      --color-warning-soft: #FBF1E3;
  --color-info: #2457A6;         --color-info-soft: #EAF0FA;

  --font-sans: var(--font-montserrat), system-ui, sans-serif;
  --text-display: 2rem;   --text-display--line-height: 2.5rem;
  --text-title: 1.5rem;   --text-title--line-height: 2rem;
  --text-heading: 1.125rem; --text-heading--line-height: 1.625rem;

  --radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;
  --shadow-card: 0 1px 2px rgb(50 52 55 / 0.06), 0 4px 16px rgb(50 52 55 / 0.06);
  --shadow-dialog: 0 16px 48px rgb(50 52 55 / 0.18);
}
```

Body (16/24), small (14/20) and caption (12/16) use Tailwind's `text-base`, `text-sm`, `text-xs`. Spacing uses Tailwind's default 4 px scale. Tailwind's own palette (`gray-*`, `blue-*`…) is not used; the lint rule (T-10.3) enforces it.

## 2. Components

| Figma component | Node | Code | States to build |
|---|---|---|---|
| `HF/Button/Primary`, `HF/Button/Secondary` | 41:34, 41:36 | `components/ui/Button.tsx` (`variant`) | Default, hover (92 % opacity), focus-visible (2 px `gold-strong` ring, 2 px offset), pressed (84 %), disabled (`line` fill, `ink-muted` text), loading (label "…", `aria-busy`). See the "Button states" sheet (51:129) |
| `HF/OptionCard/Default`, `/Selected` | 51:70, 51:75 | `components/ui/OptionCard.tsx` | Radio-group item. Selected = 2 px `ink` border + filled radio + tick. Never gold alone |
| `HF/Progress` | 41:55 | `components/ui/Progress.tsx` | "Step n of 4 · name" + 4 segments, `gold-strong` filled, `line` empty |
| `HF/Alert/Info`, `/Success`, `/Warning`, `/Danger` | 51:83, 51:89, 51:95, 51:101 | `components/ui/Alert.tsx` (`tone`) | Soft background, 4 px left border in the tone colour, icon + title + body (body optional) |
| `HF/StatusRow`, `/Done`, `/InProgress`, `/Waiting` | 41:62, 51:107, 51:112, 51:117 | `components/ui/StatusRow.tsx` (`status`) | Icon + label + status text. Done = filled tick; in progress = ringed dot + bold label; waiting = empty ring + muted label |
| `HF/Dialog` | 51:121 | `components/ui/Dialog.tsx` | `ink` scrim at 48 %, `rounded-lg`, `shadow-dialog`; actions right-aligned, primary last |
| `HF/DemoBanner/Desktop`, `/Mobile` | 41:38, 41:40 | `components/DemoBanner.tsx` | `ink` background, `gold-bright` text; long copy ≥ 768 px, short below |
| `HF/Header/Desktop`, `/Mobile` | 41:42, 41:49 | `components/Header.tsx` | Gold dot + title; Help (and Save & exit on desktop) as `gold-strong` text buttons |
| `HF/Tick` | 42:10 | inline SVG icon | Used in lists and status rows |

## 3. Screens

Thirteen screens are drawn. Every other screen reuses one of their patterns; the table says which.

| Screen | Figma frame | Pattern |
|---|---|---|
| D1 Start | 41:70 | Desktop task card (560 px): gold rule, display title, estimate chip, tick list, privacy panel, primary CTA |
| D2 Device selection | 51:155 | Option-card radio group; Back + Continue |
| D3 QR handoff | 42:12 | Wide card (720 px): QR panel + numbered steps + info status |
| D4 Status | 51:190 | Status-row list (`aria-live="polite"`) |
| D5 Review | 42:373 | Wide card: thumbnails with Retake, status rows, confirm checkbox, primary submit |
| D7 Complete | 51:343 | Centred result card: soft result mark, title, body, primary CTA |
| M2 Document capture | 42:287 | Phone capture: `ink` viewfinder with corner guides, side chip, 72 px shutter, upload fallback |
| M3a Document passed | 51:242 | Success alert + thumbnail + passed checks + pinned primary |
| M4 Selfie | 51:287 | Viewfinder with dashed white face oval |
| M5 Liveness | 51:315 | Solid `gold-bright` oval; prompt (`aria-live="assertive"`) with prompt dots |
| E3 Face match failed | 42:326 | Photo pair + danger alert with tips + attempt count + two actions |
| E5 Timeout warning | 51:383 | Dialog over the current screen (`role="alertdialog"`) |
| E9 Manual review | 51:361 | Result card (info mark) + reference panel + primary CTA |

**Screens without their own frame:**

| Screen | Build it as |
|---|---|
| D3b QR expired | D3 with a warning alert in place of the status, and "Get a new code" as the primary |
| D6 Processing | D7's centred card with a spinner instead of the mark; "taking longer" swaps the body |
| M1 Choose document | D2's option cards, phone layout |
| M3b Document failed | E3's danger alert with tips, over M3a's layout |
| M6 Face match | E3's photo pair with a success alert |
| M7 Done on phone | D7's result card, phone layout |
| E1 Camera denied, E2 Upload failed, E4 Offline, E6 Expired, E7 Rejected, E8 Phone disconnected | Alert tones: E1/E2/E6/E7 danger, E4 warning banner (`role="status"`), E8 warning in D4's list |
| Help, Save & exit confirmation | `Dialog` |
| Saved page, `/privacy` | D1's task card; privacy sections as `heading` + body |

## 4. Rules that are easy to miss

- All copy comes from `content/en-ZA.json` through `t()`. The designs use that copy word for word; if a design shows text the content file doesn't have, the content file wins.
- Gold (`gold`) is decoration only. Text, links, progress and focus use `gold-strong`.
- Status is never colour alone: every status has an icon and a text label.
- The primary action is pinned to the bottom safe area on the phone (`pb-[env(safe-area-inset-bottom)]`), and in the card on desktop.
- Camera and oval guides are drawn over a live `<video>`; the `ink` background shows only before the stream starts.
- `prefers-reduced-motion`: no transitions, no spinner rotation (use a static mark with "Working…" text).
