<p align="center">
  <img src="client/public/mascot/Happy.png" alt="Phil, the PaPhil mascot" width="180" />
</p>

<h1 align="center">PaPhil</h1>

<p align="center"><b>"Si Phil na bahala sa form. Pirma ka na lang."</b></p>

<p align="center">
Scan your IDs once. Every form after that fills itself.<br />
All you do is sign.
</p>

## Showcase

<p align="center">
  <img src="docs/showcase/PaPhil%20Demo.gif" alt="PaPhil Demo" width="720" />
</p>

<p align="center"><a href="docs/showcase/PaPhil%20Demo.mp4?raw=true">Download the PaPhil Demo with sound (MP4)</a></p>

## The pain

Every Filipino knows this line: name, birthday, address, mother's maiden name, TIN, SSS number. Again. And again. On a different form, at a different window, in a different queue.

SSS. Pag IBIG. PhilHealth. NBI. Barangay clearance. Job applications. School enrollment. A fresh graduate chasing employment requirements can fill out the same details more than ten times in a single week.

And it costs more than time:

* **People pay to have forms filled.** "Pa fill up" stalls outside government offices and internet cafes exist because forms are confusing, the print is small, and nobody wants to get it wrong.
* **Seniors depend on someone else.** A lola with a pension form waits for a grandchild to come home and do it for her.
* **One mistake means another trip.** A wrong digit in an ID number or a missing field gets the form rejected. Back to the end of the line.
* **Help desks drown.** PESO and barangay staff spend their day writing the same fields for walk in after walk in.

The information already exists. It is printed on the IDs in your wallet. You should never have to write it by hand twice.

## The fix

PaPhil reads your documents once, builds one personal record, and uses it to fill any form you hand it.

1. **Scan once.** Upload a photo or PDF of your ID or birth certificate. Lumen OCR reads it and Lumen AI turns it into a clean personal record.
2. **Drop in any blank form.** Fillable PDF, flat PDF, or a phone photo of a paper form. PaPhil finds every blank and figures out what goes where.
3. **Review only what matters.** Fields are marked green (sure), yellow (check this), or red (missing). You never reread the whole form, just the few spots PaPhil is unsure about.
4. **Sign and go.** Download a filled PDF, ready for your signature.

The second form is where it clicks: everything you answered before is remembered, so a new form can come back fully filled with zero questions.

## Meet Phil

Phil is your guide through the whole process. Phil explains what a confusing field means, asks for anything missing in plain language, and can read prompts out loud for people who struggle with small print. Filling a government form should feel like asking a patient friend for help, not like taking an exam.

## Who it is for

* **The fresh graduate** finishing five or more pre employment forms in one week.
* **The senior citizen** who finds long forms and tiny boxes hard to deal with alone.
* **The help desk worker** at a PESO or barangay office assisting dozens of residents a day.

## Why it can be trusted

* **Your data stays on your device.** Your personal record lives in your own browser. There are no accounts, no server database, and nothing is submitted to any government system for you.
* **You stay in control.** Every value PaPhil extracts can be reviewed and corrected before it is ever used, and corrections are sent back to improve OCR.
* **Delete anytime.** Clearing your record wipes the personal data stored on that device.

What leaves the browser: uploaded documents go to Lumen OCR, the extracted text goes to Lumen AI (or Gemini as a clearly labeled fallback), and blank form images go to Gemini to locate the fields. Use sample documents for public demos.

## What it can do today

* Upload PDF, JPG, PNG, or WebP files by click or drag and drop (up to 10 MB).
* Lumen OCR with live progress, retries, and word level corrections.
* Lumen AI record extraction and form label mapping, validated with Zod.
* Fillable PDF field detection, plus AI box detection for flat PDFs and photos.
* Green, yellow, and red review with remembered answers and computed fields like age, full name, and today's date.
* Page preview with drag and resize positioning, signature, square photo, and PDF export.
* Local record with source history, conflict review, and JSON import and export.
* Phil illustrations, optional speech output, and field explanations on a responsive layout.

## Try the demo in two minutes

No API keys needed. Sample mode is clearly labeled and makes no provider calls.

1. Choose **Gawin ang record ko**, then **Try a sample ID**, then **Extract**, then **Confirm and save**.
2. Choose **Paki fill**, then **Try sample employment form**. Answer Birth place and Occupation, confirm both, and download the PDF.
3. Choose **Fill another form**, then **Try sample membership form**. All 12 fields come straight from the saved record. Zero questions.

The sample templates are watermarked practice documents, not official SSS or Pag IBIG forms. Sample ID and birth certificate files can be downloaded from onboarding for live OCR tests.

## Built with

Next.js, React, Tailwind CSS, Lumen OCR, Lumen AI, Gemini, pdf.js, pdf lib, IndexedDB, Zod, and GSAP. Built for OVERCLOCK 2026 (PLP CCS), Lumen AI challenge, with alignment to UN SDG 8, SDG 10, and SDG 16.6.

More detail lives in [the product requirements](docs/PRD.md) and [the integration notes](docs/INTEGRATION.md).

## Installation

The app lives in `client/`. Next.js server routes handle all provider calls, so there is no separate backend to run.

```bash
cd client
npm ci
cp .env.example .env.local
npm run dev
```

Fill in your keys in `client/.env.local`:

* `LUMEN_API_KEY`, `LUMEN_API_SECRET`, `LUMEN_BASE_URL`, `LUMEN_AI_INSTANCE_ID` for OCR and record extraction
* `GEMINI_API_KEY`, `GEMINI_MODEL` for box detection on flat forms
* `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` as an optional free vision fallback

Never commit credentials, and never expose provider keys with a `NEXT_PUBLIC_` prefix.

### Checks

```bash
cd client
npm test
npm run lint
npm run build
```

End to end tests run against a started build:

```bash
npx playwright install chromium
npm run test:e2e
```

### Deploy

Import the repository into Vercel, set the root directory to `client`, keep the Next.js preset, and add the variables from `client/.env.example`. Note that Vercel Functions cap request bodies at 4.5 MB, so keep uploads below that when hosted there. The full 10 MB limit works when self hosted.
