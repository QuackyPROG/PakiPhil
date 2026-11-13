"use client";
/* eslint-disable @next/next/no-img-element -- Local PDF page thumbnails. */
import { useState } from "react";
import { Upload } from "./upload";
import { FormPreview } from "./form-preview";
import { FinalCheck } from "./final-check";
import { Assets } from "./assets";
import { analyzeForm } from "@/lib/fill";
import { sampleForm } from "@/lib/demo";
import { exportPdf } from "@/lib/export";
import { download } from "@/lib/storage";
import type { PersonalRecord, FormField } from "@/lib/models";
import type { FormPage } from "@/lib/pdf";
export function FormWorkspace({ record, onRecord, speak }: { record: PersonalRecord; onRecord: (r: PersonalRecord) => Promise<void>; speak: (text: string) => void }) {
  const [pages, setPages] = useState<FormPage[]>([]); const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(""); const [error, setError] = useState("");
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [sample, setSample] = useState(false);
  const [retryFile, setRetryFile] = useState<File>();
  async function read(file?: File, second = false) {
    setBusy(true); setError(""); setDone(false); setPages([]); setActive(0);
    setSample(!file); if (file) setRetryFile(file);
    try { setPages(file ? await analyzeForm(file, record, setProgress) : await sampleForm(record, second)); setProgress("Ready for your final check."); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  function update(field: FormField) { setPages(old => old.map(p => ({ ...p, fields: p.fields.map(f => f.id === field.id ? field : f) }))); }
  async function finish() {
    setBusy(true); setError("");
    try { download(await exportPdf(pages, record.assets), "pirma-lang-filled.pdf"); setDone(true); speak(`Tapos na! ${pages.flatMap(p => p.fields).length} fields. Pirma ka na lang!`); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  const unresolved = pages.flatMap(p => p.fields).filter(f => f.status !== "green").length;
  return <section className="stack"><div><span className="eyebrow">02 / PAKI-FILL</span><h2>A new form. The same you.</h2><p className="muted">Upload a blank form. We’ll use your record and ask only for what’s missing.</p></div>
    {!pages.length && <><Upload disabled={busy} onFile={f => void read(f)} title="Upload your blank form" /><div className="actions"><button disabled={busy} onClick={() => void read()}>Try sample employment form</button><button disabled={busy} onClick={() => void read(undefined, true)}>Try sample membership form</button></div></>}
    <p role="status">{progress}</p>{error && <div className="error" role="alert">{error}{retryFile && <button disabled={busy} onClick={() => void read(retryFile)}>Retry form analysis</button>}</div>}
    {sample && !!pages.length && <p className="demo-banner">SAMPLE DEMO · Cached sample layout, no provider calls. Practice template, not an official SSS/Pag-IBIG form.</p>}
    {!!pages.length && <><div className="actions">{pages.map((p,i) => <button key={p.number} aria-pressed={active===i} className="page-thumbnail" onClick={() => setActive(i)}><img src={p.image} alt={`Page ${p.number} thumbnail`} /><span>Page {p.number} {p.fields.every(f => f.status === "green") ? "✓" : ""}</span></button>)}<button onClick={() => { setPages([]); setDone(false); setProgress(""); }}>Choose another form</button></div>
      {!pages.flatMap(p => p.fields).length && <p className="error">No answer areas were detected. Try a clearer scan.</p>}
      <div className="workspace"><div className="stack"><FormPreview page={pages[active]} assets={record.assets} onChange={update} /><p className="muted">Drag or resize an answer box to adjust where it appears in your PDF.</p><Assets record={record} onChange={onRecord} /></div>
        <FinalCheck fields={pages.flatMap(p => p.fields)} record={record} onChange={update} onRecord={onRecord} onAsk={speak} /></div>
      <div className="export-bar"><div><strong>{done ? "Tapos na! Your PDF is ready." : unresolved ? `${unresolved} answers still need review` : "Ready to sign."}</strong><p className="muted">Check placement on every page before downloading.</p></div><button className="primary" disabled={busy || !!unresolved || !pages.some(p => p.fields.length)} onClick={() => void finish()}>{busy ? "Preparing…" : done ? "Download PDF again" : "Download filled PDF ↓"}</button></div>
      {done && <div className="card celebration"><h2>Kami na bahala sa form.<br />Pirma ka na lang.</h2><button onClick={() => { setPages([]); setDone(false); setProgress(""); }}>Fill another form →</button></div>}
    </>}
  </section>;
}
