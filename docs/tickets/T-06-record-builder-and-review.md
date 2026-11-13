# T-06 · Record builder, review and OCR correction

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | ON-5, ON-7, §14 step 2 | T-01, T-03, T-05 |

## Goal
The user scans a document, sees each extracted value, fixes any OCR misread (which also sends a correction to Lumen), and saves. Scanning a second document adds to the record without clobbering it.

## Context
This is the demo's "fix one OCR misread live" moment (PRD §14). It is the most visible use of the Lumen review API.

## Contract
- Flow: upload → `pollOcr` → `/api/extract-record` per page → review list → confirm → `mergeRecord` → `saveRecord`.
- Editing a value maps it back to its OCR words and POSTs `/api/ocr/[id]/correct` for each changed word.
- If Lumen rejects a correction, the previous value is restored.
- Extraction is disabled while corrections are in flight.
- A key with two different values in one extraction goes to conflict review (T-07).

## Files
- `client/components/record-builder.tsx`: the whole onboarding flow
- `client/components/ocr-review.tsx`: word-level correction UI
- `client/lib/record.ts`: `mergeRecord`

## Done when
- [x] Each extracted value can be confirmed or edited before save.
- [x] An edit sends a traced word correction; a rejected edit restores the old value.
- [x] Extract cannot run during an in-flight correction.
- [x] A second document merges new keys and leaves existing ones untouched unless they conflict.
- [x] An empty edit is rejected.

## Verify
```bash
cd client && npm run test:e2e
```
Browser test "edited extracted sample values are saved and empty edits are rejected". Unit test "repeated fields within one extraction also require conflict review".

## Gotchas
- Corrections must keep the provider's word order and index. A bug there was fixed in `b39da03`.
- A race between correction and extraction produced stale values. That was fixed in `e804932` by blocking extraction.

## Evidence
`13cc12e` builder · `b84767d` OCR review · `12469f8` traced corrections · `e804932` race fix · `eb20b6d` duplicate values · `66b4f9b` tests
