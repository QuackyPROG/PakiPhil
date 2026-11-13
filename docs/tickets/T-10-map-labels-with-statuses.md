# T-10 · Map labels to record with 🟢/🟡/🔴 statuses

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | FF-6, FF-7, FF-12 | T-01, T-04, T-09 |

## Goal
Each detected label is matched to a record key and gets a value and a status that tells the user how much to trust it.

## Contract
`POST /api/map-fields`
- In: `{ labels (≤12), recordKeys (≤100), formSpecificKeys (≤100) }`.
- Out: `{ mappings: { label, recordKey?, status, reason? }[] }`, same length and order as `labels`.

Status rules, **enforced server-side after the AI answers:**
| Case | Status |
|---|---|
| Unambiguous direct match | 🟢 green |
| `computed.*` or `formSpecific.*` key | always 🟡 yellow |
| Key not in the allowed list (invented by the AI) | key removed, 🔴 red |
| No value in the record | 🔴 red (set in `mapPage`) |
| Checkbox | 🟡 yellow, never auto-ticked |

Computed keys (`computed()` in `lib/record.ts`):
- `computed.today`: Asia/Manila date
- `computed.fullName`: name parts joined
- `computed.age`: only from a valid `YYYY-MM-DD` birth date, 0–129

Batching: `mapPage` sends 8 labels per call and handles one page at a time. Progress shows "Page n of m ✓".

## Files
- `client/app/api/map-fields/route.ts`
- `client/lib/fill.ts`: `mapPage`, `analyzeForm`
- `client/lib/record.ts`: `computed`

## Done when
- [x] Statuses follow the table above, whatever the AI says.
- [x] Remembered answers come back yellow with the reason "Last time: X — same?".
- [x] An invalid calendar date never produces an age.
- [x] Each AI call stays under 4,000 characters.

## Verify
```bash
cd client && npm test
```
Unit tests "invalid calendar dates never produce a computed age" and "computed full name never mutates original values". Browser test: the second sample form shows 12/12 green.

## Gotchas
- Never trust the AI's status for `computed` or `formSpecific` keys. The PRD requires these to be 🟡 so the user confirms them (FC-4).
- If the AI drops a label (mapping count ≠ label count), the route fails with "Retry" instead of guessing an alignment.

## Evidence
`e2ef0a8` route · `aa91bf4` page-by-page flow · `eb20b6d` computed-date validation
