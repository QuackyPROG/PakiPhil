# T-13 · Export filled PDF with signature and photo

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 / P1 / P2 | EX-1, EX-2, EX-3, ON-11, ON-12 | T-11, T-12 |

## Goal
One click downloads a PDF that looks hand-filled and is ready to sign, or is already signed with the saved signature and 1×1 photo.

## Contract
`exportPdf(pages, assets) → Blob (application/pdf)`
- One output page per `FormPage`, scaled so the height is at most 842 pt (A4). The rendered page PNG is the background.
- Box to PDF coordinates: `x = xmin/1000·W`, `y = (1000 − ymax)/1000·H`, because PDF's origin is bottom-left.
- **Text:** Helvetica, size `min(12, 0.7·h)`, shrunk to fit the width. It throws if the size would fall below 4 pt, or if a character can't be encoded.
- **Checkbox:** two-stroke ✓ when `value === "true"`.
- **Signature/photo:** the asset PNG is fitted inside the box, aspect preserved, unless the field value is `"skip"`.
- Assets are saved in `record.assets` by `components/assets.tsx`: a transparent signature canvas and a square-cropped photo.

## Files
- `client/lib/export.ts`
- `client/components/assets.tsx`
- `client/lib/storage.ts`: `download()`

## Done when
- [x] The downloaded PDF opens, with answers at their boxes over the original page.
- [x] The signature PNG is transparent and drawn on the signature line.
- [x] The photo is fitted to the photo box.
- [x] Unexportable text gives an actionable error, not a broken PDF.

## Verify
```bash
cd client && npm test
```
Unit test "export creates a readable page and rejects unexportable text". The browser test downloads both sample PDFs.

## Gotchas
- **Output is a flattened image PDF**, not the original filled in. The text is not selectable and AcroForm fields are not filled natively. That keeps flat and fillable forms on one path, but it is a known trade-off.
- Standard Helvetica (WinAnsi) covers ñ but not every Unicode character. Embedding a font with `@pdf-lib/fontkit` is the upgrade path.

## Evidence
`21ab315` export · `7549962` signature and photo · `a8fcd65` test
