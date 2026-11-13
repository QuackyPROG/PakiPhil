# T-09 · Find blanks and clean labels

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | FF-4, FF-5, §11 Gemini prompt | T-03, T-04, T-08 |

## Goal
On a flat form page, every place a person must write is found as a correctly spelled label plus an answer box.

## Context
Lumen gives accurate text but no layout reasoning. A vision model gives boxes but sometimes misspells labels. So vision finds the boxes, and Lumen OCR text plus Lumen AI fix the label spelling (PRD §6 flow).

## Contract
`POST /api/detect-fields`
- In: `{ pageImageBase64 (PNG, no data: prefix, ≤14 MB), pageNumber 1–3 }`.
- Out: `{ fields: FormField[] }` with `id = p{page}-{i}`, `status: "red"`, and no values yet.
- Each checkbox option gets its own box. Instructions printed on the form are not fields.
- Retries once on invalid JSON or invalid boxes.

`POST /api/clean-labels`
- In: `{ labels (≤8 per batch), ocrText (≤1,600 chars) }`.
- Out: `{ labels }`, same order and length.

Cache: in `analyzeForm`, the detected layout is stored in IndexedDB under `pirma-form-layout-v1-<sha256 of file>`. Only the blank layout is cached, never filled values.

## Files
- `client/app/api/detect-fields/route.ts`
- `client/app/api/clean-labels/route.ts`
- `client/lib/fill.ts`: `analyzeForm` (orchestration and cache)
- `client/lib/ai.ts`: `vision()`

## Done when
- [x] Boxes are validated by `boxSchema`: ordered and inside 0–1000.
- [x] Labels are cleaned against OCR text, one bounded batch per call.
- [x] A second upload of the same blank form uses the cache ("Using cached blank-form layout…").

## Verify
Needs `GEMINI_API_KEY` or `OPENROUTER_API_KEY`. Upload a flat form twice. The first run shows "finding blanks", the second shows the cache message, and the boxes overlay sensibly in the preview.

## Gotchas
- Gemini's free tier has reduced limits in 2026 (PRD §10), and the cache is the mitigation. Pre-cache the demo forms before going on stage.
- Dense government forms produce off-target boxes. Drag/resize (T-11) is the escape hatch.
- The request body is a whole-page PNG, which can exceed Vercel's 4.5 MB limit (T-19).

## Evidence
`938742c` detection · `aa91bf4` label cleaning and caching · `6d56618` OpenRouter vision fallback
