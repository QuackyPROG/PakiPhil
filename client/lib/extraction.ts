import { z } from "zod";
import { personalKeys, addressKeys, idKeys } from "./models";
export const recordPaths = [...personalKeys.map(k => `core.${k}`), ...addressKeys.map(k => `core.address.${k}`), ...idKeys.map(k => `core.ids.${k}`)];
export const extractionSchema = z.object({ fields: z.array(z.object({
  key: z.string().refine(k => recordPaths.includes(k) || /^extra\.[a-zA-Z0-9_-]+$/.test(k)),
  value: z.string().min(1).max(500), pageNumber: z.number().int().positive(),
  wordIndices: z.array(z.number().int().nonnegative()),
  suggestion: z.string().optional(), reason: z.string().optional(),
})) });
export type Extraction = z.infer<typeof extractionSchema>;
