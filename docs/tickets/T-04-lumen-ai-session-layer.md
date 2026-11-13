# T-04 · Lumen AI session layer with fallback

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | §11 AI Chat, §16 risks | T-02 |

## Goal
Any route can ask for "JSON matching this schema" and gets validated data back, plus the name of the provider that answered, or a clear reason why every provider failed.

## Context
Lumen AI Chat is text only, with 4,000 characters per message and a 25 s backend timeout (`docs/lumen-docs/ai-chat-api.md`). PRD §11 asks for one session per task, a retry on 504, then a fallback to Gemini.

## Contract
- `aiJsonWithSource(prompt, zodSchema) → { data, source: "Lumen AI" | "Gemini" | "OpenRouter" }`; `aiJson` returns only `data`.
- Prompts over 4,000 characters are rejected with a 400 before any call.
- Order of attempts:
  1. Lumen AI. It retries only on a timeout or 504; a refusal or malformed reply breaks out immediately.
  2. Gemini, if `GEMINI_API_KEY` is set.
  3. OpenRouter free models, if `OPENROUTER_API_KEY` is set.
- Each answer goes through `parseJson`, which slices from the first `{` to the last `}`, then through `schema.parse`.
- The final error lists every provider's failure reason.
- `vision(prompt, imageB64)` (used by T-09) tries Gemini first, then OpenRouter.
- Instance discovery uses `LUMEN_AI_INSTANCE_ID`, else the instance named `Pirma Lang Extractor`, else an ACTIVE `PLP-Hackathon-Blank`.

## Files
- `client/lib/ai.ts`

## Done when
- [x] One session per call, messages under 4,000 characters, and a timeout on every provider.
- [x] Retry only on transient failures, then explicit fallbacks.
- [x] The responding provider is logged and exposed (`X-AI-Source` on extract-record).
- [x] An instance refusal surfaces as a configuration error, never as fake data.

## Verify
Run `npm run dev` and call `/api/extract-record` with no Gemini or OpenRouter key: the error should quote the Lumen refusal. Add a Gemini key and the response should report `source: "Gemini"`.

## Gotchas
- Chat JSON has **no** `{ data }` envelope, unlike OCR. Session id is `Session.id`, and the answer is `Answer.answer`.
- The hackathon instance replies "That question is outside what this assistant covers." That reply is the blocker tracked in T-18, not a code bug.
- Free OpenRouter "thinking" models can take about 50 s and return empty answers, so reasoning is off unless `OPENROUTER_REASONING=on`.

## Evidence
`0d38191` session layer · `b39da03` configuration-failure reporting · `6d56618` OpenRouter fallback and source reporting
