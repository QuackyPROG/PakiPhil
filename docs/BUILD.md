# Pirma Lang implementation

Based on the November 13, 2026 hackathon PRD. Ship the core demo before optional polish.
Each completed related task gets its own commit; aim for at most 100 source lines per commit.
Dependency lockfile changes may exceed that limit.

## Delivery sequence

- [x] Validated personal record and form models; IndexedDB persistence.
- [x] Server-only Lumen OCR upload, polling, and correction adapters.
- [x] Validated extraction, mapping, and Gemini detection routes.
- [x] Record upload/review, conflicts, import/export, and deletion.
- [x] PDF/image rendering, form analysis, review, and PDF export.
- [x] Signature, answer positioning, mascot, and speech.
- [x] Explicit sample demo and watermarked sample documents.
- [x] Type check, lint, production build, unit tests, and sample browser workflow checks.
- [ ] Full live acceptance and official-form rehearsal (provider configuration required).

## External prerequisites

The supplied sandbox documentation confirmed authentication, the staging origin,
and session/message contracts. Live OCR upload/read/correction passed. The available
AI instance refuses extraction; Gemini credentials are absent. See INTEGRATION.md.
No production host has been provisioned. Sample mode is explicit and never silently
replaces a live upload. Full live acceptance remains blocked on provider configuration.

## Scope

No accounts, database, or government submission. Records stay in IndexedDB.
Blank forms go to Gemini; uploaded IDs go to Lumen. Lumen cannot delete uploaded
files according to the provided PRD. Clearing the local record does not delete those uploads.
P2 features and pitch/partner claims are deferred until the core demo is validated.
