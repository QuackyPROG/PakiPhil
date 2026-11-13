# PaPhil design system

**Idea:** a sticker book of Filipino paperwork. Bond paper, manila folders, rubber stamps, and Phil the cheetah ("mabilis mag-fill"). The one bold element is the **stamp**; everything around it stays quiet.

Tokens live in `app/globals.css` (`:root`). The living style guide is at **`/design`** (not linked from the app).

## Colour

| Token | Hex | Role |
|---|---|---|
| `--paper` | `#fff8ea` | Page background (bond paper, faint dot grid) |
| `--manila` | `#f6e6bd` | Panels: upload tray, clipboard, footer |
| `--sheet` | `#fffdf7` | Cards and form pages |
| `--ink` | `#3a2415` | Text, button outlines, dark bars (Phil's outline) |
| `--ink-soft` | `#6b4a33` | Secondary text (≈7:1 on paper) |
| `--purple` | `#6b45cf` | Primary actions (Phil's folder) |
| `--gold` | `#f2b33d` | Current step, selection, highlights (Phil's coat) |
| `--sky` | `#4d9de0` | Lumen (Phil's scanner) |
| `--ok` / `--check` / `--missing` | `#2b7d4c` / `#a86b00` / `#c23d27` | Field status: filled / check / missing, each with a `-soft` tint |

## Type

- **Bricolage Grotesque** 800 for display and headings (`--font-display`), tracking ≥ -0.035em.
- **Figtree** for body and controls (`--font-body`), 16px / 1.55.
- **JetBrains Mono** only for machine-read data: OCR words and record values (`--font-mono`). Never for labels.
- Scale: 13 / 16 / 20 / 25 / 28–36 / 40–72px (`--step--1` … `--step-4`).

## Shape, depth, space

- Radii: 8 / 14 / 22px, pills for chips and the journey nav.
- Depth: soft offset shadows only (`--shadow-sheet`, `--shadow-lift`). No hard block shadows.
- Buttons are stickers you press: 2px ink outline with a 4px bottom lip that compresses on `:active`.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72px (`--s1` … `--s8`).

## Components

- **Stamp** (`.stamp`, `.stamp.big`): double border, rotated −9°, multiply blend, worn mask.
- **Phil** (`components/mascot.tsx`): nine poses from `public/mascot/web/*.webp` (built by `scripts/mascot-clean.mjs`). Screens call `useMood(progress, error, idle)`; the dock reads it and swaps pose with a squash-and-pop.
- **Lumen pipeline** (`components/ui/pipeline.tsx`): Upload → Lumen OCR → Lumen AI → Silip, derived from each screen's progress text.
- **Journey nav**: 1 My record → 2 Paki-fill → 3 Pirma, with ticks as steps complete.
- **Clipboard** (final check): manila board, big tally that ticks down, status chips with drawn icons.
- **Icons** (`components/ui/icons.tsx`): one authored 24px set, 2.25 stroke. No emoji or text glyphs as icons.

## Motion (GSAP, `components/ui/motion.ts`)

- **Focal moment:** answers stamp onto the form page by page, and the final "Pirma na lang!" stamp slams on the celebration card with confetti.
- **Continuity:** mascot pose swaps, pipeline step advance, screen content settling in (0.4s).
- **Feedback:** button press, the tally ticking down, a stamp on each confirmed answer.
- Easing `expo.out` / `cubic-bezier(.16,1,.3,1)`; durations 140 / 240 / 480ms; nothing waits on choreography.
- `prefers-reduced-motion`: GSAP sequences are skipped; colour and state changes remain.
- Sound (`playSfx`): synthesized thunk, pop and chime, only when Sound is on.

## Voice

Taglish, warm, short. Buttons name their action ("Confirm and save 72 values", "Download filled PDF"). No eyebrow labels above headings, no "·"-joined meta strings, no arrows appended to buttons.
