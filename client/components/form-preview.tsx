"use client";
/* eslint-disable @next/next/no-img-element -- Local page raster is also the export background. */
import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import type { FormField, PersonalRecord } from "@/lib/models";
import type { FormPage } from "@/lib/pdf";
export function FormPreview({ page, assets, onChange }: { page: FormPage; assets: PersonalRecord["assets"]; onChange: (f: FormField) => void }) {
  const ref = useRef<HTMLDivElement>(null); const [width, setWidth] = useState(1);
  useEffect(() => { const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width)); if (ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  const height = width * page.height / page.width;
  function box(field: FormField, x: number, y: number, w: number, h: number) {
    const left = Math.max(0, Math.min(x, width - w)), top = Math.max(0, Math.min(y, height - h));
    onChange({ ...field, box: [top / height * 1000, left / width * 1000, Math.min(1000, (top + h) / height * 1000), Math.min(1000, (left + w) / width * 1000)] });
  }
  return <div ref={ref} className="form-page" style={{ aspectRatio: `${page.width}/${page.height}` }}>
    <img src={page.image} alt={`Blank form page ${page.number}`} className="page-background" />
    {page.fields.map(field => {
      const [t,l,b,r] = field.box; const w = (r-l)/1000*width, h = (b-t)/1000*height;
      const asset = field.type === "signature" ? assets.signaturePng : field.type === "photo" ? assets.photoPng : undefined;
      return <Rnd key={field.id} bounds="parent" size={{ width: w, height: h }} position={{ x: l/1000*width, y: t/1000*height }} minWidth={8} minHeight={8}
        onDragStop={(_, d) => box(field, d.x, d.y, w, h)} onResizeStop={(_, __, el, ___, position) => box(field, position.x, position.y, el.offsetWidth, el.offsetHeight)}
        className={`answer ${field.status}`} title={`${field.label}: ${field.value ?? "Missing"}. Drag or resize to adjust.`}>
        <span style={{ fontSize: Math.max(7, Math.min(16, h * .65)) }}>{asset && field.value !== "skip" ? <img src={asset} alt={field.type} /> : field.type === "checkbox" ? field.value === "true" ? "✓" : "" : ["signature", "photo"].includes(field.type) ? "" : field.comb && field.value ? <span className="comb">{[...field.value].map((c, i) => <span key={i}>{c}</span>)}</span> : field.value || "?"}</span>
      </Rnd>;
    })}
  </div>;
}
