# T-19 · Deploy to Vercel within payload limits

| Status | Priority | PRD | Depends on |
|---|---|---|---|
| **Partial** | P0 | §5 "deployed on Vercel", §10 hosting | T-18 (for a meaningful live check) |

## Goal
Judges can open a public HTTPS URL and run the demo path, with uploads that fit the host's limits.

## Context
Vercel Functions reject request bodies over **4.5 MB**. The app allows 10 MB uploads (ON-1), and `/api/detect-fields` sends a whole page PNG (up to 14 MB accepted). Gateway rejections already show a clear message (`b4e57d6`), but large files still fail on Vercel.

## Steps
1. **Human:** import the repo in Vercel, set the root directory to `client`, use the Next.js preset, and add the server variables from `client/.env.example` (never with a `NEXT_PUBLIC_` prefix).
2. **Agent:** confirm the deployed build serves `/pdf.worker.min.mjs` (copied by the prebuild script).
3. **Agent:** keep page images under 4.5 MB. In `lib/pdf.ts`, encode the detection image as JPEG or cap the render scale for `/api/detect-fields`, while keeping the PNG background for export. Measure the demo forms' request sizes.
4. **Decide and record** in INTEGRATION.md: either accept a 4.5 MB upload cap on Vercel (show the limit in the UI), or add direct-to-storage upload for the full 10 MB.

## Done when
- [x] Gateway 413/rejection responses show an actionable message.
- [x] README documents the root directory, environment variables and the 4.5 MB limit.
- [ ] A deployed URL loads Home and finishes the sample path.
- [ ] Both demo forms' detect-fields requests are under 4.5 MB (measured in DevTools).
- [ ] The upload-cap decision is recorded.

## Verify
On the deployed URL: run the sample path, then upload each demo form and check the request size in the Network tab.

## Gotchas
- The app stays stateless and needs no database. Do not add one to solve uploads; a signed direct upload is the smallest step.
- If step 3 switches the detection image to JPEG, `/api/detect-fields` validation and the `vision()` mime type (`image/png` in `lib/ai.ts`) must change with it.

## Evidence
`b4e57d6` rejection handling and README limits
