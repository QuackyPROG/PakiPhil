# T-01 · Record schema and browser persistence

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | §8 data model, ON-6 | — |

## Goal
A user's personal record has one validated shape and survives a page reload, entirely in the browser.

## Context
PRD §4 non-goals rule out accounts and a server database, and PRD §13 says the record stays on the device. So the record is the single source of truth for every later ticket. Every write path must validate it, because AI output and imported JSON both reach it.

## Contract
- `recordSchema` (Zod) mirrors PRD §8 `Record`: `version: 1`, `core` (personal + `address` + `ids`), `extra`, `formSpecific`, `assets`.
- `FieldValue` = `{ value ≤2000 chars, source {docType, docName}, scannedAt ISO, issuedAt?, confidence 0–1?, history? }`.
- Record paths are dotted strings: `core.firstName`, `core.address.city`, `core.ids.sss`, `extra.<camel>`, `formSpecific.<snake>`.
- `putField(record, path, field)` is the **only** writer. It rejects unknown paths and re-parses the whole record.
- `entries(record)` flattens to `[path, FieldValue][]`; every reader uses it.
- `assets.signaturePng` / `photoPng` must be `data:image/png;base64,` URLs.
- IndexedDB key: `pirma-lang-record-v1` (via `idb-keyval`).

## Files
- `client/lib/models.ts`: schemas, `entries`, `putField`, `makeValue`, `emptyRecord`
- `client/lib/storage.ts`: `loadRecord`, `saveRecord`, `clearRecord`
- `client/lib/record.ts`: `mergeRecord`, `resolveConflict` (conflicts preserve `history`)

## Done when
- [x] Record and FormField schemas exist and reject invalid shapes (bad box order, out-of-range coordinates).
- [x] `saveRecord` → reload → `loadRecord` returns an equal record.
- [x] Merging a different value for an existing key yields a conflict, not an overwrite; resolving it appends the loser to `history`.

## Verify
```bash
cd client && npm test
```
Unit tests: "merging keeps conflicting values…", "record round trip preserves provenance…", "form coordinates must be ordered…". Browser test "sample record survives reload…".

## Gotchas
- The PRD names the type `Record`, which shadows TypeScript's built-in `Record<K,V>`. The code calls it `PersonalRecord`.
- Bumping the shape means bumping `version` and the IndexedDB key, or old saved records will fail `recordSchema.parse` on load.

## Evidence
`ff72b23` schemas · `85d43fb` dependencies · `b32cfd1` persistence and conflict-preserving merge · `a8fcd65`, `eb20b6d` tests
