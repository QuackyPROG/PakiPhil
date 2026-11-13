# Pirma Lang — Product Requirements (Hackathon Edition)

> **"Kami na bahala sa form. Pirma ka na lang."**
> Scan your IDs once. Every form after that fills itself. All you do is sign.

| | |
|---|---|
| **Event** | OVERCLOCK 2026 (PLP CCS) · Lumen AI challenge |
| **Status** | Draft v1 · 2026-11-13 |
| **Working name** | Pirma Lang (mascot: **Ate Fill**) |
| **Scope rule** | This is a hackathon build. Anything not needed for the 90-second demo is P1/P2 and gets cut first. |

---

## 1. One-liner

A web app that reads your IDs with **Lumen OCR**, turns them into one personal record with **Lumen AI**, then fills any blank form (PDF or photo) from that record and hands you a ready-to-sign PDF. You only review what the app isn't sure about.

## 2. Problem

- Filipinos write the same details (name, birthday, address, parents' names, ID numbers) on form after form: SSS, Pag-IBIG, PhilHealth, job applications, barangay papers, school forms.
- Many people pay internet cafés or fixers to "pa-fill up", or ask a relative to do it.
- Small mistakes (wrong ID number, a missing field, an old address) get forms rejected and mean another trip and another queue.

## 3. Target users

| Persona | Situation | What they need |
|---|---|---|
| **Juan, 22, fresh grad** | Completing pre-employment requirements: SSS, Pag-IBIG, PhilHealth, job application forms in one week | Fill 5+ forms fast without retyping |
| **Lola Nena, 67** | Struggles with small print and long forms; usually asks a grandchild | Someone to do it for her and talk her through what's missing |
| **Help desk staff (PESO / barangay)** | Assists dozens of walk-ins per day | Fill forms for residents quickly and correctly |

## 4. Goals and non-goals

**Goals (what the demo must prove)**
1. One-time onboarding: scanning 1–3 documents builds a correct personal record.
2. Any blank form (PDF or image) gets auto-filled from that record.
3. The user reviews only uncertain or missing fields, never all of them.
4. The app learns: the second form needs zero questions.
5. Both Lumen tools are used visibly (OCR + AI Chat), including the OCR review/correction step.

**Non-goals (explicitly out of scope today)**
- Submitting forms to any government system.
- Real identity verification or fraud detection.
- Handwritten forms or handwritten IDs.
- Accounts, login, server database, cross-device sync.
- Blockchain or wallet features.
- Native mobile app (it's a responsive web app; the demo runs on a laptop).

## 5. Judging alignment

| Requirement / bonus | How Pirma Lang meets it |
|---|---|
| Working web app | Next.js app deployed on Vercel |
| Uses Lumen OCR or AI Chat | Uses **both**: OCR reads IDs and forms; AI Chat extracts the record and maps form fields |
| Real problem, specific PH group | Job seekers and seniors filling government and employment forms |
| Bonus: UN SDG | **SDG 8** (decent work: faster pre-employment requirements), **SDG 10** (reduced inequalities: helps people who struggle with forms), **SDG 16.6** (more effective public services) |
| Bonus: real partner | **Pasig City PESO** (Public Employment Service Office) or a Pasig barangay help desk |
| Bonus: users check/correct the AI | Every extracted value is reviewable; corrections are sent to the **Lumen OCR review API**; 🟢/🟡/🔴 statuses |

## 6. Core user flow

```
ONBOARDING (once)
  Upload ID / document ─► Lumen OCR ─► Lumen AI → JSON record ─► User confirms ─► Saved in browser
        ▲                                                                              │
        └──────────── scan more documents anytime to add or update info ◄──────────────┘

EVERY FORM
  Upload blank form (PDF or image)
     ├─ Fillable PDF? ─► read field names (pdf-lib)
     └─ Flat PDF / photo ─► render page image (pdf.js) ─► find blanks (Gemini) + read labels (Lumen OCR)
                                     │
                                     ▼
              Lumen AI maps each field label → record key, assigns 🟢 / 🟡 / 🔴
                                     │
                                     ▼
      Final check: only 🟡 / 🔴 / ⚠️ shown · Ate Fill asks for 🔴 by voice · answers saved to record
                                     │
                                     ▼
          Export filled PDF (pdf-lib): answers + signature + 1×1 photo ─► Download
```

## 7. Functional requirements

Priority: **P0** = demo breaks without it · **P1** = strong for judging, build if time · **P2** = nice to have / roadmap.

### 7.1 Onboarding — "Ang Record Mo"

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| ON-1 | Upload an image (JPG/PNG/WebP) or PDF of an ID or document, max 10 MB | P0 | File picker and drag-and-drop both work; files over 10 MB show a clear error |
| ON-2 | Send the file to Lumen OCR and show progress while it reads | P0 | Status goes "Uploading → Reading → Done"; polling every 2–3 s; FAILED shows Retry |
| ON-3 | Lumen AI turns the OCR text into record fields (JSON) | P0 | Output validates against the record schema (Zod); invalid JSON is retried once |
| ON-4 | AI may fix misread **labels** but never auto-changes **values** | P0 | "FIRTH NAME" maps to firstName; a name or ID number the AI doubts is flagged 🟡 with a suggestion, not changed |
| ON-5 | Review screen: user confirms or edits each extracted value | P0 | Edits update the record; edits are also sent to the Lumen OCR correction endpoint |
| ON-6 | Save the record in the browser (IndexedDB) | P0 | Record survives page reload |
| ON-7 | Scan more documents later to add new info (e.g., mother's maiden name from a PSA birth certificate) | P0 | New keys are merged; existing keys untouched unless conflicting |
| ON-8 | Conflict card when two documents disagree | P1 | Shows both values with source and issue date, suggests the newer one, keeps the old one in history |
| ON-9 | Expired ID warning | P1 | If an expiry date is in the past: "Expired na ang license mo noong Hulyo 2026" |
| ON-10 | Export / import record as a JSON file | P1 | Downloaded JSON re-imports to the same state |
| ON-11 | Add an e-signature (draw with mouse or finger) | P1 | Saved as a transparent PNG in the browser |
| ON-12 | Upload a 1×1 photo | P2 | Saved in the browser, placed on forms with a photo box |

### 7.2 Form filling — "Paki-fill"

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FF-1 | Upload a blank form: PDF or image | P0 | Same limits as ON-1 |
| FF-2 | Detect fillable PDFs and read their field names | P1 | If AcroForm fields exist, use them directly (no box detection needed) |
| FF-3 | For flat PDFs, render each page to an image | P0 | pdf.js renders page 1–3 at ~2× scale |
| FF-4 | Find each field's label and answer box on the page | P0 | Gemini returns label + box (normalized 0–1000) + type (text / date / checkbox) |
| FF-5 | Read labels accurately with Lumen OCR and clean them with Lumen AI | P0 | Labels shown to the user are spelled correctly |
| FF-6 | Map each label to a record key and assign a status | P0 | 🟢 exact match from record · 🟡 inferred / computed / last-used value · 🔴 not in record |
| FF-7 | Computed fields | P1 | Age from birthDate; today's date; full name from parts |
| FF-8 | Preview the filled page with answers placed on top | P0 | Answers render inside their boxes at the right size |
| FF-9 | Drag or resize a misplaced answer | P1 | react-rnd handles; positions update the export |
| FF-10 | Checkbox fields (sex, civil status) | P1 | Draws "✓" in the matching option's box |
| FF-11 | Character-box fields (one letter per box, common on SSS forms) | P2 | Letters spaced evenly across the box count |
| FF-12 | Process one page at a time | P0 | Each Lumen AI call stays under 4,000 characters and 25 s; progress shows "Page 1 of 2 ✓" |

### 7.3 Final check — "Silip Muna"

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| FC-1 | Show only 🟡, 🔴 and ⚠️ fields; fold 🟢 under "28 fields filled from your record ✓" | P0 | Green fields are expandable but collapsed by default |
| FC-2 | 🟡 one-tap confirm, or edit | P0 | Confirm turns it 🟢 |
| FC-3 | 🔴 Ate Fill asks out loud; user answers by voice or typing | P0 (typing) / P1 (voice) | Answer fills the field and is saved to the record |
| FC-4 | Remember new answers for future forms | P0 | Form-specific answers (position applied for, amount) come back next time as 🟡 "Last time: Cashier — same?", never 🟢 |
| FC-5 | Show each value's source on tap ("from your PhilSys ID, scanned Nov 13") | P1 | Source shown in a tooltip or drawer |

### 7.4 Export

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| EX-1 | Export a filled PDF | P0 | Original page as background, answers drawn at their boxes, downloadable |
| EX-2 | Place signature PNG on signature line | P1 | Transparent background, above the form text |
| EX-3 | Place 1×1 photo in the photo box | P2 | Fitted to box |
| EX-4 | Export a PNG of each page | P2 | One click |

### 7.5 Mascot — Ate Fill

| ID | Requirement | Priority |
|---|---|---|
| MA-1 | Simple SVG character with a CSS-animated mouth while speaking | P1 |
| MA-2 | Speaks only at 3 moments: onboarding welcome, asking for 🔴 fields, finish celebration ("Tapos na! 31 fields, 0 tanong. Pirma ka na lang!") | P1 |
| MA-3 | Uses browser speech synthesis (Filipino voice if available, English fallback) with a mute toggle | P1 |
| MA-4 | "Ano 'to?" chat: ask Ate Fill what a field means (Lumen AI Chat) | P2 |

## 8. Data model

The record lives in IndexedDB and exports as JSON.

```ts
type Status = "green" | "yellow" | "red";

type FieldValue = {
  value: string;
  source: { docType: string; docName: string };   // e.g. "PhilSys ID", "philsys.jpg"
  scannedAt: string;                                // ISO date
  issuedAt?: string;                                // from the document, if present
  confidence?: number;                              // 0–1, from OCR/AI
  history?: { value: string; source: string; scannedAt: string }[];
};

type Record = {
  version: 1;
  core: {
    firstName?: FieldValue; middleName?: FieldValue; lastName?: FieldValue; suffix?: FieldValue;
    sex?: FieldValue; birthDate?: FieldValue; birthPlace?: FieldValue;
    civilStatus?: FieldValue; citizenship?: FieldValue;
    address?: { houseNo?: FieldValue; street?: FieldValue; barangay?: FieldValue;
                city?: FieldValue; province?: FieldValue; zip?: FieldValue };
    mobile?: FieldValue; email?: FieldValue;
    fatherName?: FieldValue; motherMaidenName?: FieldValue; spouseName?: FieldValue;
    ids?: { philsysPcn?: FieldValue; tin?: FieldValue; sss?: FieldValue;
            pagibigMid?: FieldValue; philhealthPin?: FieldValue;
            driversLicense?: FieldValue; driversLicenseExpiry?: FieldValue };
  };
  extra: Record<string, FieldValue>;          // anything new the AI or user adds
  formSpecific: Record<string, FieldValue>;   // last-used answers, always come back 🟡
  assets: { signaturePng?: string; photoPng?: string };  // data URLs
};
```

Detected form field (per page):

```ts
type FormField = {
  id: string;
  label: string;                       // cleaned by Lumen AI
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax], 0–1000
  type: "text" | "date" | "checkbox" | "signature" | "photo";
  options?: string[];                  // for checkbox groups
  recordKey?: string;                  // e.g. "core.lastName"
  value?: string;
  status: Status;
  reason?: string;                     // why yellow/red
};
```

## 9. Architecture

```
Browser (Next.js client)                         Next.js server routes (Vercel)            External
─────────────────────────────                    ──────────────────────────────             ────────────
Upload UI, review UI, mascot                      /api/ocr            ───────────────────►  Lumen OCR
pdf.js (PDF → page images)                        /api/ocr/[id]       ───────────────────►  Lumen OCR (poll + pages)
pdf-lib (fill / draw / export)                    /api/ocr/[id]/correct ─────────────────►  Lumen OCR review API
IndexedDB record (idb-keyval)                     /api/extract-record ───────────────────►  Lumen AI Chat
Speech synthesis / recognition                    /api/detect-fields  ───────────────────►  Gemini (vision, free)
react-rnd (drag boxes)                            /api/map-fields     ───────────────────►  Lumen AI Chat
react-signature-canvas                            /api/ask            ───────────────────►  Lumen AI Chat
```

- **All API keys stay server-side** (Vercel environment variables). The browser never sees them.
- **No database.** The server routes are stateless proxies; the record only exists in the user's browser.

### API routes

| Route | Input | Output |
|---|---|---|
| `POST /api/ocr` | raw file bytes + name | `{ documentId }` |
| `GET /api/ocr/[id]` | — | `{ status, pages?: { number, text, words? }[] }` |
| `POST /api/ocr/[id]/correct` | `{ pageNumber, wordIndex, text }` | `{ ok }` |
| `POST /api/extract-record` | `{ ocrText, docHint? }` | `{ fields: Partial<Record["core"]>, extra, flags[] }` |
| `POST /api/detect-fields` | `{ pageImageBase64, pageNumber }` | `{ fields: FormField[] }` (no values yet) |
| `POST /api/map-fields` | `{ labels[], recordKeys[], formSpecificKeys[] }` | `{ mappings: { label, recordKey?, status, reason? }[] }` |
| `POST /api/ask` | `{ question, context? }` | `{ answer }` |

## 10. Tech stack

| Layer | Tool | Notes |
|---|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** | Server routes replace a separate Express proxy |
| UI | **Tailwind CSS** + **shadcn/ui** | Fast, clean components |
| Hosting | **Vercel** (free) | HTTPS, env vars for keys |
| OCR | **Lumen OCR** | Async: upload → poll → pages; review API for corrections |
| AI reasoning | **Lumen AI Chat** | Text only; 4,000 chars/message; 25 s timeout |
| Find blanks on page | **Gemini API**, Flash model, free tier (`@google/genai`) | No card needed; reduced 2026 limits, so cache results |
| PDF → image | **pdfjs-dist** | Client-side rendering |
| Fill / draw / export PDF | **pdf-lib** (+ `@pdf-lib/fontkit` if a custom font is needed) | Standard Helvetica covers ñ |
| Validation | **Zod** | Validates every AI JSON response |
| Browser storage | **idb-keyval** | IndexedDB key-value wrapper |
| Drag/resize answers | **react-rnd** | |
| Signature | **react-signature-canvas** | Transparent PNG by default |
| Voice | Browser **SpeechSynthesis** + **SpeechRecognition** | Free, no keys |
| Mascot | SVG + CSS (optional **Framer Motion**) | |
| Fallbacks | **Fuse.js** (fuzzy label matching), **Tesseract.js** (word positions) | Only if Lumen/Gemini fail |

## 11. Lumen integration details

**OCR**
- `POST {LUMEN_OCR_BASE_URL}/documents` with raw bytes, `Content-Type` = file type, `X-Lumen-Document-Name` header → `202` + `DocumentID`.
- Poll `GET /documents/{id}` every 2–3 s until `READY` or `PARTIAL` (every GET costs 1 credit; stop after ~60 s and show Retry).
- `GET /documents/{id}/pages?IncludeWords=true` → text + words.
- Corrections: `POST /documents/{id}/review/corrections` `{ documentId, pageNumber, wordIndex, text }`.
- Credits: upload 6, each GET 1, correction 2. Budget the demo run ahead of time.

**AI Chat**
- Create one instance in the Organization Portal named "Pirma Lang Extractor" with the system instructions below.
- Open one session per task; send messages under 4,000 characters; client timeout 30 s; on `504` retry once, then fall back to Gemini.
- Always ask for JSON only; parse the first `{…}` block; validate with Zod.

**Instance instructions (draft)**
```
You are the extraction engine of Pirma Lang, a Philippine form-filling app.
Always answer with a single JSON object and nothing else.
Rules:
- Fix obvious OCR errors in LABELS (e.g., "FIRTH NAME" -> "First Name", "Apelyido" = Last Name).
- NEVER change VALUES (names, numbers, dates). If a value looks wrong, keep it and add a flag with your suggestion.
- Understand Filipino and English labels (Pangalan, Apelyido, Kapanganakan, Tirahan, etc.).
- Dates as YYYY-MM-DD. Unknown = omit the key.
```

**Gemini prompt for finding blanks (draft)**
```
This is a blank Philippine government or employment form. List every place a person must
write an answer. For each: label (as printed), box [ymin, xmin, ymax, xmax] normalized 0–1000
covering the empty answer area (not the label), type (text|date|checkbox|signature|photo),
and options for checkbox groups. Return JSON array only.
```

## 12. Screens

1. **Home** — Ate Fill greeting, two big buttons: "Gawin ang record ko" (build my record) and "Paki-fill ang form" (fill a form).
2. **Record builder** — upload, OCR progress, extracted fields with edit, conflict cards.
3. **My record** — all saved info grouped (personal, address, family, IDs), source per value, export/import, signature, photo.
4. **Form upload** — drop zone, page thumbnails, processing steps ("Reading labels… Finding blanks… Filling…").
5. **Final check** — form preview on the left, 🟡/🔴/⚠️ list on the right, green count collapsed.
6. **Done** — celebration, Download PDF, "Fill another form".

## 13. Privacy and safety

- Personal record stays in the user's browser; nothing is stored on our servers.
- Documents pass through Lumen OCR and (page images of blank forms) through Gemini. **Lumen's API cannot delete uploads**, so the pitch notes this and lists on-device OCR as a next step.
- Demo uses **sample documents only**, each watermarked "SAMPLE — NOT VALID". No real IDs on stage.
- The app never submits anything; the user always reviews and signs.
- Clear button: "Burahin ang record ko" (delete my record) wipes IndexedDB.

## 14. Demo script (90 seconds)

1. **Hook (10 s):** "Ilang beses mo na sinulat ang pangalan mo ngayong taon?" Show a stack of 5 forms.
2. **Onboarding (25 s):** Upload sample ID + sample PSA birth certificate. Record builds itself. Fix one OCR misread live (shows the Lumen review step).
3. **Form 1 — SSS E-1 (30 s):** Upload. Fields fill. 2 🔴 fields: Ate Fill asks out loud; answer them. Download PDF.
4. **Form 2 — Pag-IBIG (15 s):** Upload. Everything 🟢. Ate Fill: "Tapos na! 0 tanong. Pirma ka na lang!" Draw signature. Download.
5. **Close (10 s):** SDG 8/10, partner Pasig PESO, "Kami na bahala sa form. Pirma ka na lang."

**Fallbacks:** pre-processed results cached for both forms; if Lumen or Gemini is slow on stage, load the cached run with the same UI.

## 15. Build plan (until code freeze)

Assumes a team of 4; adjust to your team.

| Block | Person A — Lumen + server | Person B — PDF pipeline | Person C — UI + mascot | Person D — pitch + assets |
|---|---|---|---|---|
| **1. Setup** | Next.js app, Vercel deploy, env vars, `/api/ocr` working end to end | Download demo forms; test pdf.js render + pdf-lib drawText at a fixed spot | Layout, home, upload components | Make sample ID + birth certificate (watermarked); define record fields from them |
| **2. Core** | `/api/extract-record` with Lumen AI + Zod; corrections route | `/api/detect-fields` (Gemini); coordinate conversion; overlay preview | Record builder + review screen; IndexedDB save | Pitch deck skeleton; SDG + partner slide |
| **3. Fill** | `/api/map-fields` with statuses; formSpecific logic | Export filled PDF; checkbox drawing | Final check screen (🟡/🔴 list), green collapse | Rehearse demo with real outputs |
| **4. Polish** | Caching + fallbacks; timeouts | Drag/resize answers; signature placement | Ate Fill SVG + speech; celebration | Record backup demo video |
| **5. Freeze** | Bug fixes only | Bug fixes only | Bug fixes only | Final rehearsal ×3 |

**Milestone gates**
- **Gate 1:** an ID photo becomes a saved JSON record (P0 onboarding works).
- **Gate 2:** one flat form exports a PDF with at least the name fields in the right place.
- **Gate 3:** full demo path runs twice in a row without touching code.
- **Cut order if behind:** signature → 1×1 photo → voice input → Gemini (fallback to "answer next to label") → conflict cards. The core path (scan → record → fill → final check → PDF) is never cut.

## 16. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Gemini boxes are off on dense government forms | Answers land in wrong spots | Drag/resize (FF-9); tune prompt on the 2 demo forms; Tesseract.js label positions as fallback |
| Lumen OCR doesn't return word coordinates | Can't use Lumen for positions | Gemini handles positions; Lumen handles text accuracy |
| Lumen AI timeout (25 s) or credit limit | Stalls on stage | Page-by-page calls; cached demo results; Gemini fallback |
| AI returns invalid JSON | Crash | Zod validation, extract first `{…}`, one retry |
| Gemini free-tier rate limit | Detection fails | Cache detected fields per form (hash of file); demo forms pre-cached |
| Character-box fields (one letter per box) look messy | Ugly output | P2; pick demo forms/fields where it's minimal |
| Filipino TTS voice unavailable on the demo laptop | Mascot sounds off | Test the laptop's voices early; English fallback; mute toggle |
| Using real IDs on stage | Privacy issue | Watermarked sample documents only |

## 17. Success criteria (for demo day)

- Onboarding from 2 documents in under 30 s.
- Form 1: ≥ 80% of fields 🟢 automatically; ≤ 3 questions asked.
- Form 2: 100% 🟢, zero questions.
- Exported PDF opens correctly and looks hand-ready to sign.
- Lumen OCR, Lumen AI Chat, and the OCR correction API each called at least once in the live demo.

## 18. Open questions

1. Do we have the **Lumen API key + secret** and an **AI Chat instance** created in the Organization Portal?
2. Does Lumen OCR return **word coordinates** with `IncludeWords=true`? (Test first thing.)
3. Are the SSS E-1 and Pag-IBIG forms **fillable or flat**? (Check when downloaded.)
4. Final name: **Pirma Lang** (alternatives: Fill-ipino, PakiFill).
5. Team size and who owns which column of the build plan.
