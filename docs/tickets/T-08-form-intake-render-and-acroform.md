# T-08 · Form intake: render pages, read AcroForm fields

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 / P1 | FF-1, FF-2, FF-3, FF-12 | T-02 |

## Goal
Any blank form (PDF or photo) becomes 1–3 page images. A fillable PDF also brings its own field boxes, so it skips AI detection.

## Contract
- `renderFile(file) → FormPage[]` where `FormPage = { number, image: PNG data URL, width, height, fields: FormField[] }`.
- Images are drawn onto a white canvas, with the longest side at most 2,000 px and at most 24 MP.
- PDFs are limited to 3 pages and rendered with pdf.js at 2× scale.
- AcroForm detection uses pdf-lib `getForm().getFields()`. Widget annotations of type `Tx` (text) or `Btn` (checkbox) become `FormField`s, and their rects are converted to the 0–1000 `[ymin, xmin, ymax, xmax]` box.
- Push buttons, radio buttons and read-only fields are skipped.

## Files
- `client/lib/pdf.ts`
- `client/scripts/pdf-worker.mjs`: copies the pdf.js worker into `public/` on install, dev and build

## Done when
- [x] Fillable PDFs use their own fields, with labels from `alternativeText` or `fieldName`.
- [x] Flat PDFs and images render to PNG page images.
- [x] A PDF with more than 3 pages and an image over 24 MP are both refused with a clear message.

## Verify
`npm run dev`, then upload a fillable PDF and a photo of a form. Thumbnails appear (T-11), and the fillable one shows fields without a "finding blanks" step.

## Gotchas
- **The worker path is load-bearing:** `GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"`. If `public/pdf.worker.min.mjs` is missing, run `npm install` again.
- pdfjs-dist v6 changed `render()` to take `{ canvas, viewport }` (fixed in `f9a392e`). Check the installed version's API, not memory.
- The Next.js version here has breaking changes. Read `client/AGENTS.md` before touching app code.

## Evidence
`c2a5b7c` · `f9a392e` pdf.js alignment
