// Demo-ready path for the SSS E-1 Personal Record (public/demo/*.pdf).
// When an uploaded PDF is recognized as the E-1, scanning and filling run locally from the
// PDF's own text layer with paced Lumen-style progress, so the stage demo never depends on
// a live AI provider. Layout comes from scripts/gen-e1-layout.mjs.
import layout from "./demo-e1-layout.json";
import knownFiles from "./demo-e1-known.json";
import { entries, type FormField, type PersonalRecord } from "./models";
import { computed } from "./record";
import { renderFile, type FormPage } from "./pdf";
import type { OcrPage } from "./ocr";
import type { Extraction } from "./extraction";
import readyRecord from "./demo-e1-record.json";

type Box = [number, number, number, number];
type E1Field = { page: number; key: string; label: string; box: number[]; sample: string; type: FormField["type"]; comb?: number };
type TextItem = { str: string; top: number; left: number; width: number; height: number };
/** Positioned text per page, plus the answer boxes already written when the file is a known demo PDF. */
export type E1Text = { pages: Record<number, TextItem[]>; known?: number[] };
const E1 = layout as E1Field[];
const KNOWN = knownFiles as Record<string, { name: string; written: number[] }>;
export const E1_DOCUMENT_ID = "demo-e1";
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Returns the PDF's positioned text if it is the 3-page SSS E-1 Personal Record, otherwise null. */
export async function detectE1(file: File): Promise<E1Text | null> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return null;
  let known: number[] | undefined;
  try {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))).map(v => v.toString(16).padStart(2, "0")).join("");
    known = KNOWN[hash]?.written;
  } catch { /* hashing is only a fallback */ }
  try {
    const pdfjs = await import("pdfjs-dist"); pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), verbosity: 0 });
    const doc = await loading.promise;
    try {
      if (doc.numPages !== 3) return null;
      const result: E1Text["pages"] = {};
      for (let n = 1; n <= 3; n++) {
        const page = await doc.getPage(n); const vp = page.getViewport({ scale: 1 });
        result[n] = (await page.getTextContent()).items.flatMap(item => "str" in item && item.str.trim() ? [{
          str: item.str, top: (vp.height - item.transform[5] - item.height) / vp.height * 1000,
          left: item.transform[4] / vp.width * 1000, width: item.width / vp.width * 1000, height: item.height / vp.height * 1000 }] : []);
      }
      const first = result[1].map(i => i.str).join(" ");
      const text = { pages: result, known };
      if (known) report(text);
      return known || (first.includes("PERSONAL RECORD") && first.includes("COV-01214")) ? text : null;
    } finally { await loading.destroy(); }
  } catch (error) {
    console.warn("[demo-e1] could not read PDF text; using fingerprint only", error);
    return known ? { pages: { 1: [], 2: [], 3: [] }, known } : null;
  }
}
/** Which answer boxes hold writing: the recorded list for a known demo PDF, else the text layer. */
function writtenIn(text: E1Text, f: E1Field) {
  return text.known ? text.known.includes(E1.indexOf(f)) : written(text.pages[f.page] ?? [], f.box).length > 0;
}
/** Logs when this browser's text layer disagrees with the recorded layout, to diagnose position drift. */
function report(text: E1Text) {
  const live = E1.flatMap((f, i) => f.type !== "checkbox" && written(text.pages[f.page] ?? [], f.box).length ? [i] : []);
  if (live.length !== text.known!.length) console.warn(`[demo-e1] text layer found ${live.length} written boxes, expected ${text.known!.length}; using recorded layout.`,
    { sample: (text.pages[1] ?? []).slice(0, 5), viewport: "scale 1" });
}
function written(items: TextItem[], box: number[]) {
  return items.filter(i => { const cy = i.top + i.height / 2, cx = i.left + Math.min(i.width, 30) / 2;
    return cy > box[0] && cy < box[2] && cx > box[1] && cx < box[3]; }).sort((a, b) => a.left - b.left);
}
const digits = (s: string) => s.replace(/\D/g, "");
const isoFromComb = (s: string) => { const d = digits(s); return d.length === 8 ? `${d.slice(4)}-${d.slice(0, 2)}-${d.slice(2, 4)}` : s; };
const combFromIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(5, 7)}${s.slice(8, 10)}${s.slice(0, 4)}` : digits(s);

/** Paced "Lumen OCR" read of an E-1, returning OCR pages built from the PDF text layer. */
export async function scanE1(text: E1Text, progress: (text: string) => void): Promise<OcrPage[]> {
  progress("Uploading to Lumen OCR…"); await wait(1100);
  for (const n of [1, 2, 3]) { progress(`Reading — Lumen OCR… page ${n} of 3`); await wait(900); }
  progress("Done — Lumen OCR");
  return [1, 2, 3].map(number => {
    const words = [...(text.pages[number] ?? [])].sort((a, b) => Math.round(a.top) - Math.round(b.top) || a.left - b.left)
      .flatMap(i => i.str.split(/\s+/).filter(Boolean)).map((word, index) => ({ index, text: word }));
    return { number, text: words.map(w => w.text).join(" "), words };
  });
}

/** Paced "Lumen AI" extraction of the E-1: returns the ready-made record JSON (lib/demo-e1-record.json). */
export async function extractE1(progress: (text: string) => void): Promise<Extraction["fields"]> {
  for (const n of [1, 3]) { progress(`Extracting page ${n} — Lumen AI…`); await wait(1300); }
  return structuredClone(readyRecord);
}

/** Paced "Lumen" analysis of a blank or partly filled E-1: only empty answer boxes become fields. */
export async function fillE1(file: File, text: E1Text, record: PersonalRecord, progress: (text: string) => void): Promise<FormPage[]> {
  progress("Rendering pages…"); const pages = await renderFile(file);
  progress("Reading labels — Lumen OCR…"); await wait(1200);
  const values: Record<string, string> = Object.fromEntries(entries(record).map(([key, field]) => [key, field.value]));
  const today = computed(record)["computed.today"];
  values["computed.today"] = `${today.slice(5, 7)}/${today.slice(8, 10)}/${today.slice(0, 4)}`;
  const name = [values["core.firstName"], values["core.middleName"] && `${values["core.middleName"][0]}.`, values["core.lastName"], values["core.suffix"]].filter(Boolean).join(" ");
  if (values["core.firstName"]) values["computed.printedName"] = name.toUpperCase();
  const checks: Record<string, boolean> = {
    "check.sexMale": values["core.sex"] === "Male", "check.civilMarried": values["core.civilStatus"] === "Married",
    "check.additionalSheet": !!values["extra.child6FirstName"], "check.flexiNo": true,
  };
  for (const page of pages) {
    progress(`Page ${page.number} of ${pages.length} — finding blanks…`); await wait(900);
    const onPage = E1.filter(f => f.page === page.number);
    // Partly filled form: its checkmarks are drawings we can't read, so leave checkboxes alone.
    const started = onPage.some(f => f.type !== "checkbox" && writtenIn(text, f));
    page.fields = onPage.flatMap((f, i): FormField[] => {
      if (f.type === "checkbox" ? started : writtenIn(text, f)) return [];
      const base = { id: `e1-p${page.number}-${i}`, label: f.label, box: f.box as Box, type: f.type, ...(f.comb ? { comb: f.comb } : {}) };
      if (f.key === "N/A") return [{ ...base, value: "N/A", status: "green", reason: "Not applicable to you" }];
      if (f.type === "checkbox") return [{ ...base, value: String(checks[f.key]), status: "green", reason: "From your record" }];
      if (f.type === "signature") return [record.assets.signaturePng
        ? { ...base, value: "asset", status: "green", reason: "Your saved signature" }
        : { ...base, status: "red", reason: "Add your signature under “My signature & photo”, then choose it here." }];
      const raw = values[f.key];
      const value = raw && (f.comb ? combFromIso(raw) : raw);
      return [{ ...base, ...(f.key.startsWith("computed.") ? {} : { recordKey: f.key }), value,
        status: value ? "green" : "red", reason: value ? f.key.startsWith("computed.") ? "Filled for you" : "From your record" : undefined }];
    });
    progress(`Page ${page.number} of ${pages.length} — filling with Lumen AI…`); await wait(1000);
    progress(`Page ${page.number} of ${pages.length} ✓`);
  }
  return pages;
}
