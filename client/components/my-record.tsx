"use client";
import { useState } from "react";
import { entries, makeValue, putField, type PersonalRecord } from "@/lib/models";
import { exportRecord, importRecord } from "@/lib/storage";
import { resolveConflict, type Conflict } from "@/lib/record";
import { prettyKey } from "./ui/labels";
export function MyRecord({ record, conflicts, onChange, onResolve, onClear }: {
  record: PersonalRecord; conflicts: Conflict[]; onChange: (r: PersonalRecord) => Promise<void>;
  onResolve: (key: string) => void; onClear: () => Promise<void>;
}) {
  const [error, setError] = useState(""); const [confirmClear, setConfirmClear] = useState(false);
  async function run(action: () => Promise<void>) { try { setError(""); await action(); } catch (error) { setError((error as Error).message); } }
  const values = entries(record);
  return <section className="stack"><div className="record-summary"><div className="section-head"><h2>{values.length ? `${values.length} details, ready to reuse.` : "Your record is empty."}</h2><p>Saved only in this browser. Scan another document anytime to fill in the gaps.</p></div></div>
    {error && <p role="alert" className="error">{error}</p>}
    {conflicts.map(conflict => <article className="card warning" key={conflict.key}><h3>Two documents disagree: {conflict.key}</h3>
      {[conflict.previous, conflict.incoming].map((field, i) => <p key={i}><strong className="mono">{field.value}</strong> from {field.source.docName}, {field.issuedAt ? `issued ${field.issuedAt}` : `scanned ${field.scannedAt.slice(0, 10)}`}</p>)}
      {conflict.incoming.issuedAt && conflict.previous.issuedAt && conflict.incoming.issuedAt > conflict.previous.issuedAt && <p>The new document was issued more recently.</p>}
      <div className="actions">{[false, true].map(useNew => <button key={String(useNew)} onClick={() => void run(async () => { await onChange(resolveConflict(record, conflict, useNew)); onResolve(conflict.key); })}>{useNew ? "Use new value" : "Keep saved value"}</button>)}</div>
    </article>)}
    {!values.length && <p className="notice">Scan an ID or a filled form to build your record, or import one you exported before.</p>}
    {["core", "extra", "formSpecific"].map(group => <details key={group} open={group === "core"} className="card"><summary>{group === "core" ? "Personal, address, family & IDs" : group === "extra" ? "Additional information" : "Last-used form answers (always reviewed)"}</summary>
      <div className="record-grid">{values.filter(([key]) => key.startsWith(group + ".")).map(([key, field]) => <label key={`${key}-${field.value}`}>
        <span>{prettyKey(key)}</span>
        <input defaultValue={field.value} onBlur={e => { if (e.target.value !== field.value) void run(() => onChange(putField(record, key, { ...makeValue(e.target.value), history: [...(field.history ?? []), { value: field.value, source: field.source.docName, scannedAt: field.scannedAt }] }))); }} />
        <small title={JSON.stringify(field.history ?? [])}>From {field.source.docName}, {field.scannedAt.slice(0, 10)}</small>
        {key.endsWith("Expiry") && /^\d{4}-\d{2}-\d{2}$/.test(field.value) && new Date(field.value) < new Date() && <small className="error">Expired na ang license mo noong {field.value}.</small>}
      </label>)}</div></details>)}
    <div className="actions"><button onClick={() => exportRecord(record)}>Export JSON</button><label className="button">Import JSON<input type="file" accept="application/json" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void run(async () => { await onChange(await importRecord(file)); }); e.target.value = ""; }} /></label>
      <button className="danger" onClick={() => setConfirmClear(true)}>Burahin ang record ko</button></div>
    {confirmClear && <div className="card warning"><p>Delete the record, signature, photo, and remembered answers from this browser?</p><div className="actions"><button className="danger" onClick={() => void run(async () => { await onClear(); setConfirmClear(false); })}>Delete my local record</button><button onClick={() => setConfirmClear(false)}>Cancel</button></div></div>}
  </section>;
}
