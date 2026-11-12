# Pirma Lang implementation

Based on the November 13, 2026 hackathon PRD. Ship the core demo before optional polish.
Each completed related task gets its own commit; aim for at most 100 source lines per commit.
Dependency lockfile changes may exceed that limit.

## Delivery sequence

- [ ] Validated personal record and form models; IndexedDB persistence.
- [ ] Server-only Lumen OCR upload, polling, and correction adapters.
- [ ] Validated extraction, mapping, and Gemini detection routes.
- [ ] Record upload/review, conflicts, import/export, and deletion.
- [ ] PDF/image rendering, form analysis, review, and PDF export.
- [ ] Signature, answer positioning, mascot, and speech.
- [ ] Explicit sample demo and watermarked sample documents.
- [ ] Type check, lint, production build, and workflow checks.

## External prerequisites

Live Lumen authentication, base URLs, and AI Chat session/message contracts are not
specified in the PRD. Confirm against the event documentation before claiming live
integration. No production host or AI instance has been provisioned by this build.
Use sample documents for the demo. No upload is silently replaced by sample data.

## Scope

No accounts, database, or government submission. Records stay in IndexedDB.
Blank forms go to Gemini; uploaded IDs go to Lumen. Lumen cannot delete uploaded
files according to the provided PRD. Clearing the local record does not delete those uploads.
P2 features and pitch/partner claims are deferred until the core demo is validated.
