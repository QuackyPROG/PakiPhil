# T-20 · Live acceptance and official-form rehearsal

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| **Blocked** by T-18, T-19 | P0 | §14 demo script, §15 Gate 3, §17 | T-18, T-19 |

## Goal
The 90-second demo runs twice in a row on the deployed URL against the real SSS E-1 and Pag-IBIG forms and meets every PRD §17 number.

## Steps
1. Download the official SSS E-1 and Pag-IBIG forms. Record whether each is fillable or flat (PRD §18 Q3).
2. Run each once to warm the layout cache (T-09). Fix any badly placed boxes with drag/resize. Note which fields needed manual fixing.
3. Run the PRD §14 script end to end: watermarked sample ID + PSA birth certificate → one live OCR correction → SSS E-1 → Pag-IBIG → signature → both downloads.
4. Repeat step 3 without touching code (Gate 3).
5. On the demo laptop, check a Filipino or English TTS voice and the microphone (T-14).
6. Record the timings and counts below in INTEGRATION.md.

## Done when
- [ ] Onboarding from 2 documents takes under 30 s.
- [ ] Form 1: at least 80% of fields 🟢 automatically and at most 3 questions.
- [ ] Form 2: 100% 🟢, zero questions.
- [ ] Both PDFs open and look ready to sign.
- [ ] Lumen OCR, Lumen AI Chat and the correction API each called during the run (check server logs).
- [ ] Two consecutive clean runs.
- [ ] Voice and TTS checked by hand on the demo device.

## Verify
Stopwatch, server logs (`[ai] answered by …`), and a screen recording, which doubles as the PRD §15 backup video.

## Gotchas
- Use watermarked sample documents only. No real IDs on stage (PRD §13).
- If the stage network is flaky, switch to sample mode (T-16) and say so out loud. It is labeled, not hidden.

## Evidence
None yet.
