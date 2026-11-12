# Lumen integration verification

Reference: [sandbox OCR explorer](https://sandbox.docs.lumensuite.io/explorer/ocr),
its published `/specs/ocr-api.md`, `/specs/ocr-openapi.yaml`, and `/specs/ai-chat-api.md`.
Verified during implementation on November 13, 2026 (Asia/Manila).

## Confirmed contract

- Staging origin: `https://api.staging.nonlive.lumen.bayanichain.tech`.
- Auth headers: `lumen-api-key` and `lumen-api-secret`; credentials stay server-side.
- OCR JSON has a `{ data, requestId }` envelope. Chat JSON does not.
- OCR uploads use raw bytes and a percent-encoded `X-Lumen-Document-Name`.
- Actual pages response: `data.Items[]`, `PageNumber`, `Words[].text` and
  `Words[].box` with normalized `x/y/w/h`. No top-level page text was returned;
  the adapter reconstructs it from words. Missing WordIndex uses its array index.
- Word coordinates were present with `IncludeWords=true` on the sample PDF.
- Chat session creation returns `Session.id`; a message returns `Answer.answer`.
- Chat message limit is 4,000 characters; backend model timeout is 25 seconds.

## Live smoke checks

Using only a generated PDF watermarked `SAMPLE - NOT VALID`:

- Upload accepted, transitioned to `READY`, one page read.
- Pages and word coordinates loaded successfully.
- Correction endpoint accepted the sample word and returned confidence
  `{ measured: false, reason: "human_supplied" }`.
- Instance listing and chat session creation worked.
- The available `PLP-Hackathon-Blank` instance answered extraction prompts with
  `That question is outside what this assistant covers.` Both a minimal JSON
  request and the complete PRD extraction instructions produced that reply.
  This is a provider configuration blocker, not a successful extraction.

Those smoke calls used the environment's HTTP proxy. Native direct Node fetch
initially timed out; the application now honors HTTP(S)_PROXY through Undici.
No upload IDs, chat transcripts, or credentials are committed.

## Required to finish live validation

1. In the Organization Portal, configure an AI instance with the PRD extraction
   instructions and allow JSON extraction, mapping, label cleaning, and explanations.
   Set `LUMEN_AI_INSTANCE_ID`, or name it `Pirma Lang Extractor` for discovery.
   The known active hackathon blank instance is a discovery fallback.
2. Set `GEMINI_API_KEY` and, if needed, an enabled `GEMINI_MODEL`.
3. Run onboarding, OCR correction, a flat form, final check, and PDF download twice.
4. Rehearse against actual SSS/Pag-IBIG demo forms. The bundled practice forms
   do not establish accuracy on those official layouts.
5. Deploy with Vercel root `client` and server environment variables, then rehearse
   on the deployed hostname. Hosting is not provisioned by this checkout.

## Verified local workflow

The explicit sample path builds a ten-value record, persists through reload,
asks for two personal facts on the first form, remembers both, and fills all twelve
fields on the second sample form with no questions. PDFs from both runs open.
Unit tests cover provenance, merge conflicts, import/export structure, invalid
coordinates, upload limits, computed dates, and PDF export. Browser tests cover
sample learning, downloads, mobile fit, invalid uploads, and extracted-value edits.

## Deferred scope

P1 voice recognition, page thumbnail navigation, and a fully rehearsed official-form
live demo remain. Page buttons support navigation; speech output is optional.
P2 character-box layout and PNG page export are not implemented.
The UI uses native accessible controls and CSS instead of adding shadcn/ui.
The pitch, partner validation, backup video, and deployment require team/event work.
