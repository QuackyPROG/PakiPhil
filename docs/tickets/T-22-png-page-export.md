# T-22 · PNG page export

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Open | P2 | EX-4 | T-13 |

## Goal
One click downloads a PNG of every filled page, for users who send forms by chat or need to print from a phone.

## Approach
1. Pull the box-to-pixel layout math out of `lib/export.ts` into a shared helper, so the PDF and PNG renderers draw the same positions and font sizes.
2. Add `exportPngs(pages, assets): Promise<Blob[]>`. For each page: draw `page.image` on a canvas at its native size, then draw text, checkmarks, signature and photo using the helper (canvas origin is top-left, so `y = ymin/1000·H`).
3. In `form-workspace.tsx`, add "Download pages as PNG" next to the PDF button, under the same "everything green" gate. Name the files `paphil-page-<n>.png`.

## Done when
- [ ] Each page downloads as a PNG with answers in the same places as the PDF (checked by eye on the sample employment form).
- [ ] The PDF and PNG paths share one layout helper, so changing font sizing changes both.
- [ ] The button is disabled under the same conditions as PDF export.
- [ ] Existing export tests still pass.

## Verify
```bash
cd client && npm test && npm run build
```
Manual check: export both formats from the sample form and compare.

## Gotchas
- Canvas `fillText` uses CSS fonts, while the PDF uses Helvetica metrics. Use a Helvetica/Arial stack and measure with `measureText` so the shrink-to-fit logic matches closely.
- Browsers may block several automatic downloads. Download one PNG at a time, or zip them if the form has more than one page.

## Evidence
None yet.
