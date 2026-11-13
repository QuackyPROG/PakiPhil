"use client";
import { useRef, useState } from "react";
import { entries, makeValue, putField, type FormField, type PersonalRecord } from "@/lib/models";
import { VoiceAnswer } from "./voice-answer";
import { usePhilContext } from "./mascot";
import { IconAlert, IconCheck, IconEye } from "./ui/icons";
import { gsap, reducedMotion, useGSAP } from "./ui/motion";
export function FinalCheck({ fields, record, onChange, onRecord, footer }: {
  fields: FormField[]; record: PersonalRecord; onChange: (f: FormField) => void;
  onRecord: (r: PersonalRecord) => Promise<void>; footer?: React.ReactNode;
}) {
  const [error, setError] = useState(""); const [asked, setAsked] = useState(""); const root = useRef<HTMLElement>(null);
  const { ask, pending } = usePhilContext();
  async function confirm(field: FormField, value: string, remember: boolean) {
    setError("");
    try {
      if (!["checkbox", "signature", "photo"].includes(field.type) && !value.trim()) throw new Error("Please enter an answer first.");
      if (remember && !["checkbox", "signature", "photo"].includes(field.type)) {
        const key = field.recordKey && !field.recordKey.startsWith("computed.") ? field.recordKey : `formSpecific.${field.label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 80) || field.id}`;
        const old = entries(record).find(([path]) => path === key)?.[1];
        const next = makeValue(value);
        if (old && old.value !== value) next.history = [...(old.history ?? []), { value: old.value, source: old.source.docName, scannedAt: old.scannedAt }];
        await onRecord(putField(record, key, next)); field = { ...field, recordKey: key };
      }
      onChange({ ...field, value, status: "green", reason: "Confirmed by you" });
    } catch (error) { setError((error as Error).message); }
  }
  function explain(field: FormField) {
    setAsked(field.id);
    ask(`Ano ang ibig sabihin ng "${field.label}" sa form na ito, at ano ang dapat kong isulat?`);
  }
  function card(field: FormField) {
    const source = entries(record).find(([key]) => key === field.recordKey)?.[1];
    const Icon = field.status === "green" ? IconCheck : field.status === "yellow" ? IconEye : IconAlert;
    const text = !["checkbox", "signature", "photo"].includes(field.type);
    return <article className={`review-field ${field.status}`} key={`${field.id}-${field.status}`}>
      <div className="field-heading"><strong>{field.label}</strong><span className={`chip ${field.status}`}><Icon />{field.status === "green" ? "Filled" : field.status === "yellow" ? "Check" : "Missing"}</span></div>
      <p className="reason">{field.reason || (field.status === "red" ? "Wala pa sa record mo." : "Check this value.")}{source && <small> From {source.source.docName}, {source.scannedAt.slice(0, 10)}.</small>}</p>
      <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void confirm(field, String(data.get("value") ?? "false"), data.get("remember") === "on"); }}>
        <div className="answer-row">
          {field.type === "checkbox" ? <label className="inline"><input name="value" type="checkbox" value="true" defaultChecked={field.value === "true"} />Check this option</label>
            : ["signature", "photo"].includes(field.type) ? <select name="value" defaultValue={field.value || "skip"}><option value="skip">Leave blank</option>{(field.type === "signature" ? record.assets.signaturePng : record.assets.photoPng) && <option value="asset">Use saved {field.type}</option>}</select>
            : <input id={`answer-${field.id}`} className="value-input" aria-label={`Answer for ${field.label}`} name="value" defaultValue={field.value ?? ""} required />}
          <button type="submit" className="primary">Confirm answer</button>
        </div>
        <div className="card-tools">
          {text && <VoiceAnswer onResult={value => { const input = document.getElementById(`answer-${field.id}`) as HTMLInputElement | null; if (input) input.value = value; }} />}
          <button type="button" className="ask-button" disabled={pending} aria-busy={pending && asked === field.id} onClick={() => explain(field)}>{pending && asked === field.id ? <><span className="spinner" aria-hidden />Sumasagot si Phil…</> : "Ano ’to?"}</button>
          {text && <label className="inline small"><input type="checkbox" name="remember" defaultChecked />Remember</label>}
        </div>
      </form></article>;
  }
  const uncertain = fields.filter(f => f.status !== "green");
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(".tally-number", { scale: 1.5, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(3)" });
  }, { dependencies: [uncertain.length], scope: root });
  return <aside ref={root} className="clipboard">
    <div className="clipboard-head"><h2 className="tally">{uncertain.length ? <><span className={"tally-number"}>{uncertain.length}</span> to check.</> : <><span className="tally-number zero"><IconCheck width={36} height={36} /></span>All checked. Pirma na lang!</>}</h2>
      <p className="muted">{uncertain.length ? "Everything else is already on the form." : "Silipin ang form, then download."}</p></div>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="clipboard-scroll">
      <div className="review-list">{uncertain.map(card)}</div>
      <details className="filled-group"><summary>{fields.length - uncertain.length} filled from your record</summary>{fields.filter(f => f.status === "green").map(card)}</details>
    </div>
    {footer}
  </aside>;
}
