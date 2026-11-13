# T-15 · App shell and six screens

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | §12 screens | T-06, T-12 |

## Goal
A first-time user lands on Home and reaches every step of the core path (record → form → final check → done) without instructions, on a laptop or a phone.

## Contract
| PRD screen | Component |
|---|---|
| 1 Home: "Gawin ang record ko" / "Paki-fill ang form" | `paphil-app.tsx` |
| 2 Record builder | `record-builder.tsx` |
| 3 My record | `my-record.tsx` |
| 4 Form upload | `form-workspace.tsx` (upload state) |
| 5 Final check | `form-workspace.tsx` + `final-check.tsx` |
| 6 Done | celebration card in `form-workspace.tsx` |

## Files
- `client/app/page.tsx`, `client/app/layout.tsx`, `client/app/globals.css`
- `client/components/paphil-app.tsx`: navigation and record state

## Done when
- [x] All six screens are reachable from Home.
- [x] The home page fits a mobile viewport with no horizontal scroll.
- [x] The build needs no network fonts.

## Verify
```bash
cd client && npm run build && npm run test:e2e
```
Browser test "mobile home fits viewport…".

## Gotchas
- **Deviation from the PRD:** this uses native accessible controls with hand-written CSS, not shadcn/ui (PRD §10). It was chosen to keep commits small and avoid a component install. It is recorded in INTEGRATION.md "Deferred scope".
- Tailwind is compiled natively (`7bf42e3`). Build-time Google Fonts were removed because they failed offline (`7777f1b`).

## Evidence
`ee5d849`, `0471531`, `ef10cdc`, `6ebf698`, `33d5c1d`, `7777f1b`, `7bf42e3`
