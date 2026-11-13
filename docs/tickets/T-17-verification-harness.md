# T-17 · Verification harness

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | §17 success criteria, §15 Gate 3 | — |

## Goal
One set of commands tells an agent whether a change broke the core path, before anyone opens a browser.

## Contract
| Command (in `client/`) | What it proves |
|---|---|
| `npm test` | 9 unit tests: record merge and history, round trip, box validation, upload limits, computed name and age, OCR index normalization, PDF export |
| `npm run test:e2e` | 4 Chromium tests: two-form learning and downloads, mobile and upload errors, value edits, voice confirmation |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | types |
| `npm run build` | production build, including copying the pdf.js worker |

E2E needs a running server (`npm run start -- --hostname 127.0.0.1`) and `npx playwright install chromium` once.

## Files
- `client/tests/record.test.ts`, `client/tests/browser/demo.spec.ts`, `client/playwright.config.ts`

## Done when
- [x] All five commands pass on a clean checkout.
- [x] Every P0 path on the sample route is covered by at least one test.

## Verify
```bash
cd client && npm test && npm run lint && npx tsc --noEmit && npm run build
```

## Gotchas
- Browser tests use sample mode only, so they do not prove live provider behavior. That is T-20.

## Evidence
`94c4707` tooling · `a8fcd65` unit tests · `52648ab`, `66b4f9b`, `dae9bf2` browser tests · `d63a090` recorded run
