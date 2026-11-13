"use client";
/* eslint-disable @next/next/no-img-element -- Local 1x1 photo preview. */
import { useEffect, useRef, useState } from "react";
import type { PersonalRecord } from "@/lib/models";
import { saveSignature } from "@/lib/signature";
import { IconPen } from "./ui/icons";

const W = 600, H = 180;
/** Signature pad and 1×1 photo. The pad always shows what is saved; saving an empty pad removes the saved signature. */
function AssetsBody({ record, onChange }: { record: PersonalRecord; onChange: (record: PersonalRecord) => Promise<void> }) {
  const canvas = useRef<HTMLCanvasElement>(null); const drawing = useRef(false);
  const [inked, setInked] = useState(!!record.assets.signaturePng); const [changed, setChanged] = useState(false);
  const [message, setMessage] = useState("");
  const saved = record.assets.signaturePng;
  // Show the saved signature on the pad, so "clear" visibly clears the real thing.
  useEffect(() => {
    const ctx = canvas.current?.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, W, H); setInked(!!saved); setChanged(false);
    if (!saved) return;
    const image = new Image(); image.onload = () => ctx.drawImage(image, 0, 0, W, H); image.src = saved;
  }, [saved]);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - bounds.left) * W / bounds.width, (e.clientY - bounds.top) * H / bounds.height] as const;
  }
  async function save() {
    try {
      const png = inked ? canvas.current!.toDataURL("image/png") : null;
      if (!png && !saved) throw new Error("Draw your signature first.");
      await onChange(saveSignature(record, png)); setChanged(false);
      setMessage(png ? "Signature saved in this browser ✓" : "Signature removed from this browser ✓");
    } catch (error) { setMessage((error as Error).message); }
  }
  return <>
    <p className="muted">Draw with a mouse or finger. You choose, form by form, whether to place it.</p>
    <canvas ref={canvas} width={W} height={H} className="signature-pad" aria-label="Draw your signature" onPointerDown={e => {
      e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; setInked(true); setChanged(true); setMessage("");
      const ctx = e.currentTarget.getContext("2d")!; ctx.beginPath(); ctx.moveTo(...point(e));
    }} onPointerMove={e => {
      if (!drawing.current) return;
      const ctx = e.currentTarget.getContext("2d")!;
      ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#1b2a6b"; ctx.lineTo(...point(e)); ctx.stroke();
    }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
    <div className="actions">
      <button type="button" disabled={!inked} onClick={() => { canvas.current?.getContext("2d")?.clearRect(0, 0, W, H); setInked(false); setChanged(true); setMessage(saved ? "Cleared. Save to remove your saved signature." : ""); }}>Clear drawing</button>
      <button type="button" className={changed ? "primary" : ""} disabled={!changed} onClick={() => void save()}>{!inked && saved ? "Remove signature" : "Save signature"}</button>
      <label className="button">{record.assets.photoPng && <img src={record.assets.photoPng} alt="" className="photo-thumb" />}{record.assets.photoPng ? "Change 1×1 photo" : "Upload 1×1 photo"}<input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
        let url = "";
        try {
          if (file.size > 10*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)) throw new Error("Use a PNG/JPG/WebP under 10 MB.");
          url = URL.createObjectURL(file); const image = new Image(); image.src = url; await image.decode();
          const photo = document.createElement("canvas"); photo.width = photo.height = 300;
          const edge = Math.min(image.naturalWidth, image.naturalHeight);
          photo.getContext("2d")!.drawImage(image, (image.naturalWidth-edge)/2, (image.naturalHeight-edge)/2, edge, edge, 0, 0, 300, 300);
          await onChange({ ...record, assets: { ...record.assets, photoPng: photo.toDataURL("image/png") } }); setMessage("Photo saved ✓");
        } catch (error) { setMessage((error as Error).message); }
        finally { if (url) URL.revokeObjectURL(url); }
      }} /></label>
    </div>
    <p role="status">{message}</p>
  </>;
}

/** Collapsible card, for the record screen. */
export function Assets(props: { record: PersonalRecord; onChange: (record: PersonalRecord) => Promise<void> }) {
  return <details className="card"><summary>My signature & photo</summary><AssetsBody {...props} /></details>;
}

/** A toolbar button that opens the signature pad in a dialog, so it never pushes the form down. */
export function AssetsButton(props: { record: PersonalRecord; onChange: (record: PersonalRecord) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()}><IconPen />{props.record.assets.signaturePng ? "Signature ✓" : "Add signature"}</button>
    <dialog ref={dialog} className="sheet-dialog" aria-label="My signature and photo" onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
      <div className="stack">
        <div className="field-heading"><h2>My signature & photo</h2><button type="button" className="text-button" onClick={() => dialog.current?.close()}>Done</button></div>
        <AssetsBody {...props} />
      </div>
    </dialog>
  </>;
}
