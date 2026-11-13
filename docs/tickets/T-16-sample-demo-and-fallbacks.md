# T-16 · Explicit sample demo and stage fallbacks

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | §13 sample documents, §14 fallbacks | T-06, T-12 |

## Goal
The full 90-second story runs with zero provider calls when the stage network fails, and it never pretends to be live.

## Contract
- **Sample record:** "Try a sample ID" builds a 10-value record.
- **Sample forms:**
  - "Try sample employment form": asks 2 questions (Birth place, Occupation).
  - "Try sample membership form": 12/12 green, 0 questions.
- A **SAMPLE DEMO** banner is shown whenever sample data is in use.
- Sample mode is user-chosen only. **A failed live upload is never silently replaced with sample data.**
- Downloadable sample ID and birth certificate are watermarked "SAMPLE — NOT VALID", for live OCR tests.
- The templates are practice forms, not official SSS or Pag-IBIG forms.

## Files
- `client/lib/demo.ts`

## Done when
- [x] The sample path completes with no network calls to Lumen, Gemini or OpenRouter.
- [x] The banner is visible whenever sample data is in use.
- [x] Form 2 needs zero questions after form 1.

## Verify
```bash
cd client && npm run test:e2e
```
The README "Sample demo" section is the manual script.

## Gotchas
- PRD §14 wants "pre-processed results cached for both forms". For the *official* forms, that means warming the T-09 layout cache on the demo laptop. Sample mode covers only the practice templates.

## Evidence
`5f96bdb` · `52648ab` two-form learning test
