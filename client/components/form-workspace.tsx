"use client";
import { useEffect, useState } from "react";
import { Upload } from "./upload";
import { FormPreview } from "./form-preview";
import { FinalCheck } from "./final-check";
import { AssetsButton } from "./assets";
import { usePhilContext, useMood } from "./mascot";
import { Pipeline } from "./ui/pipeline";
import { Celebration } from "./ui/celebration";
import { IconCheck, IconDownload, IconExpand, IconShrink } from "./ui/icons";
import { analyzeForm } from "@/lib/fill";
import { sampleForm } from "@/lib/demo";
import { exportPdf } from "@/lib/export";
import { download } from "@/lib/storage";
import type { PersonalRecord, FormField } from "@/lib/models";
import type { FormPage } from "@/lib/pdf";
export function FormWorkspace({ record, onRecord, speak, onDownloaded }: { record: PersonalRecord; onRecord: (r: PersonalRecord) => Promise<void>; speak: (text: string) => void; onDownloaded?: () => void }) {
  const [pages, setPages] = useState<FormPage[]>([]); const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(""); const [error, setError] = useState("");
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [sample, setSample] = useState(false);
  const [retryFile, setRetryFile] = useState<File>(); const [dismissed, setDismissed] = useState(false);
  const [formName, setFormName] = useState(""); const [fit, setFit] = useState<"page" | "width">("page");
  const { setChatContext } = usePhilContext();
  async function read(file?: File, second = false) {
    setBusy(true); setError(""); setDone(false); setPages([]); setActive(0);
    setSample(!file); if (file) setRetryFile(file);
    setFormName(file ? file.name : second ? "Sample membership form" : "Sample employment form");
    try { setPages(file ? await analyzeForm(file, record, setProgress) : await sampleForm(record, second)); setProgress("Ready for your final check."); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  function update(field: FormField) { setPages(old => old.map(p => ({ ...p, fields: p.fields.map(f => f.id === field.id ? field : f) }))); }
  async function finish() {
    setBusy(true); setError(""); setDismissed(false);
    try { download(await exportPdf(pages, record.assets), "paphil-filled.pdf"); setDone(true); onDownloaded?.(); speak(`Tapos na! ${pages.flatMap(p => p.fields).length} fields. Pirma ka na lang!`); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  function reset() { setPages([]); setDone(false); setProgress(""); setFormName(""); }
  const all = pages.flatMap(p => p.fields);
  const unresolved = all.filter(f => f.status !== "green");
  const settled = !!pages.length && !busy;
  // Phil's chat knows which form is open and what is still missing.
  const missing = unresolved.map(f => f.label).join(", ");
  useEffect(() => {
    setChatContext(formName ? `Form: ${formName}. ${all.length} answer boxes. ${missing ? `Still missing or uncertain: ${missing}.` : "All answers confirmed."}` : "Choosing a form to fill.");
  }, [setChatContext, formName, all.length, missing]);
  useEffect(() => () => setChatContext(""), [setChatContext]);
  useMood(settled ? "" : progress, error, done ? { pose: "Done", line: "Tapos na! Pirma ka na lang.", detail: "Nasa Downloads mo ang PDF." }
    : settled && unresolved.length ? { pose: "Surprised", line: `Ay, ${unresolved.length} pa ang kulang. Ikaw na dito!`, detail: "Double-click a box on the form, or answer on the right." }
    : settled ? { pose: "Excited", line: "Kumpleto na! I-download na natin.", detail: `${all.length} answers on the form.` }
    : { pose: "Happy", line: "Dalhin mo ang blankong form!", detail: "Ako ang hahanap ng mga blanko." });

  if (!pages.length) return <section className="fill-start stack">
    <div className="section-head"><h2>A new form. The same you.</h2><p>Upload a blank or half-filled form. Phil fills every blank already in your record and asks you only for the rest.</p></div>
    <Upload disabled={busy} onFile={f => void read(f)} title={busy ? "Reading your form…" : "Drop a blank form"} />
    <div className="samples"><span>Practice forms:</span><button disabled={busy} onClick={() => void read()}>Try sample employment form</button><button disabled={busy} onClick={() => void read(undefined, true)}>Try sample membership form</button></div>
    <Pipeline progress={progress} kind="fill" done={done} />
    {error && <div className="error" role="alert">{error}{retryFile && <button disabled={busy} onClick={() => void read(retryFile)}>Retry form analysis</button>}</div>}
  </section>;

  const download_ = <div className="export-bar">
    <strong>{done ? "Tapos na! Your PDF is ready." : unresolved.length ? `${unresolved.length} answers still need you` : "Ready to sign."}</strong>
    <button className="primary big" disabled={busy || !!unresolved.length || !pages.some(p => p.fields.length)} onClick={() => void finish()}><IconDownload />{busy ? "Preparing…" : done ? "Download PDF again" : "Download filled PDF"}</button>
  </div>;
  return <section className="fill-board">
    <div className="doc-column">
      <div className="doc-toolbar">
        <strong className="doc-name" title={formName}>{formName}</strong>
        {pages.length > 1 && <div className="page-tabs" role="tablist" aria-label="Pages">{pages.map((p, i) => <button key={p.number} role="tab" aria-selected={active === i} onClick={() => setActive(i)}>
          Page {p.number}{p.fields.every(f => f.status === "green") && <IconCheck width={14} height={14} />}</button>)}</div>}
        <span className="toolbar-gap" />
        <button type="button" onClick={() => setFit(f => f === "page" ? "width" : "page")} aria-pressed={fit === "width"}>{fit === "page" ? <><IconExpand />Zoom in</> : <><IconShrink />Whole page</>}</button>
        <AssetsButton record={record} onChange={onRecord} />
        <button type="button" className="text-button" onClick={reset}>Another form</button>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {!all.length && <p className="error">No answer areas were detected. Try a clearer scan.</p>}
      <FormPreview page={pages[active]} assets={record.assets} onChange={update} fit={fit} />
      <p className="workspace-hint"><b>Double-click</b> any box to type on the form · drag or resize to move it{sample && " · Sample form, not an official SSS or Pag-IBIG form"}</p>
    </div>
    <FinalCheck fields={all} record={record} onChange={update} onRecord={onRecord} footer={download_} />
    {done && !dismissed && <Celebration fields={all.length} busy={busy} onAgain={() => void finish()} onAnother={reset} onClose={() => setDismissed(true)} />}
  </section>;
}
