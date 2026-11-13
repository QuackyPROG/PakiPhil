import { get, set } from "idb-keyval";
import { chunks, pollOcr, post, uploadOcr } from "./api";
import { entries, formFieldSchema, type FormField, type PersonalRecord } from "./models";
import { recordPaths } from "./extraction";
import { computed } from "./record";
import { renderFile, type FormPage } from "./pdf";
import { z } from "zod";
import { detectE1, fillE1 } from "./demo-e1";
const detectedSchema = z.object({ fields: z.array(formFieldSchema) });
const mappingsSchema = z.object({ mappings: z.array(z.object({ label: z.string(), recordKey: z.string().optional(), status: z.enum(["green", "yellow", "red"]), reason: z.string().optional() })) });
export async function mapPage(page: FormPage, record: PersonalRecord): Promise<FormPage> {
  const values = Object.fromEntries(entries(record).map(([key, field]) => [key, field.value]));
  Object.assign(values, computed(record));
  const fields: FormField[] = [];
  for (let offset = 0; offset < page.fields.length; offset += 8) {
    const batch = page.fields.slice(offset, offset + 8);
    const mapped = mappingsSchema.parse(await post("/api/map-fields", {
      labels: batch.map(f => f.label), recordKeys: [...new Set([...recordPaths, ...Object.keys(values).filter(k => !k.startsWith("formSpecific."))])],
      formSpecificKeys: Object.keys(record.formSpecific).map(k => `formSpecific.${k}`),
    }));
    fields.push(...batch.map((field, i) => {
      const mapping = mapped.mappings[i];
      const value = mapping.recordKey ? values[mapping.recordKey] : undefined;
      return { ...field, ...mapping, value: field.type === "checkbox" ? undefined : value, status: field.type === "checkbox" ? "yellow" : value ? mapping.status : "red",
        reason: mapping.recordKey?.startsWith("formSpecific.") ? `Last time: ${value} — same?` : mapping.reason };
    }));
  }
  return { ...page, fields };
}
export async function analyzeForm(file: File, record: PersonalRecord, progress: (text: string) => void) {
  const e1 = await detectE1(file);
  if (e1) return fillE1(file, e1, record, progress);
  progress("Rendering pages…"); const pages = await renderFile(file);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))).map(v => v.toString(16).padStart(2, "0")).join("");
  const cacheKey = `pirma-form-layout-v1-${hash}`;
  const cached = await get(cacheKey);
  let layouts: FormPage[];
  if (cached && z.array(detectedSchema).safeParse(cached).success && cached.length === pages.length) {
    layouts = pages.map((page, i) => ({ ...page, fields: detectedSchema.parse(cached[i]).fields }));
    progress("Using cached blank-form layout…");
  } else {
    let labels: string[] = [];
    if (pages.some(p => !p.fields.length)) {
      progress("Reading labels — Lumen OCR…");
      const { documentId } = await uploadOcr(file);
      labels = (await pollOcr(documentId, progress)).map(p => p.text);
    }
    layouts = [];
    for (const page of pages) {
      progress(`Page ${page.number} of ${pages.length} — finding blanks…`);
      let fields = page.fields;
      if (!fields.length) fields = detectedSchema.parse(await post("/api/detect-fields", { pageImageBase64: page.image.split(",")[1], pageNumber: page.number })).fields;
      // Clean detected labels using OCR evidence, one bounded batch per call.
      if (labels[page.number - 1]) for (let i = 0; i < fields.length; i += 8) {
        const batch = fields.slice(i, i + 8);
        const cleaned = await post<{ labels: string[] }>("/api/clean-labels", { labels: batch.map(f => f.label), ocrText: chunks(labels[page.number - 1], 1600)[0] ?? "" });
        batch.forEach((f, n) => { f.label = cleaned.labels[n]; });
      }
      layouts.push({ ...page, fields });
    }
    await set(cacheKey, layouts.map(p => ({ fields: p.fields })));
  }
  const result: FormPage[] = [];
  for (const page of layouts) {
    progress(`Page ${page.number} of ${pages.length} — filling with Lumen AI…`);
    result.push(await mapPage(page, record)); progress(`Page ${page.number} of ${pages.length} ✓`);
  }
  return result;
}
