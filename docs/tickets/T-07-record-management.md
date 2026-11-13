# T-07 · Record management: conflicts, expiry, backup, delete

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P1 | ON-8, ON-9, ON-10, §12 screen 3, §13 delete | T-01, T-06 |

## Goal
On the "My record" screen the user can see every value and its source, settle disagreements between documents, notice expired IDs, back up or restore the record, and wipe it.

## Contract
- **Conflict card:** shows both values with source and date. `resolveConflict(record, conflict, useNew)` keeps the losing value in `history`.
- **Expiry:** an expiry date in the past (for example `core.ids.driversLicenseExpiry`) shows a warning.
- **Export:** downloads `paphil-record.json`. **Import:** `importRecord(file)` accepts files up to 10 MB and runs `recordSchema.parse`.
- **Delete:** `clearRecord()` removes the IndexedDB key (wording from PRD §13: "Burahin ang record ko").

## Files
- `client/components/my-record.tsx`
- `client/lib/record.ts`: `resolveConflict`
- `client/lib/storage.ts`: `exportRecord`, `importRecord`, `clearRecord`

## Done when
- [x] Conflicting scans show a card with both values and sources, and the chosen value is saved with the other kept in history.
- [x] A past expiry date shows a warning.
- [x] Export then import restores an identical record.
- [x] Delete empties the local record. The UI and README state that Lumen uploads are not deleted.

## Verify
```bash
cd client && npm test
```
Unit tests "merging keeps conflicting values…" and "record round trip…". Manual check: export, clear, import, and confirm the same values appear.

## Gotchas
- Import is a trust boundary. Always parse with `recordSchema` and never spread raw JSON into state.
- The PRD's "suggest the newer one" depends on `issuedAt`, which documents often lack. In that case `scannedAt` breaks the tie.

## Evidence
`187d9fd` · `a8fcd65` tests
