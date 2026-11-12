import type { OcrPage } from "./ocr";
import { validateUpload } from "./upload";
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, signal: init?.signal ?? AbortSignal.timeout(90000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}
export const post = <T>(path: string, body: unknown) => api<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export async function uploadOcr(file: File) {
  validateUpload(file);
  return api<{ documentId: string }>("/api/ocr", { method: "POST", body: file,
    headers: { "Content-Type": file.type, "X-Lumen-Document-Name": encodeURIComponent(file.name) } });
}
export async function pollOcr(id: string, progress: (text: string) => void) {
  const end = Date.now() + 60000;
  while (Date.now() < end) {
    const result = await api<{ status: string; pages?: OcrPage[] }>(`/api/ocr/${encodeURIComponent(id)}`);
    if (["READY", "PARTIAL"].includes(result.status)) {
      progress(result.status === "PARTIAL" ? "Some pages failed. Review the available pages." : "Done — Lumen OCR");
      if (!result.pages?.length) throw new Error("No readable pages were returned.");
      return result.pages;
    }
    if (result.status === "FAILED") throw new Error("Lumen could not read this document. Use Retry.");
    progress("Reading — Lumen OCR…");
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
  throw new Error("Reading took over 60 seconds. Resume polling or retry the failed read.");
}
export function chunks(text: string, size = 2400): string[] {
  const result: string[] = [];
  let rest = text;
  while (rest.length > size) {
    const newline = rest.lastIndexOf("\n", size);
    const cut = newline > size / 2 ? newline : rest.lastIndexOf(" ", size);
    const end = cut > 0 ? cut : size;
    result.push(rest.slice(0, end)); rest = rest.slice(end).trimStart();
  }
  if (rest.trim()) result.push(rest);
  return result;
}
