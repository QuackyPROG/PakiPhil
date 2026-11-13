# T-14 · Phil mascot and voice

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done (manual device check in T-20) | P1 / P2 | MA-1–MA-4, FC-3 (voice), §7.5 | T-12 |

## Goal
Phil greets the user, asks for missing fields out loud, celebrates at the end, and explains a confusing field on request. All of it is optional and degrades silently on browsers without speech support.

## Contract
- **Mascot:** an SVG with a CSS-animated mouth while speaking. A mute toggle is always visible.
- **Speaks at three moments only** (MA-2): onboarding welcome, asking for 🔴 fields ("Ano ang <label> mo?"), and the finish line ("Tapos na! N fields. Pirma ka na lang!").
- **Voice choice:** a Filipino voice if available, else English (`speechSynthesis.getVoices()`).
- **Voice answer:** `SpeechRecognition` fills the text input but does **not** confirm it. The user must press Confirm, so a misheard answer is never saved.
- **"Ano 'to?":** POSTs `/api/ask` `{ question }` → `{ answer }` through the T-04 chain.

## Files
- `client/components/mascot.tsx`
- `client/components/voice-answer.tsx`
- `client/app/api/ask/route.ts`

## Done when
- [x] Speech is detected without breaking render, and is hidden when unsupported.
- [x] Mute silences all speech.
- [x] A voice answer stays editable and requires confirmation.
- [x] "Ano 'to?" shows an explanation card.

## Verify
```bash
cd client && npm run test:e2e
```
Browser test "voice answers stay editable and require confirmation before learning". A real microphone and a Filipino voice must be checked by hand on the demo laptop (T-20).

## Gotchas
- Detecting speech support in a `useEffect` caused cascading re-renders. It is now detected lazily (`bdb8c81`).
- Chrome loads voices asynchronously, so `getVoices()` can be empty on first call.

## Evidence
`4e34e71` mascot · `e977c8d` voice answers · `bdb8c81` detection fix · `dae9bf2` confirmation test · `938742c` ask route
