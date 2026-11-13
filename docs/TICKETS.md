# Pirma Lang — Ticket Ledger

Tickets cut from [PRD.md](PRD.md), traced to the commits that closed them.
Written retroactively on 2026-11-13 to document how the PRD drove AI-assisted
development: PRD → [BUILD.md](BUILD.md) delivery sequence → small commits → [INTEGRATION.md](INTEGRATION.md) evidence.

## How to read a ticket

- **PRD** names the requirement IDs it covers. The PRD is the single source of truth
  for requirement wording; tickets never restate it, they add the *done* bar and the trace.
- **Done when** is the completion criterion. Every line is checkable by running
  the app, a test, or reading a named file.
- **Status**: `Done` (criterion met, commit cited) · `Partial` (some lines unmet, named) ·
  `Blocked` (waits on something outside the repo) · `Open` (not started).
- **Evidence** cites commits (`git show <sha>`) and the files an agent should open first.
- Tickets are **vertical slices**: each one leaves the app runnable end to end.

## Status board

| # | Ticket | PRD | Priority | Status |
|---|---|---|---|---|
| T-01 | Record schema and browser persistence | §8, ON-6 | P0 | Done |
| T-02 | Server-only provider transport and upload limits | ON-1, FF-1, §9 | P0 | Done |
| T-03 | Lumen OCR proxy: upload, poll, retry, correct | ON-2, §11 OCR | P0 | Done |
| T-04 | Lumen AI session layer with fallback | §11 AI Chat | P0 | Done |
| T-05 | Record extraction that never changes values | ON-3, ON-4 | P0 | Done |
| T-06 | Record builder, review and OCR correction | ON-5, ON-7 | P0 | Done |
| T-07 | Record management: conflicts, expiry, backup, delete | ON-8, ON-9, ON-10, §13 | P1 | Done |
| T-08 | Form intake: render pages, read AcroForm fields | FF-1, FF-2, FF-3 | P0/P1 | Done |
| T-09 | Find blanks and clean labels | FF-4, FF-5 | P0 | Done |
| T-10 | Map labels to record with 🟢/🟡/🔴 statuses | FF-6, FF-7, FF-12 | P0 | Done |
| T-11 | Preview, drag/resize, checkboxes, page navigation | FF-8, FF-9, FF-10 | P0/P1 | Done |
| T-12 | Final check and remembered answers | FC-1 – FC-5 | P0 | Done |
| T-13 | Export filled PDF with signature and photo | EX-1 – EX-3, ON-11, ON-12 | P0–P2 | Done |
| T-14 | Ate Fill mascot and voice | MA-1 – MA-4, FC-3 voice | P1/P2 | Done |
| T-15 | App shell and six screens | §12 | P0 | Done |
| T-16 | Explicit sample demo and stage fallbacks | §13, §14 | P0 | Done |
| T-17 | Verification harness | §17 | P0 | Done |
| T-18 | Configure Lumen AI instance and Gemini key | §11, §18 Q1 | P0 | Blocked |
| T-19 | Deploy to Vercel within payload limits | §5, §10 | P0 | Partial |
| T-20 | Live acceptance and official-form rehearsal | §14, §15 Gate 3, §17 | P0 | Blocked |
| T-21 | Character-box fields | FF-11 | P2 | Open |
| T-22 | PNG page export | EX-4 | P2 | Open |
| T-23 | Pitch, partner, backup video | §5, §14, §15 col. D | — | Out of repo |

Milestone gates (PRD §15): **Gate 1** closed by T-01…T-06 · **Gate 2** closed by T-08…T-13 ·
**Gate 3** passes on sample mode (T-16, T-17), open for live services (T-20).

---

## Onboarding — "Ang Record Mo"

### T-01 · Record schema and browser persistence
**PRD** §8 data model, ON-6 · **Status** Done
**Done when**
- [x] `Record` and `FormField` from PRD §8 exist as Zod schemas; invalid shapes are rejected.
- [x] Record round-trips through IndexedDB and survives a page reload.
- [x] A conflicting value is kept in `history`, never silently overwritten.

**Evidence** `ff72b23`, `85d43fb`, `b32cfd1` · `client/lib/models.ts`, `client/lib/record.ts`, `client/lib/storage.ts`

### T-02 · Server-only provider transport and upload limits
**PRD** ON-1, FF-1, §9 "All API keys stay server-side" · **Status** Done
**Done when**
- [x] JPG/PNG/WebP/PDF accepted by picker and drag-and-drop; >10 MB shows a clear error.
- [x] Provider keys read only in server routes; no `NEXT_PUBLIC_` key; absent from browser bundles.
- [x] Server requests honor `HTTP(S)_PROXY`.

**Evidence** `7e11807`, `28fd0c9`, `4f90898` · `client/lib/server.ts`, `client/lib/upload.ts`, `client/components/upload.tsx`

### T-03 · Lumen OCR proxy: upload, poll, retry, correct
**PRD** ON-2, §9 routes `/api/ocr*`, §11 OCR · **Status** Done
**Done when**
- [x] `POST /api/ocr` returns `{ documentId }`; status shows Uploading → Reading → Done.
- [x] Polling every 2.5 s, bounded wait (~60 s, PRD credit budget), `FAILED` shows Retry.
- [x] Pages normalize from the real response shape (`data.Items[].Words[]`), page text rebuilt from words.
- [x] `POST /api/ocr/[id]/correct` reaches the Lumen review API.

**Evidence** `0e4147b`, `28fd0c9` · `client/lib/ocr.ts`, `client/app/api/ocr/**` · live smoke in INTEGRATION.md "Live smoke checks"

### T-04 · Lumen AI session layer with fallback
**PRD** §11 AI Chat · **Status** Done
**Done when**
- [x] One session per task, messages <4,000 chars, 30 s client timeout.
- [x] `504` retried once, then explicit fallback to Gemini (and OpenRouter free vision).
- [x] First `{…}` block parsed and validated with Zod; the responding provider is reported.
- [x] Instance refusal surfaces as a configuration error, not a fake success.

**Evidence** `0d38191`, `b39da03`, `6d56618` · `client/lib/ai.ts`

### T-05 · Record extraction that never changes values
**PRD** ON-3, ON-4 · **Status** Done
**Done when**
- [x] `POST /api/extract-record` output validates against the record schema; invalid JSON retried once.
- [x] Misread labels map to keys ("FIRTH NAME" → `firstName`).
- [x] Any extracted value not present in the OCR text is rejected; doubts become 🟡 flags with a suggestion.

**Evidence** `a376012` · `client/lib/extraction.ts`, `client/app/api/extract-record/route.ts`

### T-06 · Record builder, review and OCR correction
**PRD** ON-5, ON-7 · **Status** Done
**Done when**
- [x] User confirms or edits each extracted value before save.
- [x] Editing a value traces it to OCR words and sends the correction to Lumen; rejected edits restore the old value.
- [x] Extraction is blocked while corrections are in flight.
- [x] A second document merges new keys; existing keys untouched unless conflicting; duplicates go to review.

**Evidence** `b84767d`, `13cc12e`, `12469f8`, `e804932`, `eb20b6d`, test `66b4f9b` · `client/components/record-builder.tsx`, `client/components/ocr-review.tsx`

### T-07 · Record management: conflicts, expiry, backup, delete
**PRD** ON-8, ON-9, ON-10, §13 "Burahin ang record ko" · **Status** Done
**Done when**
- [x] Conflict card shows both values with source and date, suggests the newer.
- [x] Past expiry date shows a warning.
- [x] Exported JSON re-imports to the same state.
- [x] Clear button wipes IndexedDB (local data only; Lumen uploads are not deletable — documented).

**Evidence** `187d9fd`, test `a8fcd65` · `client/components/my-record.tsx`

## Form filling — "Paki-fill"

### T-08 · Form intake: render pages, read AcroForm fields
**PRD** FF-1, FF-2, FF-3 · **Status** Done
**Done when**
- [x] Fillable PDFs use AcroForm text/checkbox fields directly.
- [x] Flat PDFs and images render pages 1–3 at ~2× via pdf.js; worker copied at install/build.

**Evidence** `c2a5b7c`, `f9a392e` · `client/lib/pdf.ts`, `client/scripts/pdf-worker.mjs`

### T-09 · Find blanks and clean labels
**PRD** FF-4, FF-5, §11 Gemini prompt · **Status** Done
**Done when**
- [x] `/api/detect-fields` returns label + box (0–1000) + type; invalid coordinates rejected.
- [x] Labels cleaned through Lumen OCR + AI (`/api/clean-labels`).
- [x] Detected layouts cached per blank file hash; filled values are never cached.

**Evidence** `938742c`, `aa91bf4`, `6d56618` · `client/app/api/detect-fields/route.ts`, `client/app/api/clean-labels/route.ts`

### T-10 · Map labels to record with 🟢/🟡/🔴 statuses
**PRD** FF-6, FF-7, FF-12 · **Status** Done
**Done when**
- [x] 🟢 exact record match · 🟡 inferred/computed/last-used · 🔴 missing.
- [x] Age, today's date and full name computed; invalid computed dates rejected.
- [x] One page per AI call; progress shows "Page n of m ✓".

**Evidence** `e2ef0a8`, `aa91bf4`, `eb20b6d` · `client/app/api/map-fields/route.ts`, `client/lib/fill.ts`

### T-11 · Preview, drag/resize, checkboxes, page navigation
**PRD** FF-8, FF-9, FF-10 · **Status** Done
**Done when**
- [x] Answers render inside their boxes on the page preview.
- [x] Drag/resize (react-rnd) updates the export positions.
- [x] Checkbox groups draw ✓ in the matching option.
- [x] Thumbnails navigate between pages.

**Evidence** `db83c64`, `09b6682` · `client/components/form-preview.tsx`, `client/components/form-workspace.tsx`

## Final check — "Silip Muna"

### T-12 · Final check and remembered answers
**PRD** FC-1 – FC-5 · **Status** Done
**Done when**
- [x] Only 🟡/🔴/⚠️ shown; 🟢 folded under "N fields filled from your record ✓".
- [x] 🟡 one-tap confirm turns 🟢; 🔴 answered by typing and saved to the record.
- [x] Form-specific answers return next time as 🟡 "Last time: … — same?", never 🟢.
- [x] "Where did this come from?" shows source document and scan date.

**Evidence** `aa05f18`, `33d5c1d` · `client/components/final-check.tsx`, `client/lib/fill.ts`

## Export

### T-13 · Export filled PDF with signature and photo
**PRD** EX-1, EX-2, EX-3, ON-11, ON-12 · **Status** Done
**Done when**
- [x] Downloaded PDF has the original page as background and answers at their boxes.
- [x] Drawn signature saved as transparent PNG and placed on the signature line.
- [x] Square photo saved locally and fitted to the photo box.

**Evidence** `21ab315`, `7549962`, test `a8fcd65` · `client/lib/export.ts`, `client/components/assets.tsx`

## Mascot and shell

### T-14 · Ate Fill mascot and voice
**PRD** MA-1 – MA-4, FC-3 (voice) · **Status** Done (manual device check pending, see T-20)
**Done when**
- [x] SVG mascot with animated mouth; speaks at welcome, 🔴 questions, finish; mute toggle.
- [x] Filipino voice if present, English fallback; speech support detected without breaking render.
- [x] Voice answers require confirmation before saving; typing always available.
- [x] "Ano 'to?" explains a field via `/api/ask`.

**Evidence** `4e34e71`, `e977c8d`, `bdb8c81`, `dae9bf2`, `938742c` · `client/components/mascot.tsx`, `client/components/voice-answer.tsx`

### T-15 · App shell and six screens
**PRD** §12 · **Status** Done
**Done when**
- [x] Home, Record builder, My record, Form upload, Final check, Done all reachable.
- [x] Layout fits mobile width (browser test).

**Evidence** `ee5d849`, `0471531`, `ef10cdc`, `6ebf698`, `33d5c1d`, `7777f1b`, `7bf42e3` · `client/components/pirma-app.tsx`
**Deviation** native accessible controls + CSS instead of shadcn/ui (INTEGRATION.md "Deferred scope").

### T-16 · Explicit sample demo and stage fallbacks
**PRD** §13 sample documents, §14 fallbacks · **Status** Done
**Done when**
- [x] Sample ID and birth certificate watermarked "SAMPLE — NOT VALID".
- [x] Sample mode is labeled, makes no provider calls, and never silently replaces a failed live upload.
- [x] Form 1 asks 2 questions; Form 2 fills 12/12 with zero questions.

**Evidence** `5f96bdb` · `client/lib/demo.ts` · README "Sample demo"

### T-17 · Verification harness
**PRD** §17 success criteria · **Status** Done
**Done when**
- [x] `npm test` (9 unit), `npm run test:e2e` (4 Chromium), lint, `tsc --noEmit`, build all pass.
- [x] Browser tests cover two-form learning, PDF downloads, mobile uploads, invalid uploads, value edits, voice confirmation.

**Evidence** `94c4707`, `a8fcd65`, `52648ab`, `66b4f9b`, `dae9bf2`, `d63a090` · `client/tests/`

## Remaining work

### T-18 · Configure Lumen AI instance and Gemini key
**PRD** §11 instance instructions, §18 Q1 · **Status** Blocked — provider configuration
**Why blocked** The available `PLP-Hackathon-Blank` instance refuses extraction prompts
("outside what this assistant covers"). An API key cannot change instance instructions.
**Done when**
- [ ] An instance named `Pirma Lang Extractor` (or `LUMEN_AI_INSTANCE_ID` set) runs the PRD §11 instructions.
- [ ] `/api/extract-record` on the sample ID returns schema-valid JSON from Lumen, not a fallback.
- [ ] `GEMINI_API_KEY` set; `/api/detect-fields` returns boxes for a flat sample form.

**Owner** human (Organization Portal access) · **Evidence** INTEGRATION.md "Required to finish live validation" 1–2

### T-19 · Deploy to Vercel within payload limits
**PRD** §5 "deployed on Vercel", §10 hosting · **Status** Partial
**Done** Gateway rejections explained in the UI; README documents root `client` and the 4.5 MB body limit (`b4e57d6`).
**Done when**
- [ ] Vercel project with root `client` and server env vars; deployed URL loads.
- [ ] Demo uploads and rendered page PNGs stay under 4.5 MB on the deployed host.
- [ ] Decision recorded: accept the 4.5 MB demo cap, or add direct upload for the full 10 MB.

### T-20 · Live acceptance and official-form rehearsal
**PRD** §14 demo script, §15 Gate 3, §17 · **Status** Blocked by T-18, T-19
**Done when**
- [ ] Full path (onboard 2 docs → OCR correction → SSS E-1 → Pag-IBIG → downloads) runs twice on the deployed host without touching code.
- [ ] Onboarding <30 s; Form 1 ≥80% 🟢 with ≤3 questions; Form 2 100% 🟢.
- [ ] Lumen OCR, AI Chat and the correction API each called during the run.
- [ ] Microphone and Filipino TTS checked on the demo laptop.

### T-21 · Character-box fields
**PRD** FF-11 (P2) · **Status** Open
**Done when**
- [ ] A field with N boxes draws one letter per box, evenly spaced, in preview and export.

### T-22 · PNG page export
**PRD** EX-4 (P2) · **Status** Open
**Done when**
- [ ] One click downloads a PNG per filled page matching the PDF preview.

### T-23 · Pitch, partner, backup video
**PRD** §5 SDG/partner bonuses, §14, §15 Person D · **Status** Out of repo — team/event work.

---

## Documentation-driven workflow

How the docs were used to drive AI execution, in order:

1. **PRD.md** — the requirement IDs (ON-, FF-, FC-, EX-, MA-) gave each change a stable name and a P0/P1/P2 cut order.
2. **lumen-docs/** — provider contracts (auth headers, envelopes, 4,000-char / 25 s limits) fed straight into T-03 and T-04 instead of guessed APIs.
3. **BUILD.md** — delivery sequence and the rule "one related task per commit, ≤100 source lines", which is why each ticket maps to small, reviewable commits.
4. **INTEGRATION.md** — evidence log: what was verified live, what diverged from the docs (real `data.Items[]` page shape, missing page text), and what is blocked.
5. **TICKETS.md** (this file) — closes the loop: every PRD ID → ticket → commit → test, and the remaining work as checkable criteria an agent can pick up.

Coverage: all PRD P0 and P1 requirements traced to commits; P2 ON-12, EX-3, MA-4 shipped; P2 FF-11 and EX-4 open.
