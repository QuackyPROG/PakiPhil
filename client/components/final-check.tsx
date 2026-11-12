"use client";
import { useState } from "react";
import { entries, makeValue, putField, type FormField, type PersonalRecord } from "@/lib/models";
import { VoiceAnswer } from "./voice-answer";
import { post } from "@/lib/api";
export function FinalCheck({ fields, record, onChange, onRecord, onAsk }: {
  fields: FormField[]; record: PersonalRecord; onChange: (f: FormField) => void;
  onRecord: (r: PersonalRecord) => Promise<void>; onAsk: (text: string) => void;
}) {
  const [error, setError] = useState(""); const [help, setHelp] = useState("");
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
  function card(field: FormField) {
    const source = entries(record).find(([key]) => key === field.recordKey)?.[1];
    return <article className={`review-field ${field.status}`} key={`${field.id}-${field.status}`}><div className="field-heading"><strong>{field.status === "green" ? "✓" : field.status === "yellow" ? "●" : "!"} {field.label}</strong><button className="text-button" onClick={() => onAsk(`Ano ang ${field.label} mo?`)}>Ask Ate Fill</button></div>
      <p className="muted">{field.reason || (field.status === "red" ? "Wala pa sa record mo. Type your answer below." : "Check this value.")}</p>
      {source && <details><summary>Where did this come from?</summary><small>From {source.source.docName}, scanned {source.scannedAt.slice(0, 10)}</small></details>}
      <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void confirm(field, String(data.get("value") ?? "false"), data.get("remember") === "on"); }}>
        {field.type === "checkbox" ? <label className="inline"><input name="value" type="checkbox" value="true" defaultChecked={field.value === "true"} />Check this option</label>
          : ["signature", "photo"].includes(field.type) ? <select name="value" defaultValue={field.value || "skip"}><option value="skip">Leave blank</option>{(field.type === "signature" ? record.assets.signaturePng : record.assets.photoPng) && <option value="asset">Use saved {field.type}</option>}</select>
          : <input id={`answer-${field.id}`} aria-label={`Answer for ${field.label}`} name="value" defaultValue={field.value ?? ""} required />}
        {!["checkbox", "signature", "photo"].includes(field.type) && <VoiceAnswer onResult={text => { const input = document.getElementById(`answer-${field.id}`) as HTMLInputElement | null; if (input) input.value = text; }} />}
        {!["checkbox", "signature", "photo"].includes(field.type) && <label className="inline"><input type="checkbox" name="remember" defaultChecked />Remember for future forms</label>}
        <div className="actions"><button type="submit" className="primary">Confirm answer</button><button type="button" onClick={async () => { try { setHelp((await post<{ answer: string }>("/api/ask", { question: `What does ${field.label} mean on this form?` })).answer); } catch (error) { setError((error as Error).message); } }}>Ano ’to?</button></div>
      </form></article>;
  }
  const uncertain = fields.filter(f => f.status !== "green");
  return <aside className="stack"><div><span className="eyebrow">03 / SILIP MUNA</span><h2>{uncertain.length ? `${uncertain.length} to check.` : "All checked. Pirma na lang!"}</h2><p className="muted">Only missing or uncertain answers need your attention.</p></div>
    {error && <p role="alert" className="error">{error}</p>}{help && <div className="card"><p>{help}</p><button onClick={() => setHelp("")}>Close explanation</button></div>}
    {uncertain.map(card)}<details className="card"><summary>{fields.length - uncertain.length} fields filled from your record ✓</summary>{fields.filter(f => f.status === "green").map(card)}</details>
  </aside>;
}
