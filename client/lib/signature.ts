import type { PersonalRecord } from "./models";

/** Saves what is on the pad. An empty pad (null) removes the saved signature instead of keeping the old one. */
export function saveSignature(record: PersonalRecord, png: string | null): PersonalRecord {
  const assets = { ...record.assets };
  if (png) assets.signaturePng = png; else delete assets.signaturePng;
  return { ...record, assets };
}
