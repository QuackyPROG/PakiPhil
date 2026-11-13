import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PersonalRecord } from "./models";
import type { FormPage } from "./pdf";
export async function exportPdf(pages: FormPage[], assets: PersonalRecord["assets"]) {
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const source of pages) {
    const scale = Math.min(1, 842 / source.height);
    const width = source.width * scale, height = source.height * scale;
    const page = pdf.addPage([width, height]);
    page.drawImage(await pdf.embedPng(source.image), { x: 0, y: 0, width, height });
    for (const field of source.fields) {
      const [top, left, bottom, right] = field.box;
      const x = left / 1000 * width, y = (1000 - bottom) / 1000 * height;
      const w = (right - left) / 1000 * width, h = (bottom - top) / 1000 * height;
      const asset = field.type === "signature" ? assets.signaturePng : field.type === "photo" ? assets.photoPng : undefined;
      if (asset && field.value !== "skip") {
        const image = await pdf.embedPng(asset); const ratio = Math.min(w / image.width, h / image.height);
        page.drawImage(image, { x: x + (w - image.width * ratio) / 2, y, width: image.width * ratio, height: image.height * ratio });
      } else if (field.type === "checkbox" && field.value === "true") {
        page.drawLine({ start: { x: x + w * .15, y: y + h * .5 }, end: { x: x + w * .4, y: y + h * .2 }, thickness: 1.5 });
        page.drawLine({ start: { x: x + w * .4, y: y + h * .2 }, end: { x: x + w * .9, y: y + h * .85 }, thickness: 1.5 });
      } else if (field.comb && field.value) {
        const cell = w / field.comb, size = Math.min(12, h * .7);
        [...field.value].slice(0, field.comb).forEach((c, i) => page.drawText(c, { x: x + i * cell + (cell - font.widthOfTextAtSize(c, size)) / 2, y: y + Math.max(1, (h - size) / 2), size, font, color: rgb(.08, .16, .19) }));
      } else if (field.value && !["checkbox", "signature", "photo"].includes(field.type)) {
        let size = Math.min(12, h * .7);
        try { const measured = font.widthOfTextAtSize(field.value, size); if (measured > w - 4) size *= (w - 4) / measured; }
        catch { throw new Error(`“${field.label}” contains characters Helvetica cannot export. Use Latin text for this demo.`); }
        if (size < 4) throw new Error(`Answer for “${field.label}” does not fit. Enlarge its box or shorten the answer.`);
        page.drawText(field.value, { x: x + 2, y: y + Math.max(1, (h - size) / 2), size, font, color: rgb(.08, .16, .19) });
      }
    }
  }
  return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" });
}
