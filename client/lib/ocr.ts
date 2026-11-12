import { z } from "zod";
const wordSchema = z.object({ text: z.string(), index: z.number().int().nonnegative() });
export const pageSchema = z.object({ number: z.number().int().positive(), text: z.string(), words: z.array(wordSchema) });
export type OcrPage = z.infer<typeof pageSchema>;
// The pages spec leaves its 200 body unspecified; accept both public casing variants.
export function normalizePages(data: Record<string, unknown>): OcrPage[] {
  const raw = data.Pages ?? data.pages ?? data.Items;
  if (!Array.isArray(raw)) throw new Error("Lumen returned an unrecognized pages response.");
  return raw.map(p => {
    const words = p.Words ?? p.words ?? [];
    return pageSchema.parse({ number: p.PageNumber ?? p.pageNumber ?? p.number,
      text: p.Text ?? p.text ?? words.map((w: { Text?: string; text?: string }) => w.Text ?? w.text ?? "").join(" "),
      words: words.map((w: { Text?: string; text?: string; WordIndex?: number; index?: number }, i: number) => ({ text: w.Text ?? w.text, index: w.WordIndex ?? w.index ?? i })) });
  });
}
