"use client";
import { useState } from "react";
import type { OcrPage } from "@/lib/ocr";
import { post } from "@/lib/api";
export function OcrReview({ pages, documentId, onChange }: { pages: OcrPage[]; documentId: string; onChange: (pages: OcrPage[]) => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function correct(page: OcrPage, index: number, text: string) {
    const old = page.words.find(w => w.index === index)!;
    if (old.text === text || !text.trim()) return;
    setBusy(true); setMessage("");
    try {
      if (documentId !== "demo") await post(`/api/ocr/${encodeURIComponent(documentId)}/correct`, { pageNumber: page.number, wordIndex: index, text });
      onChange(pages.map(p => p.number !== page.number ? p : { ...p,
        text: p.text.replace(old.text, text), words: p.words.map(w => w.index === index ? { ...w, text } : w) }));
      setMessage(documentId === "demo" ? "Sample correction saved locally. No API call." : "Correction sent to Lumen OCR ✓");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <details className="card"><summary>Review OCR words · correct Lumen’s reading</summary>
    <p className="muted">Edit a word, then leave the box to send its correction. Extract your record after corrections finish.</p>
    {pages.map(page => <section key={page.number}><h3>Page {page.number}</h3><p className="ocr-text">{page.text}</p><div className="word-grid">
      {page.words.map(word => <label key={`${word.index}-${word.text}`}><small>Word {word.index}</small><input aria-label={`Page ${page.number} word ${word.index}`} defaultValue={word.text} disabled={busy} onBlur={e => void correct(page, word.index, e.target.value)} /></label>)}
    </div></section>)}<p role="status">{busy ? "Sending correction…" : message}</p>
  </details>;
}
