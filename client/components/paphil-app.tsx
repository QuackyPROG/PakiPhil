"use client";
import { useEffect, useRef, useState } from "react";
import { emptyRecord, entries, type FieldValue, type PersonalRecord } from "@/lib/models";
import { clearRecord, loadRecord, saveRecord } from "@/lib/storage";
import { mergeRecord, type Conflict } from "@/lib/record";
import { RecordBuilder } from "./record-builder";
import { MyRecord } from "./my-record";
import { FormWorkspace } from "./form-workspace";
import { Assets } from "./assets";
import { PhilGuide, PhilProvider, usePhilContext, useMood } from "./mascot";
import { HeroDemo } from "./ui/hero-demo";
import { BrandMark, IconCheck, IconLock, IconSound } from "./ui/icons";
import { gsap, reducedMotion, useGSAP } from "./ui/motion";
type Screen = "home" | "scan" | "record" | "fill";

export function PaPhilApp() {
  return <PhilProvider><App /></PhilProvider>;
}

function App() {
  const [record, setRecord] = useState<PersonalRecord>(emptyRecord);
  const [screen, setScreen] = useState<Screen>("home"); const [ready, setReady] = useState(false);
  const [error, setError] = useState(""); const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [signed, setSigned] = useState(false);
  const voice = usePhilContext(); const count = entries(record).length;
  const main = useRef<HTMLElement>(null);
  useEffect(() => { loadRecord().then(setRecord).catch(() => setError("Could not read browser storage. Allow site storage or import a valid record.")).finally(() => setReady(true)); }, []);
  async function update(next: PersonalRecord) { await saveRecord(next); setRecord(next); }
  async function add(fields: [string, FieldValue][]) {
    const result = mergeRecord(record, fields); await update(result.record);
    setConflicts(old => [...old, ...result.conflicts]); setScreen("record");
  }
  function go(next: Screen) { setScreen(next); window.scrollTo({ top: 0 }); if (next === "scan") voice.speak("Ako si Phil. I-upload ang sample ID mo. Ako na ang bahala sa form."); }
  useMood("", error, screen === "record"
    ? { pose: count ? "Happy" : "Thinking", line: count ? `${count} details, handa na!` : "Wala pa tayong record.", detail: count ? "I-edit kahit kailan." : "Mag-scan ng ID para magsimula." }
    : { pose: "Happy", line: "Hi! Ako si Phil.", detail: "Mabilis mag-fill, parang cheetah." });
  useGSAP(() => {
    if (!ready || reducedMotion()) return;
    gsap.from(main.current!.querySelector(".screen")?.children ?? [], { opacity: 0, y: 14, duration: 0.4, stagger: 0.05, clearProps: "all" });
  }, { dependencies: [screen, ready] });

  const steps: [Screen, string, boolean][] = [
    ["record", `My record${count ? ` (${count})` : ""}`, count > 0],
    ["fill", "Paki-fill", signed],
  ];
  const current = screen === "scan" ? "record" : screen;
  return <>
    <header className="site-header"><div className="site-header-inner">
      <a href="#" className="brand" onClick={e => { e.preventDefault(); go("home"); }}><BrandMark className="brand-mark" />PaPhil</a>
      <span className="event-sticker">OVERCLOCK 2026</span>
      <nav className="journey" aria-label="Your journey">
        {steps.map(([key, label, done], i) => <span key={key} style={{ display: "contents" }}>
          {i > 0 && <span className="joiner" aria-hidden />}
          <button className={done ? "done" : ""} aria-current={current === key ? "page" : undefined} onClick={() => go(key)}>
            <span className="num" aria-hidden>{done ? <IconCheck /> : i + 1}</span><span className="label">{label}</span>
          </button>
        </span>)}
        <span className="joiner" aria-hidden />
        <button className={signed ? "done" : ""} disabled={!signed} title={signed ? "Your PDF is ready to sign" : "Download a filled PDF first"} onClick={() => go("fill")}>
          <span className="num" aria-hidden>{signed ? <IconCheck /> : 3}</span><span className="label">Pirma</span>
        </button>
      </nav>
      <button className="sound-toggle" aria-pressed={!voice.muted} onClick={voice.toggle}><IconSound on={!voice.muted} />{voice.muted ? "Sound off" : "Sound on"}</button>
    </div></header>
    <main ref={main} className={`shell ${screen === "home" ? "" : "with-guide"} ${screen === "fill" ? "locked" : ""}`}>{screen !== "home" && <PhilGuide suggestions={screen === "fill" ? undefined : ["Anong IDs ang puwede kong i-scan?", "Ligtas ba ang data ko dito?", "Paano gumagana ang Paki-fill?"]} />}<div className="screen">{error && <p role="alert" className="error">{error}</p>}{!ready ? <p role="status">Opening your local record…</p> : <>
      {screen === "home" && <>
        <section className="hero">
          <div>
            <h1>Ikaw ang bida. Kami sa form.</h1>
            <p className="hero-copy">Scan your IDs once. Bring any blank government form. We fill in everything we already know, and you only answer what’s missing.</p>
            <div className="actions">
              <button className="primary big" onClick={() => go("scan")}>{count ? "Add another document" : "Gawin ang record ko"}</button>
              <button className="big" onClick={() => go("fill")}>Paki-fill ang form</button>
            </div>
            <p className="hero-note"><IconLock />Your record stays in this browser. No account needed.</p>
          </div>
          <HeroDemo />
        </section>
        <ol className="how">
          {[["Scan your ID", "Lumen reads it once and builds your record."], ["Bring any blank form", "Phil finds every blank and fills in what your record already knows."], ["Silip, pirma, tapos", "Answer the few gaps, download, and sign."]].map(([title, copy]) => <li key={title}><h3>{title}</h3><p>{copy}</p></li>)}
        </ol>
        {count > 0 && <p className="hero-note"><IconCheck />{count} details ready to reuse. <button className="text-button" onClick={() => go("record")}>View my record</button></p>}
      </>}
      {screen === "scan" && <RecordBuilder onSave={add} />}
      {screen === "record" && <><MyRecord record={record} conflicts={conflicts} onChange={update} onResolve={key => setConflicts(old => old.filter(c => c.key!==key))} onClear={async () => { await clearRecord(); setRecord(emptyRecord()); setConflicts([]); setSigned(false); }} /><div className="section-gap"><Assets record={record} onChange={update} /><div className="actions"><button className="primary" onClick={() => go("scan")}>Scan another document</button><button onClick={() => go("fill")}>Paki-fill a form</button></div></div></>}
      {screen === "fill" && <FormWorkspace record={record} onRecord={update} speak={voice.speak} onDownloaded={() => setSigned(true)} />}
    </>}</div></main>
    {screen !== "fill" && <footer className="footer"><div className="footer-inner"><div><strong>Kami na bahala sa form. Pirma ka na lang.</strong><p>Built for OVERCLOCK 2026, for SDG 8, 10 and 16.6.</p></div><details><summary>Privacy and sample data</summary><p>Records and assets stay in IndexedDB on this browser. IDs pass through Lumen OCR; Lumen AI receives OCR text and blank form images. Lumen uploads cannot be deleted through its API. Clearing your record only removes your local copy. Use watermarked sample documents for the demo. Sample mode makes no provider calls. Optional voice input uses your browser’s recognition service, which may process audio externally. This app never submits forms.</p></details></div></footer>}
  </>;
}
