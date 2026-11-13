import { del, get, set } from "idb-keyval";
import { emptyRecord, recordSchema, type PersonalRecord } from "./models";
const KEY = "pirma-lang-record-v1";
export async function loadRecord(): Promise<PersonalRecord> {
  const saved = await get(KEY);
  return saved ? recordSchema.parse(saved) : emptyRecord();
}
export async function saveRecord(record: PersonalRecord) { await set(KEY, recordSchema.parse(record)); }
export async function clearRecord() { await del(KEY); }
export function download(data: Blob, name: string) {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function exportRecord(record: PersonalRecord) {
  download(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }), "paphil-record.json");
}
export async function importRecord(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Record must be under 10 MB.");
  return recordSchema.parse(JSON.parse(await file.text()));
}
