# T-11 · Preview, drag/resize, checkboxes, page navigation

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 / P1 | FF-8, FF-9, FF-10 | T-08, T-10 |

## Goal
The user sees each answer drawn on the form page where it will print. Answers that landed in the wrong place can be dragged or resized, and the user can move between pages.

## Contract
- `FormPreview` overlays each field on the page image at `box` (0–1000 normalized → percentages).
- Drag and resize use `react-rnd` and write the new `box` back through `onChange(field)`. Export (T-13) reads the same `box`, so preview and PDF stay in sync.
- Checkbox fields render ✓ when `value === "true"`.
- Page thumbnails in `form-workspace.tsx` switch the active page, and a fully green page shows ✓.

## Files
- `client/components/form-preview.tsx`
- `client/components/form-workspace.tsx`: thumbnails and page state

## Done when
- [x] Answers render inside their boxes at a readable size.
- [x] After a drag or resize, the downloaded PDF shows the answer in the new place.
- [x] Checked options show ✓ in preview and export.
- [x] Multi-page forms navigate by thumbnail.

## Verify
Run the sample employment form, drag one answer, and download. The PDF matches the preview.

## Gotchas
- The box order is `[ymin, xmin, ymax, xmax]`, which is y-first. Mixing it up with x-first rects (as used by pdf.js and pdf-lib) is the most common bug here.

## Evidence
`db83c64` preview and drag · `09b6682` thumbnails
