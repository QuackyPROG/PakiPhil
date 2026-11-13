"use client";
import { useState } from "react";
import type { OcrPage } from "@/lib/ocr";
import { post } from "@/lib/api";
export function OcrReview({ pages, documentId, onChange, onBusyChange }: { pages: OcrPage[]; documentId: string; onChange: (pages: OcrPage[]) => void; onBusyChange: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function correct(page: OcrPage, index: number, text: string) {
    const old = page.words.find(w => w.index === index)!;
    if (old.text === text) return true;
    if (!text.trim()) { setMessage("Enter a non-empty OCR word."); return false; }
    setBusy(true); onBusyChange(true); setMessage("");
    try {
      if (!documentId.startsWith("demo")) await post(`/api/ocr/${encodeURIComponent(documentId)}/correct`, { pageNumber: page.number, wordIndex: index, text });
      onChange(pages.map(p => p.number !== page.number ? p : { ...p,
        text: p.words.map(w => w.index === index ? text : w.text).join(" "), words: p.words.map(w => w.index === index ? { ...w, text } : w) }));
      setMessage(documentId === "demo" ? "Sample correction saved locally. No API call." : "Correction sent to Lumen OCR ✓");
      return true;
    } catch (error) { setMessage((error as Error).message); return false; }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <details className="card"><summary>See what Lumen OCR read ({pages.reduce((n, p) => n + p.words.length, 0)} words)</summary>
    <p className="muted">Spot a misread word? Fix it here and leave the box; the correction goes back to Lumen.</p>
    {pages.map(page => <section key={page.number}><h3>Page {page.number}</h3><p className="ocr-text">{page.text}</p><div className="word-grid">
      {page.words.map(word => <label key={`${word.index}-${word.text}`}><small>Word {word.index}</small><input aria-label={`Page ${page.number} word ${word.index}`} defaultValue={word.text} disabled={busy} onBlur={async e => { const input = e.currentTarget; if (!await correct(page, word.index, input.value)) input.value = word.text; }} /></label>)}
    </div></section>)}<p role="status">{busy ? "Sending correction…" : message}</p>
  </details>;
}
