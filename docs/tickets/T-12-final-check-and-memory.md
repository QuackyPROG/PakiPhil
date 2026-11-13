# T-12 · Final check and remembered answers

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | FC-1, FC-2, FC-3 (typing), FC-4, FC-5 | T-10 |

## Goal
The user reviews only what is uncertain or missing, answers it once, and the app remembers the answer. The second form then needs zero questions (PRD goal 4).

## Contract
- **List:** non-green fields first. Green fields fold under "N fields filled from your record ✓" (a `<details>` element, collapsed).
- **Confirm:** the field turns 🟢 with reason "Confirmed by you". The download button stays disabled while any field is not green.
- **Remember** (on by default for text fields):
  - If the field has a real `recordKey` (not `computed.*`), the answer is written there.
  - Otherwise it goes to `formSpecific.<label_snake_case>`.
  - The previous value moves into `history`.
- **Source:** "Where did this come from?" shows `source.docName` and the scan date.
- Signature and photo fields offer "Leave blank" or "Use saved …" (T-13 assets).

## Files
- `client/components/final-check.tsx`
- `client/components/form-workspace.tsx`: blocks export until everything is green

## Done when
- [x] Only 🟡/🔴 fields are expanded, and green fields are collapsed by default.
- [x] Confirming a 🟡 field turns it 🟢. Typing a 🔴 answer fills it and saves it to the record.
- [x] Form-specific answers return as 🟡 "Last time: … — same?", never 🟢.
- [x] Every record-backed value shows its source.

## Verify
```bash
cd client && npm run test:e2e
```
Browser test "sample record survives reload, learns missing answers, and exports two forms": form 1 asks 2 questions and form 2 asks none.

## Gotchas
- PRD FC-1 mentions a ⚠️ status (for example an expired ID used on a form). The UI has no separate ⚠️ status; expiry warnings live on My record (T-07). Add one only if the demo needs it.
- `formSpecific` keys come from labels, so a rephrased label on another form becomes a new key. That is acceptable for the hackathon.

## Evidence
`aa05f18` review and memory · `33d5c1d` full workflow wiring
