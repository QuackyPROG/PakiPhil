"use client";
import { useRef, useState } from "react";
import { validateUpload } from "@/lib/upload";
import { IconUpload } from "./ui/icons";
import { CameraButton } from "./camera";
export function Upload({ onFile, disabled, title = "Choose a document", kind = "form" }: { onFile: (file: File) => void; disabled?: boolean; title?: string; kind?: "id" | "form" }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(""); const [over, setOver] = useState(false);
  function choose(file?: File) {
    if (!file || disabled) return;
    try { validateUpload(file); setError(""); onFile(file); }
    catch (error) { setError((error as Error).message); }
  }
  return <div className="upload-wrap"><button className={`upload ${over ? "over" : ""}`} disabled={disabled} onClick={() => input.current?.click()}
    onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
    onDrop={e => { e.preventDefault(); setOver(false); choose(e.dataTransfer.files[0]); }}>
    <span className="upload-icon" aria-hidden><IconUpload /></span><strong>{title}</strong><span>or click to choose a file</span><small>PDF, JPG, PNG or WebP, up to 10 MB</small>
  </button><input hidden ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => { choose(e.target.files?.[0]); e.target.value = ""; }} />
  <div className="upload-alt"><span>{kind === "id" ? "Hawak mo ang ID?" : "Papel ang form?"}</span><CameraButton kind={kind} disabled={disabled} onFile={choose} /></div>
  {error && <p role="alert" className="error">{error}</p>}</div>;
}
