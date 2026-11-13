# T-02 · Server-only provider transport and upload limits

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| Done | P0 | ON-1, FF-1, §9 "All API keys stay server-side" | — |

## Goal
Every provider call goes through a Next.js server route, so the browser never sees a key. Bad uploads are refused with a message a non-technical user understands.

## Context
PRD §9 makes server routes stateless proxies. The Lumen docs (`docs/lumen-docs/ocr-api.md` "Authentication") require two headers, `lumen-api-key` and `lumen-api-secret`. There is no OAuth flow.

## Contract
- `lumen(service: "ocr" | "ai_chat", path, init)` prefixes `LUMEN_BASE_URL` (default staging gateway), adds both auth headers, and applies a 30 s timeout. A non-2xx response throws `ApiError(status)`.
- `failure(error)` turns any thrown error into `{ error }` JSON with a safe status. Unexpected errors are logged and get a generic message, never a stack trace.
- `jsonBody(request, limit = 50 000)` returns 413 above the limit.
- Upload rules (`validateUpload`): non-empty, ≤10 MB, one of `application/pdf | image/jpeg | image/png | image/webp`.
- If `HTTP(S)_PROXY` is set, all server fetches go through it (undici `EnvHttpProxyAgent`).

## Files
- `client/lib/server.ts` (has `import "server-only"`)
- `client/lib/upload.ts`
- `client/components/upload.tsx`: picker and drag-and-drop
- `client/.env.example`: the full list of server variables

## Done when
- [x] Picker and drag-and-drop both accept the four types. Over 10 MB or a wrong type shows an actionable message.
- [x] No `NEXT_PUBLIC_` provider variable exists, and keys are absent from the browser bundle.
- [x] Missing keys produce a 503 that names the variable to set.
- [x] Requests succeed behind an HTTP proxy.

## Verify
```bash
cd client && npm test && npm run build
```
```bash
grep -rE "LUMEN_API|GEMINI_API|OPENROUTER_API" client/.next/static || echo "no keys in bundle"
```
Browser test "mobile home fits viewport and file type errors are actionable".

## Gotchas
- Native Node fetch timed out in the dev environment until proxy support was added (INTEGRATION.md "Live smoke checks").
- Vercel caps request bodies at 4.5 MB, below this app's 10 MB limit. That gap belongs to T-19.

## Evidence
`7e11807` transport and limits · `28fd0c9` upload UI · `4f90898` proxy · `b4e57d6` gateway rejection messages
