import { PDFDocument } from "pdf-lib";
import type { FormField } from "./models";
import { validateUpload } from "./upload";
export type FormPage = { number: number; image: string; width: number; height: number; fields: FormField[] };
function canvasImage(image: HTMLImageElement) {
  if (image.naturalWidth * image.naturalHeight > 24000000) throw new Error("Image is too large. Resize it below 24 megapixels.");
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = image.naturalWidth * scale; canvas.height = image.naturalHeight * scale;
  const context = canvas.getContext("2d")!; context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { number: 1, image: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height, fields: [] };
}
export async function renderFile(file: File): Promise<FormPage[]> {
  validateUpload(file);
  if (file.type !== "application/pdf") {
    const url = URL.createObjectURL(file);
    try { const image = new Image(); image.src = url; await image.decode(); return [canvasImage(image)]; }
    finally { URL.revokeObjectURL(url); }
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const original = await PDFDocument.load(bytes);
  if (original.getPageCount() > 3) throw new Error("The hackathon build supports forms with 1–3 pages. Split this PDF first.");
  const hasFields = original.getForm().getFields().length > 0;
  const pdfjs = await import("pdfjs-dist"); pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const loading = pdfjs.getDocument({ data: bytes });
  const document = await loading.promise;
  try {
    const result: FormPage[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number); const viewport = page.getViewport({ scale: 2 });
      if (viewport.width * viewport.height > 24000000) throw new Error("PDF page is too large to render.");
      const canvas = window.document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      const fields: FormField[] = [];
      if (hasFields) for (const annotation of await page.getAnnotations()) {
        if (annotation.subtype !== "Widget" || !annotation.fieldName || annotation.readOnly) continue;
        if (!["Tx", "Btn"].includes(annotation.fieldType) || annotation.pushButton || annotation.radioButton) continue;
        const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
        const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
        const box: FormField["box"] = [Math.min(y1,y2)/viewport.height*1000, Math.min(x1,x2)/viewport.width*1000, Math.max(y1,y2)/viewport.height*1000, Math.max(x1,x2)/viewport.width*1000];
        fields.push({ id: `p${number}-${fields.length}`, label: annotation.alternativeText || annotation.fieldName, box, type: annotation.fieldType === "Btn" ? "checkbox" : "text", status: "red" });
      }
      result.push({ number, image: canvas.toDataURL("image/png"), width: viewport.width, height: viewport.height, fields });
    }
    return result;
  } finally { await loading.destroy(); }
}
