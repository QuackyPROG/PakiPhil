"use client";
import { useRef, useState } from "react";
import type { PersonalRecord } from "@/lib/models";
export function Assets({ record, onChange }: { record: PersonalRecord; onChange: (record: PersonalRecord) => Promise<void> }) {
  const canvas = useRef<HTMLCanvasElement>(null); const drawing = useRef(false); const dirty = useRef(false);
  const [message, setMessage] = useState("");
  async function save() {
    try {
      if (!dirty.current) throw new Error("Draw your signature first.");
      await onChange({ ...record, assets: { ...record.assets, signaturePng: canvas.current!.toDataURL("image/png") } });
      setMessage("Signature saved in this browser ✓");
    } catch (error) { setMessage((error as Error).message); }
  }
  return <details className="card"><summary>Signature & 1×1 photo</summary><p className="muted">Draw with your mouse or finger. You choose whether to place this on each form.</p>
    <canvas ref={canvas} width={600} height={180} className="signature-pad" aria-label="Draw your signature" onPointerDown={e => {
      e.currentTarget.setPointerCapture(e.pointerId); drawing.current = true; dirty.current = true;
      const bounds = e.currentTarget.getBoundingClientRect(); const ctx = e.currentTarget.getContext("2d")!;
      ctx.beginPath(); ctx.moveTo((e.clientX-bounds.left)*600/bounds.width, (e.clientY-bounds.top)*180/bounds.height);
    }} onPointerMove={e => {
      if (!drawing.current) return;
      const bounds = e.currentTarget.getBoundingClientRect(); const ctx = e.currentTarget.getContext("2d")!;
      ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#173d38";
      ctx.lineTo((e.clientX-bounds.left)*600/bounds.width, (e.clientY-bounds.top)*180/bounds.height); ctx.stroke();
    }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
    <div className="actions"><button onClick={() => { canvas.current?.getContext("2d")?.clearRect(0,0,600,180); dirty.current = false; }}>Clear drawing</button><button onClick={() => void save()}>Save signature</button>
      <label className="button">Upload 1×1 photo<input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={async e => {
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
      }} /></label></div><p role="status">{message}</p>
  </details>;
}
