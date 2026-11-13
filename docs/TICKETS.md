# PaPhil — Ticket Index

Tickets cut from [PRD.md](PRD.md), one file per ticket in [tickets/](tickets/), each traced to the commits that closed it.
Written retroactively on 2026-11-13 to document how the PRD drove AI-assisted development:
PRD → [BUILD.md](BUILD.md) delivery sequence → small commits → [INTEGRATION.md](INTEGRATION.md) evidence.

## For an agent picking up work

1. Pick the lowest-numbered ticket whose status is not `Done` and whose **Depends on** tickets are all `Done`.
2. Open its file and read **Goal**, **Contract** and **Gotchas** before any code. Then read `client/AGENTS.md`, because this Next.js version has breaking changes.
3. Work until every **Done when** box is ticked, proving each one with **Verify**.
4. Update the ticket's status, its **Evidence** commits, and the board below. Record live-service results in INTEGRATION.md.

Each ticket file follows [tickets/_TEMPLATE.md](tickets/_TEMPLATE.md). The PRD is the single source of truth for requirement wording; tickets add the contract, the done bar and the trace.
Status values: `Done` · `Partial` (some boxes unticked) · `Blocked` (waits on something outside the repo) · `Open` · `Out of repo`.

## Board

| # | Ticket | PRD | Pri | Status | Depends on |
|---|---|---|---|---|---|
| [T-01](tickets/T-01-record-schema-and-persistence.md) | Record schema and browser persistence | §8, ON-6 | P0 | Done | — |
| [T-02](tickets/T-02-server-transport-and-upload-limits.md) | Server-only provider transport and upload limits | ON-1, FF-1, §9 | P0 | Done | — |
| [T-03](tickets/T-03-lumen-ocr-proxy.md) | Lumen OCR proxy: upload, poll, retry, correct | ON-2, §11 | P0 | Done | T-02 |
| [T-04](tickets/T-04-lumen-ai-session-layer.md) | Lumen AI session layer with fallback | §11 | P0 | Done | T-02 |
| [T-05](tickets/T-05-record-extraction.md) | Record extraction that never changes values | ON-3, ON-4 | P0 | Done | T-03, T-04 |
| [T-06](tickets/T-06-record-builder-and-review.md) | Record builder, review and OCR correction | ON-5, ON-7 | P0 | Done | T-01, T-03, T-05 |
| [T-07](tickets/T-07-record-management.md) | Record management: conflicts, expiry, backup, delete | ON-8–10, §13 | P1 | Done | T-01, T-06 |
| [T-08](tickets/T-08-form-intake-render-and-acroform.md) | Form intake: render pages, read AcroForm fields | FF-1–3 | P0/P1 | Done | T-02 |
| [T-09](tickets/T-09-find-blanks-and-clean-labels.md) | Find blanks and clean labels | FF-4, FF-5 | P0 | Done | T-03, T-04, T-08 |
| [T-10](tickets/T-10-map-labels-with-statuses.md) | Map labels to record with 🟢/🟡/🔴 statuses | FF-6, FF-7, FF-12 | P0 | Done | T-01, T-04, T-09 |
| [T-11](tickets/T-11-preview-and-positioning.md) | Preview, drag/resize, checkboxes, page navigation | FF-8–10 | P0/P1 | Done | T-08, T-10 |
| [T-12](tickets/T-12-final-check-and-memory.md) | Final check and remembered answers | FC-1–5 | P0 | Done | T-10 |
| [T-13](tickets/T-13-export-pdf-signature-photo.md) | Export filled PDF with signature and photo | EX-1–3, ON-11, ON-12 | P0–P2 | Done | T-11, T-12 |
| [T-14](tickets/T-14-phil-mascot-and-voice.md) | Phil mascot and voice | MA-1–4, FC-3 | P1/P2 | Done | T-12 |
| [T-15](tickets/T-15-app-shell-and-screens.md) | App shell and six screens | §12 | P0 | Done | T-06, T-12 |
| [T-16](tickets/T-16-sample-demo-and-fallbacks.md) | Explicit sample demo and stage fallbacks | §13, §14 | P0 | Done | T-06, T-12 |
| [T-17](tickets/T-17-verification-harness.md) | Verification harness | §17 | P0 | Done | — |
| [T-18](tickets/T-18-configure-ai-instance-and-vision-key.md) | Configure Lumen AI instance and vision key | §11, §18 Q1 | P0 | **Blocked** (portal access) | — |
| [T-19](tickets/T-19-deploy-to-vercel.md) | Deploy to Vercel within payload limits | §5, §10 | P0 | **Partial** | T-18 |
| [T-20](tickets/T-20-live-acceptance-and-rehearsal.md) | Live acceptance and official-form rehearsal | §14, §15, §17 | P0 | **Blocked** | T-18, T-19 |
| [T-21](tickets/T-21-character-box-fields.md) | Character-box fields | FF-11 | P2 | Open | T-09, T-13 |
| [T-22](tickets/T-22-png-page-export.md) | PNG page export | EX-4 | P2 | Open | T-13 |
| [T-23](tickets/T-23-pitch-partner-backup-video.md) | Pitch, partner, backup video | §5, §14, §15 | — | Out of repo | T-20 |

**Next up:** T-18 needs a human first. T-19 step 3 (shrinking the page images sent for detection) and T-21/T-22 are agent work that can start now. PRD §15 cut order still applies: finish T-20 before spending time on P2.

## Milestone gates (PRD §15)

- **Gate 1**, ID photo → saved record: T-01…T-06. Passed.
- **Gate 2**, flat form → PDF with names placed: T-08…T-13. Passed.
- **Gate 3**, full path twice without touching code: passed in sample mode (T-16, T-17), still open for live services (T-20).

## Coverage

All PRD P0 and P1 requirements are traced to commits. P2 ON-12, EX-3 and MA-4 shipped; P2 FF-11 (T-21) and EX-4 (T-22) are open.
Known deviations from the PRD are recorded in their tickets: shadcn/ui replaced with native controls (T-15), no separate ⚠️ status in the final check (T-12), and export as a flattened image PDF (T-13).

## Documentation-driven workflow

How the docs drove AI execution, in order:

1. **PRD.md**: requirement IDs (ON-, FF-, FC-, EX-, MA-) gave every change a stable name and a P0/P1/P2 cut order.
2. **lumen-docs/**: provider contracts (auth headers, response envelopes, the 4,000-character and 25 s limits) went straight into T-03 and T-04 instead of guessed APIs.
3. **BUILD.md**: the delivery sequence and the rule of one related task per commit, at most 100 source lines. That is why each ticket maps to small, reviewable commits.
4. **INTEGRATION.md**: the evidence log of what was verified live, where the docs and the live API differed (the `data.Items[]` page shape, no page text), and what is blocked.
5. **TICKETS.md + tickets/**: closes the loop. Every PRD ID maps to a ticket, then to commits and tests, and the remaining work is written as checkable criteria an agent can pick up cold.
