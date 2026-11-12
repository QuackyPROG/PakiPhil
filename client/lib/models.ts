import { z } from "zod";

export const fieldValueSchema = z.object({
  value: z.string().max(2000),
  source: z.object({ docType: z.string(), docName: z.string() }),
  scannedAt: z.iso.datetime(), issuedAt: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  history: z.array(z.object({ value: z.string(), source: z.string(), scannedAt: z.string() })).optional(),
});
const fields = (keys: string[]) => z.object(Object.fromEntries(keys.map(key => [key, fieldValueSchema.optional()])));
export const personalKeys = ["firstName", "middleName", "lastName", "suffix", "sex", "birthDate", "birthPlace", "civilStatus", "citizenship", "mobile", "email", "fatherName", "motherMaidenName", "spouseName"];
export const addressKeys = ["houseNo", "street", "barangay", "city", "province", "zip"];
export const idKeys = ["philsysPcn", "tin", "sss", "pagibigMid", "philhealthPin", "driversLicense", "driversLicenseExpiry"];
export const recordSchema = z.object({
  version: z.literal(1),
  core: fields(personalKeys).extend({ address: fields(addressKeys).optional(), ids: fields(idKeys).optional() }),
  extra: z.record(z.string(), fieldValueSchema),
  formSpecific: z.record(z.string(), fieldValueSchema),
  assets: z.object({ signaturePng: z.string().startsWith("data:image/png;base64,").optional(), photoPng: z.string().startsWith("data:image/png;base64,").optional() }),
});
export const boxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()])
  .refine(b => b.every(n => n >= 0 && n <= 1000) && b[2] > b[0] && b[3] > b[1], "Invalid answer box");
export const formFieldSchema = z.object({
  id: z.string(), label: z.string().min(1).max(200), box: boxSchema,
  type: z.enum(["text", "date", "checkbox", "signature", "photo"]),
  options: z.array(z.string()).optional(), recordKey: z.string().optional(),
  value: z.string().optional(), status: z.enum(["green", "yellow", "red"]), reason: z.string().optional(),
});
export type PersonalRecord = z.infer<typeof recordSchema>;
export type FieldValue = z.infer<typeof fieldValueSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export const emptyRecord = (): PersonalRecord => ({ version: 1, core: {}, extra: {}, formSpecific: {}, assets: {} });
export function entries(record: PersonalRecord): [string, FieldValue][] {
  const result: [string, FieldValue][] = [];
  for (const [key, value] of Object.entries(record.core)) {
    if (!value) continue;
    if ("value" in value) result.push([`core.${key}`, value as FieldValue]);
    else for (const [nested, field] of Object.entries(value)) if (field) result.push([`core.${key}.${nested}`, field]);
  }
  for (const group of ["extra", "formSpecific"] as const)
    for (const [key, value] of Object.entries(record[group])) result.push([`${group}.${key}`, value]);
  return result;
}
export function putField(record: PersonalRecord, path: string, field: FieldValue): PersonalRecord {
  const next = structuredClone(record);
  const parts = path.split(".");
  if (!/^(core\.(firstName|middleName|lastName|suffix|sex|birthDate|birthPlace|civilStatus|citizenship|mobile|email|fatherName|motherMaidenName|spouseName)|core\.address\.(houseNo|street|barangay|city|province|zip)|core\.ids\.(philsysPcn|tin|sss|pagibigMid|philhealthPin|driversLicense|driversLicenseExpiry)|(extra|formSpecific)\.[a-zA-Z0-9_-]+)$/.test(path)) throw new Error("Unknown record key");
  let target = next as unknown as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) target = (target[part] ??= {}) as Record<string, unknown>;
  target[parts.at(-1)!] = field;
  return recordSchema.parse(next);
}
export const makeValue = (value: string, docName = "User answer", docType = "User confirmed"): FieldValue =>
  ({ value, source: { docName, docType }, scannedAt: new Date().toISOString() });
