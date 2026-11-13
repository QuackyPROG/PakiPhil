# T-18 · Configure Lumen AI instance and vision key

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| **Blocked**: needs a human with Organization Portal access | P0 | §11 instance instructions, §18 Q1 | — |

## Goal
Live extraction and mapping are answered by **Lumen AI** (not a fallback), and flat-form detection has a working vision key, so the demo visibly uses both Lumen tools (PRD §5 and §17).

## Context
The only instance available, `PLP-Hackathon-Blank`, refuses every extraction prompt with "That question is outside what this assistant covers." An API key cannot change an instance's system instructions. Only the portal can. The code already discovers an instance named `Pirma Lang Extractor` automatically (T-04).

## Steps
1. **Human:** in the Lumen Organization Portal, create an AI Chat instance named `Pirma Lang Extractor`. Paste the instance instructions from PRD §11 and widen them to allow JSON extraction, label mapping, label cleaning and field explanations.
2. **Human:** put the instance id in `client/.env.local` as `LUMEN_AI_INSTANCE_ID` (optional; discovery by name also works).
3. **Human:** set `GEMINI_API_KEY` (and `GEMINI_MODEL` if the default `gemini-2.5-flash` is not enabled for the key). `OPENROUTER_API_KEY` is the free alternative.
4. **Agent:** run the checks under Verify and record the results in `docs/INTEGRATION.md` under "Live smoke checks", without ids, transcripts or keys.

## Done when
- [ ] `/api/extract-record` on the sample ID's OCR text returns schema-valid fields with `source: "Lumen AI"`.
- [ ] `/api/map-fields` returns mappings from Lumen AI.
- [ ] `/api/detect-fields` returns boxes for a page of the sample flat form.
- [ ] INTEGRATION.md is updated and the blocker line is removed.

## Verify
With `npm run dev` running, onboard with the downloadable sample ID (not "Try a sample ID", which is offline). The server log should show `[ai] answered by Lumen AI`. Then upload a flat form and confirm boxes appear.

## Gotchas
- Never commit `.env.local` or the root `.env`. Both are untracked; consider adding them to the root `.gitignore`.
- Each OCR GET costs a credit. Budget a full rehearsal (PRD §11 credits) before testing repeatedly.

## Evidence
None yet. The blocker is recorded in INTEGRATION.md "Required to finish live validation" 1–2.
