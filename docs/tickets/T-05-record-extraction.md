# T-05 · Record extraction that never changes values

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | ON-3, ON-4 | T-03, T-04 |

## Goal
One OCR page becomes a list of record fields. Every value is copied exactly from the OCR text, and labels may be repaired.

## Context
The PRD's core trust rule (ON-4): the AI may fix **labels** ("FIRTH NAME" → firstName, "Apelyido" → lastName) but must never alter **values**. Doubts become 🟡 flags with a suggestion. This route enforces the rule in code instead of trusting the prompt.

## Contract
`POST /api/extract-record`
- In: `{ ocrText: string (1–2,800 chars, one page), pageNumber }`.
- Out: `{ fields: { key, value, pageNumber, wordIndices: [], suggestion?, reason? }[], source, dropped }`.
- `key` must be one of `recordPaths` (`core.*`, `core.address.*`, `core.ids.*`) or `extra.<alnum>`.
- **Verbatim gate:** a field survives only if `ocrText.includes(value)`. Anything else counts as `dropped`.
- Each field is validated on its own, so one malformed field does not sink the page.

## Files
- `client/app/api/extract-record/route.ts`: prompt and verbatim gate
- `client/lib/extraction.ts`: `recordPaths`, `extractionSchema`

## Done when
- [x] Output validates against the extraction schema; invalid JSON is retried through the T-04 chain.
- [x] Misread labels map to the right key.
- [x] A value that is not a verbatim OCR substring is dropped and counted, never saved.
- [x] The prompt treats document text as untrusted data (prompt-injection guard).

## Verify
With an AI provider configured, POST the sample ID's OCR text. Every returned `value` should appear in the input, and `dropped` should count any normalized values (for example a reformatted date).

## Gotchas
- The 2,800-character input cap leaves room for the prompt under Lumen's 4,000-character limit. Split long pages with `chunks()` before calling.
- The verbatim gate means dates stay in the document's own format. Normalizing to `YYYY-MM-DD` (PRD §11) belongs to computed fields (T-10), not extraction.

## Evidence
`a376012` route · `6d56618` per-field validation and source reporting
