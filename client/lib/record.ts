import { entries, putField, type FieldValue, type PersonalRecord } from "./models";
export type Conflict = { key: string; previous: FieldValue; incoming: FieldValue };
export function mergeRecord(record: PersonalRecord, fields: [string, FieldValue][]) {
  let merged = record;
  const conflicts: Conflict[] = [];
  const saved = new Map(entries(record));
  for (const [key, incoming] of fields) {
    const previous = saved.get(key);
    if (previous && previous.value !== incoming.value) conflicts.push({ key, previous, incoming });
    else merged = putField(merged, key, previous ?? incoming);
  }
  return { record: merged, conflicts };
}
export function resolveConflict(record: PersonalRecord, conflict: Conflict, useNew: boolean) {
  const chosen = useNew ? conflict.incoming : conflict.previous;
  const other = useNew ? conflict.previous : conflict.incoming;
  return putField(record, conflict.key, { ...chosen, history: [...(conflict.previous.history ?? []),
    { value: other.value, source: other.source.docName, scannedAt: other.scannedAt }] });
}
export function computed(record: PersonalRecord): Record<string, string> {
  const values = new Map(entries(record).map(([key, field]) => [key, field.value]));
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const result: Record<string, string> = { "computed.today": today };
  const name = ["firstName", "middleName", "lastName", "suffix"].map(k => values.get(`core.${k}`)).filter(Boolean).join(" ");
  if (name) result["computed.fullName"] = name;
  const date = values.get("core.birthDate");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    const age = ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
    if (age >= 0 && age < 130) result["computed.age"] = String(age);
  }
  return result;
}
