"use client";
import { useEffect, useState } from "react";
import { emptyRecord, entries, type FieldValue, type PersonalRecord } from "@/lib/models";
import { clearRecord, loadRecord, saveRecord } from "@/lib/storage";
import { mergeRecord, type Conflict } from "@/lib/record";
import { RecordBuilder } from "./record-builder";
import { MyRecord } from "./my-record";
import { FormWorkspace } from "./form-workspace";
import { Assets } from "./assets";
import { AteFill, useAteFill } from "./mascot";
type Screen = "home" | "scan" | "record" | "fill";
export function PirmaApp() {
  const [record, setRecord] = useState<PersonalRecord>(emptyRecord);
  const [screen, setScreen] = useState<Screen>("home"); const [ready, setReady] = useState(false);
  const [error, setError] = useState(""); const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const voice = useAteFill(); const count = entries(record).length;
  useEffect(() => { loadRecord().then(setRecord).catch(() => setError("Could not read browser storage. Allow site storage or import a valid record.")).finally(() => setReady(true)); }, []);
  async function update(next: PersonalRecord) { await saveRecord(next); setRecord(next); }
  async function add(fields: [string, FieldValue][]) {
    const result = mergeRecord(record, fields); await update(result.record);
    setConflicts(old => [...old, ...result.conflicts]); setScreen("record");
  }
  function go(next: Screen) { setScreen(next); if (next === "scan") voice.speak("Ako si Ate Fill. I-upload ang sample ID mo. Ako na ang bahala sa form."); }
  return <><header className="site-header"><a href="#" className="brand" onClick={e => { e.preventDefault(); go("home"); }}><span className="brand-mark">p<span>✓</span></span>Pirma Lang<span className="beta">DEMO</span></a>
    <nav aria-label="Main navigation">{([ ["home","Home"], ["record",`My record${count ? ` (${count})` : ""}`], ["fill","Paki-fill"] ] as [Screen,string][]).map(([key,label]) => <button key={key} className={screen===key?"active":""} onClick={() => go(key)}>{label}</button>)}<button aria-pressed={!voice.muted} onClick={voice.toggle}>{voice.muted ? "Sound off" : "Sound on"}</button></nav>
  </header><main className="shell">{error && <p role="alert" className="error">{error}</p>}{!ready ? <p role="status">Opening your local record…</p> : <>
    {screen === "home" && <><div className="hero"><div><span className="eyebrow"><span className="status-dot" /> A LITTLE HELP. A LOT LESS PAPERWORK.</span><h1>Ikaw ang bida.<br /><em>Kami sa form.</em></h1><p className="hero-copy">Scan your IDs once. Fill your next form in a few clicks.<br />All that’s left is your signature.</p><div className="actions"><button className="primary" onClick={() => go("scan")}>{count ? "Add another document" : "Gawin ang record ko"} <span>↗</span></button><button onClick={() => go("fill")}>Paki-fill ang form →</button></div><p className="local-note">◈ Your record stays in this browser.</p></div><div className="hero-art"><div className="paper paper-back" /><div className="paper"><span className="paper-label">ANG RECORD MO</span><div className="paper-line long" /><div className="paper-line" /><div className="paper-line long" /><div className="paper-check">✓</div><span className="paper-signature">Pirma na lang.</span></div><div className="mascot-bubble">Ako na’ng bahala!</div><AteFill speaking={voice.speaking} /><span className="mascot-name">ATE FILL · YOUR FORM BUDDY</span></div></div>
      <div className="steps">{[["01","Scan your ID","Build your record once."],["02","Bring any blank form","We’ll find where everything goes."],["03","Silip. Pirma. Tapos.","Check the gaps. Download your PDF."]].map(([n,title,copy]) => <article key={n}><span className="step-number">{n}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
      <section className="home-bottom"><div><span className="eyebrow">LESS ULIT-ULIT. MORE OPPORTUNITIES.</span><h2>One record. A head start<br />on every application.</h2><p className="muted">For fresh grads, families, and the people helping them.</p></div><div className="card"><strong>{count ? `${count} details ready to reuse` : "Start with a sample. See how it works."}</strong><p className="muted">No account needed. Review every detail before saving.</p><button className="text-button" onClick={() => go(count ? "record" : "scan")}>{count ? "View my record" : "Meet your record"} →</button></div></section></>}
    {screen === "scan" && <RecordBuilder onSave={add} />}
    {screen === "record" && <><MyRecord record={record} conflicts={conflicts} onChange={update} onResolve={key => setConflicts(old => old.filter(c => c.key!==key))} onClear={async () => { await clearRecord(); setRecord(emptyRecord()); setConflicts([]); }} /><div className="section-gap"><Assets record={record} onChange={update} /><button className="primary" onClick={() => go("scan")}>Scan another document →</button></div></>}
    {screen === "fill" && <FormWorkspace record={record} onRecord={update} speak={voice.speak} />}
  </>}</main><footer className="footer"><div><strong>Kami na bahala sa form. Pirma ka na lang.</strong><p>Built for OVERCLOCK 2026 · SDG 8, 10 & 16.6</p></div><details><summary>Privacy & sample demo</summary><p>Records and assets stay in IndexedDB on this browser. IDs pass through Lumen OCR; AI receives OCR text. Blank form images go to Gemini. Lumen uploads cannot be deleted through its API. Clearing your record only removes your local copy. Use watermarked sample documents for the demo. Sample mode makes no provider calls. Optional voice input uses your browser’s recognition service, which may process audio externally. This app never submits forms.</p></details></footer></>;
}
