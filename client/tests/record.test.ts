import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyRecord, entries, makeValue, putField, recordSchema, formFieldSchema } from "../lib/models";
import { computed, mergeRecord, resolveConflict } from "../lib/record";
import { exportPdf } from "../lib/export";
import { PDFDocument } from "pdf-lib";
import { normalizePages } from "../lib/ocr";
import { validateUpload } from "../lib/upload";

test("merging keeps conflicting values until explicitly resolved, with history", () => {
  const old = putField(emptyRecord(), "core.firstName", makeValue("Juan", "ID"));
  const incoming = makeValue("John", "Certificate");
  const result = mergeRecord(old, [["core.firstName", incoming], ["core.address.city", makeValue("Pasig")]]);
  assert.equal(result.record.core.firstName?.value, "Juan");
  assert.equal(result.record.core.address?.city?.value, "Pasig");
  assert.equal(result.conflicts.length, 1);
  const resolved = resolveConflict(result.record, result.conflicts[0], true);
  assert.equal(resolved.core.firstName?.value, "John");
  assert.equal(resolved.core.firstName?.history?.[0].value, "Juan");
});
test("record round trip preserves provenance and remembered form answers", () => {
  let record = putField(emptyRecord(), "core.ids.sss", makeValue("00-0000000-0", "Sample ID"));
  record = putField(record, "formSpecific.position", makeValue("Cashier"));
  assert.deepEqual(recordSchema.parse(JSON.parse(JSON.stringify(record))), record);
  assert.equal(entries(record).length, 2);
  assert.throws(() => putField(record, "extra.__proto__.value", makeValue("bad")));
  assert.equal(Object.prototype.hasOwnProperty.call({}, "polluted"), false);
});
test("form coordinates must be ordered and inside the page", () => {
  const field = { id:"a", label:"Name", box:[10,20,40,80], type:"text", status:"red" };
  assert.ok(formFieldSchema.safeParse(field).success);
  assert.ok(!formFieldSchema.safeParse({ ...field, box:[40,20,10,80] }).success);
  assert.ok(!formFieldSchema.safeParse({ ...field, box:[10,-1,40,80] }).success);
});
test("uploads reject unsupported and oversized inputs", () => {
  assert.throws(() => validateUpload({ size:11*1024*1024,type:"application/pdf" }));
  assert.throws(() => validateUpload({ size:100,type:"image/svg+xml" }));
  assert.doesNotThrow(() => validateUpload({ size:100,type:"image/png" }));
});
test("computed full name never mutates original values", () => {
  let record = putField(emptyRecord(), "core.firstName", makeValue("Juan"));
  record = putField(record, "core.lastName", makeValue("Dela Cruz"));
  assert.equal(computed(record)["computed.fullName"], "Juan Dela Cruz");
  assert.equal(record.core.lastName?.value, "Dela Cruz");
});
test("normalize OCR words retains provider indices used by correction API", () => {
  const pages = normalizePages({ Pages:[{ PageNumber:1,Text:"Juan",Words:[{ Text:"Juan",WordIndex:7 }] }] });
  assert.equal(pages[0].words[0].index, 7);
  assert.throws(() => normalizePages({ nope:[] }));
});
test("export creates a readable page and rejects unexportable text", async () => {
  const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  const page = { number:1,image,width:595,height:842,fields:[{ id:"name",label:"Name",box:[50,50,100,600] as [number,number,number,number],type:"text" as const,status:"green" as const,value:"Peña" }] };
  const blob = await exportPdf([page], {});
  const pdf = await PDFDocument.load(await blob.arrayBuffer());
  assert.equal(pdf.getPageCount(), 1);
  await assert.rejects(exportPdf([{ ...page,fields:[{ ...page.fields[0],value:"😀" }] }], {}), /cannot export/);
});
