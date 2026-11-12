# Pirma Lang

“Kami na bahala sa form. Pirma ka na lang.”

A hackathon web app for scanning documents once, reviewing a personal record,
and filling forms from that record. The runnable app lives in `client/`.
Next.js server routes replace the separate Python server described in the initial scaffold.

## Run

```sh
cd client
npm ci
cp .env.example .env.local
# Fill in server credentials in .env.local.
npm run dev
```

Keep existing `.env.local` files when setting up an already configured checkout.
`ai-server/.env` remains ignored; Next.js reads `client/.env.local`.
Never commit credentials or use a `NEXT_PUBLIC_` prefix for provider keys.

## What works

- PDF/JPG/PNG/WebP upload and drag/drop, with a 10 MB limit.
- Lumen OCR upload, 2.5-second polling, bounded wait, retry, and word corrections.
- Lumen AI extraction and label mapping; Zod validates results and extraction rejects changed values.
- IndexedDB record, source history, conflict review, JSON import/export, and local deletion.
- PDF/image rendering (1–3 pages), AcroForm text/checkbox detection, Gemini box detection,
  OCR-backed label cleaning, and blank-layout caching.
- Green/yellow/red review, remembered answers, computed age/full name/today,
  page preview, drag/resize positioning, PDF export, signature and square photo.
- Ate Fill illustration, optional speech output, field explanation, responsive layout.

## Sample demo

Choose **Gawin ang record ko → Try a sample ID → Extract → Confirm and save**.
Choose **Paki-fill → Try sample employment form**. Answer Birth place and Occupation,
confirm both, and download the PDF. Choose **Fill another form → Try sample membership form**:
all 12 fields come from the saved record, with zero questions.
Sample mode is explicitly labeled and makes no provider calls. The templates are
watermarked practice documents, not official SSS or Pag-IBIG forms.
Download the sample ID/birth certificate from onboarding for live OCR tests.

## Live services

See [integration verification](docs/INTEGRATION.md) for observed results and setup blockers.
Gemini is required for flat-form box detection. Lumen AI needs an instance whose
portal instructions permit record extraction and mapping. An API key alone cannot
change an instance's system instructions. Fallback to Gemini is explicit in the code;
no failed live upload is silently replaced by sample data.

## Checks

```sh
cd client
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run start -- --hostname 127.0.0.1
# In another terminal, after installing Chromium:
npx playwright install chromium
npm run test:e2e
```

## Deploy

Import the repository in Vercel, set the root directory to `client`, and use its
Next.js preset. Configure the variables from `client/.env.example` on the server.
The PDF.js worker is copied from the installed package during install/build.
No deployment, partner relationship, or government integration is provisioned here.

## Privacy and scope

Personal records and assets stay in this browser's IndexedDB. OCR documents are
uploaded to Lumen; OCR text is sent to Lumen AI (or Gemini on fallback). Blank
form images go to Gemini. Lumen does not expose upload deletion through this API.
Clearing the record deletes only local personal data. There are no accounts,
server database, identity verification, or government submissions.
Use sample documents for public demos. P1 voice input and an official-form demo rehearsal remain unverified; P2 character
boxes and PNG page export are deferred.
