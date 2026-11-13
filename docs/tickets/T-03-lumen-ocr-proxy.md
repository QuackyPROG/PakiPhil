# T-03 · Lumen OCR proxy: upload, poll, retry, correct

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | ON-2, §9 `/api/ocr*`, §11 OCR | T-02 |

## Goal
An uploaded ID becomes page text with word indices, and the user can send a corrected word back to Lumen's review API.

## Context
Lumen OCR is asynchronous: upload, poll status, then fetch pages. Each GET costs 1 credit, so polling must be bounded (PRD §11). The correction call is a judging bonus (PRD §5 "users check/correct the AI").

## Contract
| Route | In | Out |
|---|---|---|
| `POST /api/ocr` | raw bytes; `Content-Type`; `X-Lumen-Document-Name` (percent-encoded) | `{ documentId }` |
| `GET /api/ocr/[id]` | — | `{ status, pages?: { number, text, words: { text, index }[] }[], failureReason? }` |
| `POST /api/ocr/[id]/retry` | — | retries a failed read |
| `POST /api/ocr/[id]/correct` | `{ pageNumber, wordIndex, text }` | `{ ok: true }` |

Client side (`lib/api.ts`): `pollOcr` checks every 2.5 s for at most 60 s. It stops on `READY`/`PARTIAL`, and on `FAILED` it throws with a hint to use Retry.

## Files
- `client/app/api/ocr/route.ts`, `client/app/api/ocr/[id]/route.ts`, `.../retry/route.ts`, `.../correct/route.ts`
- `client/lib/ocr.ts`: `normalizePages`
- `client/lib/api.ts`: `uploadOcr`, `pollOcr`, `chunks`

## Done when
- [x] UI status moves Uploading → Reading → Done; `FAILED` shows Retry.
- [x] Polling stops after about 60 s with a resume/retry message.
- [x] Pages normalize from the live response shape, and page text is rebuilt from words.
- [x] A correction reaches Lumen and returns `{ ok: true }`.

## Verify
```bash
cd client && npm test
```
Unit test "normalize OCR words retains provider indices…". The live smoke test needs `LUMEN_API_KEY`/`SECRET`: upload the sample ID from onboarding, wait for Done, edit one word.

## Gotchas
- **The docs and the live API disagree.** The live pages body is `data.Items[]` with `PageNumber` and `Words[].text` and has no page-level text. `normalizePages` accepts `Pages | pages | Items` and both casings. Keep that tolerance.
- A missing `WordIndex` falls back to the array position, and corrections depend on that index being stable.
- Lumen cannot delete uploads (`DELETE` is refused). Never call it. PRD §13 discloses this.

## Evidence
`0e4147b` routes · `28fd0c9` polling UI · `b84767d` corrections UI · `b39da03` word-order fix · INTEGRATION.md "Confirmed contract"
