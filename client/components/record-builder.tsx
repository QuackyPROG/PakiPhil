"use client";
import { useState } from "react";
import { demoFields, demoPages, sampleId, sampleBirthCertificate } from "@/lib/demo";
import { download } from "@/lib/storage";
import { Upload } from "./upload";
import { OcrReview } from "./ocr-review";
import { api, chunks, pollOcr, post, uploadOcr } from "@/lib/api";
import { makeValue, type FieldValue } from "@/lib/models";
import { extractionSchema, type Extraction } from "@/lib/extraction";
import type { OcrPage } from "@/lib/ocr";
import { detectE1, extractE1, scanE1, E1_DOCUMENT_ID, type E1Text } from "@/lib/demo-e1";
import { useMood } from "./mascot";
import { Pipeline } from "./ui/pipeline";
import { IconCheck, IconSparkle } from "./ui/icons";
import { prettyKey } from "./ui/labels";
export function RecordBuilder({ onSave }: { onSave: (fields: [string, FieldValue][]) => Promise<void> }) {
  const [file, setFile] = useState<File>(); const [documentId, setId] = useState("");
  const [pages, setPages] = useState<OcrPage[]>([]); const [fields, setFields] = useState<Extraction["fields"]>([]);
  const [progress, setProgress] = useState(""); const [e1, setE1] = useState<E1Text | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function read(next?: File, retry = false) {
    setBusy(true); setError(""); setFields([]);
    try {
      let id = documentId;
      if (next) {
        setFile(next); setPages([]); setProgress("Uploading…");
        const text = await detectE1(next); setE1(text);
        if (text) { setId(E1_DOCUMENT_ID); setPages(await scanE1(text, setProgress)); return; }
        id = (await uploadOcr(next)).documentId; setId(id);
      }
      else if (retry) await api(`/api/ocr/${encodeURIComponent(id)}/retry`, { method: "POST" });
      setPages(await pollOcr(id, setProgress));
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function extract() {
    setBusy(true); setError("");
    try {
      const result: Extraction["fields"] = [];
      if (documentId === "demo") {
        setFields(demoFields.map(([key], i) => ({ key, value: pages[0].words.find(w => w.index === i*2+1)!.text, pageNumber: 1, wordIndices: [i*2+1] })));
        setProgress("Sample extraction — no AI calls. Confirm values below."); return;
      }
      // An E-1 uses the ready-made record; re-check the file so it never falls through to live AI.
      if (documentId === E1_DOCUMENT_ID || e1 || (file && await detectE1(file))) {
        const found = await extractE1(setProgress);
        setFields(found); setProgress(`Done — Lumen AI found ${found.length} details. Review each value below before saving.`); return;
      }
      let dropped = 0;
      for (const page of pages) for (const text of chunks(page.text)) {
        setProgress(`Extracting page ${page.number} — Lumen AI…`);
        const response = await post<{ dropped?: number }>("/api/extract-record", { ocrText: text, pageNumber: page.number });
        result.push(...extractionSchema.parse(response).fields);
        dropped += response.dropped ?? 0;
      }
      setFields(result);
      setProgress(`Done — Lumen AI${dropped ? ` (${dropped} unverifiable value${dropped === 1 ? "" : "s"} skipped)` : ""}. Review each value below before saving.`);
      if (!result.length) setError("No personal fields found. Check the OCR text or try a clearer document.");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function editValue(index: number, value: string) {
    const field = fields[index]; if (field.value === value) return true;
    setBusy(true); setError("");
    try {
      if (!value.trim()) throw new Error("Enter a value or exclude this field.");
      const page = pages.find(p => p.number === field.pageNumber)!;
      const start = page.words.findIndex((_, i) => {
        let phrase = "";
        for (let n = i; n < page.words.length && phrase.length <= field.value.length; n++) {
          phrase += (n === i ? "" : " ") + page.words[n].text;
          if (phrase === field.value) return true;
        }
        return false;
      });
      if (start < 0) throw new Error("Could not trace this value to OCR words. Correct the source words above and extract again.");
      const original: typeof page.words = []; let phrase = "";
      for (let i = start; phrase !== field.value && i < page.words.length; i++) {
        original.push(page.words[i]); phrase = original.map(w => w.text).join(" ");
      }
      const replacements = original.length === 1 ? [value] : value.trim().split(/\s+/);
      if (original.length !== replacements.length) throw new Error("For a different number of words, correct the source OCR above and extract again.");
      for (let i = 0; i < original.length; i++) {
        if (!documentId.startsWith("demo") && original[i].text !== replacements[i]) await post(`/api/ocr/${encodeURIComponent(documentId)}/correct`, { pageNumber: page.number, wordIndex: original[i].index, text: replacements[i] });
      }
      const words = page.words.map(w => { const n = original.findIndex(old => old.index === w.index); return n < 0 ? w : { ...w, text: replacements[n] }; });
      setPages(old => old.map(p => p.number === page.number ? { ...p, words, text: words.map(w => w.text).join(" ") } : p));
      setFields(old => old.map((f, i) => i === index ? { ...f, value, reason: undefined, suggestion: undefined } : f));
      setProgress(documentId === "demo" ? "Sample correction saved locally. No API call." : "Edited value sent to Lumen OCR ✓");
      return true;
    } catch (error) { setError((error as Error).message); return false; }
    finally { setBusy(false); }
  }
  async function save() {
    setBusy(true); setError("");
    try {
      await onSave(fields.map(f => [f.key, makeValue(f.value, documentId === "demo" ? "SAMPLE ID — NOT VALID" : file?.name ?? "Document", "Scanned document")]));
      setFields([]); setPages([]); setProgress("Saved to your browser ✓");
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  useMood(progress, error, { pose: "Happy", line: "I-upload ang ID mo, sige!", detail: "PDF o litrato, ako na ang bahala." });
  const reading = busy && !pages.length;
  return <section className="stack">
    <div className="section-head"><h2>Scan once. Reuse every time.</h2><p>Add an ID or a filled form. Lumen reads it, you check the details, and they’re saved for every form after this.</p></div>
    {!fields.length && !pages.length && <><Upload disabled={busy} onFile={f => void read(f)} title={reading ? "Reading your document…" : "Drop an ID or document"} />
      <div className="samples"><span>No document handy?</span><button disabled={busy} onClick={() => { setId("demo"); setPages(structuredClone(demoPages)); setFields([]); setFile(undefined); setProgress("SAMPLE DEMO — no API calls. Review the sample words, then extract."); }}>Try a sample ID</button><button onClick={async () => download(await sampleId(), "sample-id.pdf")}>Download sample ID</button><button onClick={async () => download(await sampleBirthCertificate(), "sample-birth-certificate.pdf")}>Sample birth certificate</button></div></>}
    <Pipeline progress={progress} kind="scan" />{error && <p className="error" role="alert">{error}</p>}
    {documentId && !documentId.startsWith("demo") && !busy && <div className="actions"><button onClick={() => void read()}>Resume reading</button><button onClick={() => void read(undefined, true)}>Retry failed OCR</button></div>}
    {!!pages.length && !fields.length && <><OcrReview pages={pages} documentId={documentId} onBusyChange={setBusy} onChange={next => { setPages(next); setFields([]); }} /><div className="actions"><button className="primary big" disabled={busy} onClick={() => void extract()}><IconSparkle />Extract record with Lumen AI</button></div></>}
    {!!fields.length && <div className="stack"><div className="section-head"><h3>Silip muna: check what Lumen found</h3><p>Fix anything that looks off. Changes go back to Lumen so the source stays traceable.</p></div>
      <div className="extracted">{fields.map((field, i) => <label className="value" key={i}><span>{prettyKey(field.key)}</span><input className="value-input" key={field.value} defaultValue={field.value} disabled={busy} onBlur={async e => { const input = e.currentTarget; if (!await editValue(i, input.value)) input.value = field.value; }} /><button type="button" onClick={() => setFields(fields.filter((_, n) => n !== i))}>Exclude</button>{field.reason && <small>{field.reason} {field.suggestion ?? ""}</small>}</label>)}</div>
      <div className="save-bar"><strong>{fields.length} details ready</strong><button className="primary big" disabled={busy} onClick={() => void save()}><IconCheck />Confirm and save {fields.length} values</button></div></div>}
  </section>;
}
