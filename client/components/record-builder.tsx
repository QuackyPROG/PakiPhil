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
export function RecordBuilder({ onSave }: { onSave: (fields: [string, FieldValue][]) => Promise<void> }) {
  const [file, setFile] = useState<File>(); const [documentId, setId] = useState("");
  const [pages, setPages] = useState<OcrPage[]>([]); const [fields, setFields] = useState<Extraction["fields"]>([]);
  const [progress, setProgress] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function read(next?: File, retry = false) {
    setBusy(true); setError(""); setFields([]);
    try {
      let id = documentId;
      if (next) { setFile(next); setPages([]); setProgress("Uploading…"); id = (await uploadOcr(next)).documentId; setId(id); }
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
      for (const page of pages) for (const text of chunks(page.text)) {
        setProgress(`Extracting page ${page.number} — Lumen AI…`);
        result.push(...extractionSchema.parse(await post("/api/extract-record", { ocrText: text, pageNumber: page.number })).fields);
      }
      setFields(result); setProgress("Review each value below before saving.");
      if (!result.length) setError("No personal fields found. Check the OCR text or try a clearer document.");
    } catch (error) { setError((error as Error).message); }
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
  return <section className="stack"><div><span className="eyebrow">01 / ANG RECORD MO</span><h2>Scan once. Reuse every time.</h2><p className="muted">Add an ID or document, review Lumen’s reading, then save the details you confirm.</p></div>
    <Upload disabled={busy} onFile={f => void read(f)} title="Add an ID or document" />
    <div className="actions"><button disabled={busy} onClick={() => { setId("demo"); setPages(structuredClone(demoPages)); setFields([]); setFile(undefined); setProgress("SAMPLE DEMO — no API calls. Review the sample words, then extract."); }}>Try a sample ID</button><button onClick={async () => download(await sampleId(), "sample-id.pdf")}>Download sample ID</button><button onClick={async () => download(await sampleBirthCertificate(), "sample-birth-certificate.pdf")}>Sample birth certificate</button></div>
    <p role="status">{progress}</p>{error && <p className="error" role="alert">{error}</p>}
    {documentId && documentId !== "demo" && !busy && <div className="actions"><button onClick={() => void read()}>Resume reading</button><button onClick={() => void read(undefined, true)}>Retry failed OCR</button></div>}
    {!!pages.length && <><OcrReview pages={pages} documentId={documentId} onChange={next => { setPages(next); setFields([]); }} /><button className="primary" disabled={busy} onClick={() => void extract()}>Extract record with Lumen AI</button></>}
    {!!fields.length && <div className="card stack"><h3>Silip muna — confirm extracted values</h3><p className="muted">Need to fix a value? Correct its OCR word above, then extract again. This keeps the Lumen correction log accurate.</p>
      {fields.map((field, i) => <label key={i}><span>{field.key.replace(/^core\./, "")}</span><input value={field.value} readOnly /><small>{field.reason ? `⚠ ${field.reason} ${field.suggestion ?? ""}` : "Review against your document"}</small><button onClick={() => setFields(fields.filter((_, n) => n !== i))}>Exclude</button></label>)}
      <button className="primary" disabled={busy} onClick={() => void save()}>Confirm and save {fields.length} values</button></div>}
  </section>;
}
