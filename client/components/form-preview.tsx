"use client";
/* eslint-disable @next/next/no-img-element -- Local page raster is also the export background. */
import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { FormField, PersonalRecord } from "@/lib/models";
import type { FormPage } from "@/lib/pdf";
import { usePhilContext } from "./mascot";
import { gsap, reducedMotion, useGSAP } from "./ui/motion";

/** The form page with every answer on it. Drag or resize a box to move it; double-click it to type straight onto the paper. */
export function FormPreview({ page, assets, onChange, fit = "page" }: { page: FormPage; assets: PersonalRecord["assets"]; onChange: (f: FormField) => void; fit?: "page" | "width" }) {
  const frame = useRef<HTMLDivElement>(null); const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 }); const [editing, setEditing] = useState<string | null>(null);
  const { sfx } = usePhilContext();
  const statuses = useRef(new Map<string, FormField["status"]>());
  // Size the page to the space it has: the whole page in view ("page"), or full width with scrolling ("width").
  useEffect(() => {
    const el = frame.current; if (!el) return;
    const measure = () => {
      const ratio = page.height / page.width, cw = el.clientWidth, ch = el.clientHeight;
      const w = fit === "width" || !ch ? cw : Math.min(cw, ch / ratio);
      setSize({ w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(w * ratio)) });
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(el); return () => observer.disconnect();
  }, [page.width, page.height, fit]);
  const { w: width, h: height } = size;
  // Focal moment: answers stamp onto the paper when a page opens, one after another.
  useGSAP(() => {
    statuses.current = new Map(page.fields.map(f => [f.id, f.status]));
    if (reducedMotion()) return;
    const filled = gsap.utils.toArray<HTMLElement>(".answer.green > span, .answer.yellow > span", ref.current);
    gsap.from(filled, { scale: 1.8, opacity: 0, duration: 0.32, ease: "power3.in", stagger: { amount: Math.min(1.6, filled.length * 0.05) }, clearProps: "transform,opacity" });
    gsap.from(".answer.red", { opacity: 0, duration: 0.4, delay: 0.6 });
  }, { dependencies: [page.number, width > 1], scope: ref });
  // A confirmed answer gets its own stamp.
  useGSAP(() => {
    for (const field of page.fields) {
      const before = statuses.current.get(field.id); statuses.current.set(field.id, field.status);
      if (before && before !== "green" && field.status === "green") {
        sfx("stamp");
        if (!reducedMotion()) gsap.from(`[data-field="${field.id}"]`, { scale: 2.2, rotate: -8, opacity: 0, duration: 0.34, ease: "power4.in", clearProps: "transform,opacity" });
      }
    }
  }, { dependencies: [page.fields], scope: ref });
  function box(field: FormField, x: number, y: number, w: number, h: number) {
    const left = Math.max(0, Math.min(x, width - w)), top = Math.max(0, Math.min(y, height - h));
    onChange({ ...field, box: [top / height * 1000, left / width * 1000, Math.min(1000, (top + h) / height * 1000), Math.min(1000, (left + w) / width * 1000)] });
  }
  function edit(field: FormField) {
    const asset = field.type === "signature" ? assets.signaturePng : field.type === "photo" ? assets.photoPng : undefined;
    if (field.type === "checkbox") return onChange({ ...field, value: field.value === "true" ? "false" : "true", status: "green", reason: "Set on the form" });
    if (field.type === "signature" || field.type === "photo") {
      if (!asset) return; // Nothing saved to place yet; the toolbar's signature button covers that.
      return onChange({ ...field, value: field.value === "skip" ? "asset" : "skip", status: "green", reason: "Set on the form" });
    }
    setEditing(field.id);
  }
  function commit(field: FormField, value: string) {
    setEditing(null);
    const clean = value.trim();
    if (clean === (field.value ?? "") || !clean) return;
    onChange({ ...field, value: clean, status: "green", reason: "Typed on the form" });
  }
  return <div ref={frame} className={`form-frame fit-${fit}`}>
    <div ref={ref} className="form-page" style={{ width, height }}>
      <img src={page.image} alt={`Blank form page ${page.number}`} className="page-background" />
      {width > 1 && page.fields.map(field => {
        const [t,l,b,r] = field.box; const w = (r-l)/1000*width, h = (b-t)/1000*height;
        const asset = field.type === "signature" ? assets.signaturePng : field.type === "photo" ? assets.photoPng : undefined;
        const isEditing = editing === field.id;
        const fontSize = Math.max(7, Math.min(16, h * .65));
        return <Rnd key={field.id} bounds="parent" size={{ width: w, height: h }} position={{ x: l/1000*width, y: t/1000*height }} minWidth={8} minHeight={8}
          disableDragging={isEditing} enableResizing={!isEditing}
          onDragStop={(_, d) => box(field, d.x, d.y, w, h)} onResizeStop={(_, __, el, ___, position) => box(field, position.x, position.y, el.offsetWidth, el.offsetHeight)}
          className={`answer ${field.status} ${isEditing ? "editing" : ""}`} title={`${field.label}: ${field.value ?? "Missing"}. Double-click to edit, drag to move.`}>
          {isEditing
            ? <input autoFocus className="inline-answer" aria-label={`Edit ${field.label} on the form`} defaultValue={field.value ?? ""} style={{ fontSize }}
                onFocus={e => e.currentTarget.select()} onMouseDown={e => e.stopPropagation()}
                onBlur={e => commit(field, e.currentTarget.value)}
                onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.currentTarget.value = field.value ?? ""; e.currentTarget.blur(); } }} />
            : <span data-field={field.id} style={{ fontSize }} onDoubleClick={() => edit(field)}>{asset && field.value !== "skip" ? <img src={asset} alt={field.type} /> : field.type === "checkbox" ? field.value === "true" ? "✓" : "" : ["signature", "photo"].includes(field.type) ? "" : field.comb && field.value ? <span className="comb">{[...field.value].map((c, i) => <span key={i}>{c}</span>)}</span> : field.value || "?"}</span>}
        </Rnd>;
      })}
    </div>
  </div>;
}
