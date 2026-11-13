# T-21 · Character-box fields

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Open | P2 | FF-11, §16 risk "character-box fields look messy" | T-09, T-13 |

## Goal
Fields printed as a row of single-letter boxes (common on SSS forms) get exactly one character per box, evenly spaced, in both preview and PDF.

## Context
Today a value is drawn as one string inside the whole box (`lib/export.ts`), so letters drift across the box borders. This is cut-order P2: build it only after T-20 passes.

## Approach
1. **Model:** add `cells?: number` (an integer from 2 to 40) to `formFieldSchema` in `lib/models.ts`. Optional, so cached layouts and saved records stay valid.
2. **Detection:** extend the `/api/detect-fields` prompt to return `cells` when the answer area is a row of letter boxes. Keep it optional in the output schema.
3. **Layout helper:** add a pure function such as `cellPositions(box, cells, value)` returning one `{ char, x, w }` per cell. The preview (`form-preview.tsx`) and export (`lib/export.ts`) both use it, so they cannot drift apart.
4. **Export:** when `cells` is set, draw each character centered in its cell, with the font size taken from the cell's width and height. Characters beyond `cells` are an error with a clear message, like the existing "does not fit" error.
5. **Manual override:** in final check or preview, let the user set or clear `cells` for a field, since detection will miss some.

## Done when
- [ ] `formFieldSchema` accepts an optional `cells`, and old layouts without it still parse.
- [ ] A unit test: `cellPositions([0,0,100,1000], 10, "ABC")` puts characters at the centers of cells 0–2.
- [ ] A unit test: exporting a 10-cell field with an 11-character value throws an actionable error.
- [ ] In preview and PDF, the sample SSS number on a celled field sits one digit per box.
- [ ] Existing tests still pass.

## Verify
```bash
cd client && npm test && npx tsc --noEmit
```
Manual check: a form with a celled SSS or TIN field, compared by eye in preview and PDF.

## Gotchas
- Bump the layout cache key (`pirma-form-layout-v1-` → `v2`) so cached layouts are re-detected with `cells`.
- Some ID numbers include dashes that the form prints between groups of boxes. Decide per field whether to strip separators before spreading characters.

## Evidence
None yet.
