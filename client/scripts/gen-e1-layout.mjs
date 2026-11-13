// Generates lib/demo-e1-layout.json (answer boxes for the SSS E-1 demo form) from the
// filled sample in public/demo. Values are positioned text in font g_d0_f6/f7/f8; the blank
// form's labels are checked so no label ever sits inside an answer box.
//   node scripts/gen-e1-layout.mjs
import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const VALUE_FONTS = new Set(["g_d0_f6", "g_d0_f7", "g_d0_f8"]);
async function items(file) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
  const pages = {};
  for (const n of [1, 3]) {
    const page = await doc.getPage(n); const vp = page.getViewport({ scale: 1 });
    pages[n] = (await page.getTextContent()).items.filter(i => i.str.trim()).map(i => ({
      str: i.str, font: i.fontName,
      top: (vp.height - i.transform[5] - i.height) / vp.height * 1000, left: i.transform[4] / vp.width * 1000,
      width: i.width / vp.width * 1000, height: i.height / vp.height * 1000,
    }));
  }
  return pages;
}
const filled = await items("public/demo/E1-Personal-Record-FILLED.pdf");
const blank = await items("public/demo/E1-Personal-Record.pdf");

// Rows of the registrant part, top to bottom, each listing record keys left to right.
// `null` = skip (SSS-only), "N/A" = constant not-applicable answer, "#key" = digit comb.
const person = (p) => [`extra.${p}LastName`, `extra.${p}FirstName`, `extra.${p}MiddleName`, `extra.${p}Suffix`];
const ROWS = {
  1: [
    [45.5, ["core.ids.sss"]],
    [167.3, ["core.lastName", "core.firstName", "core.middleName", "core.suffix", "#core.birthDate"]],
    [198.2, ["#core.ids.tin"]],
    [229.2, ["core.citizenship", "extra.religion", "core.birthPlace", "extra.birthPlaceAbroad"]],
    [257.6, ["extra.unitBldg", "core.address.houseNo", "core.address.street", "extra.subdivision"]],
    [282.8, ["core.address.barangay", "core.address.city", "core.address.province", "extra.country", "core.address.zip"]],
    [307.4, ["core.mobile", "core.email", "extra.telephone"]],
    [334.0, person("father")],
    [360.5, person("mother")],
    [402.1, [...person("spouse"), "#extra.spouseBirthDate"]],
    ...[434.7, 457.0, 479.3, 501.6, 523.9].map((top, i) => [top, [...person(`child${i + 1}`), `#extra.child${i + 1}BirthDate`]]),
    [563.1, ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]],
    [585.4, ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]],
    [626.9, ["N/A"]], [640.8, ["N/A", "N/A"]], [641.4, ["extra.business"]], [659.7, ["N/A"]],
    [671.1, ["extra.businessStartYear"]], [690.0, ["N/A"]], [700.1, ["extra.monthlyEarnings", "N/A"]],
    [805.6, ["signature"]], [810.0, ["computed.today"]], [810.6, ["computed.printedName"]],
  ],
  3: [
    [39.1, ["core.ids.sss"]],
    [133.2, ["core.lastName", "core.firstName", "core.middleName", "core.suffix"]],
    [177.9, [...person("child6"), "#extra.child6BirthDate"]],
    [200.2, [...person("child7"), "#extra.child7BirthDate"]],
    ...[222.5, 244.8, 267.0].map(top => [top, ["N/A", "N/A", "N/A", "N/A", "N/A"]]),
    [306.4, ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]], [328.7, ["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]],
    [357.3, ["signature"]], [361.7, ["computed.today"]], [362.4, ["computed.printedName"]],
  ],
};
const LABELS = {
  "core.ids.sss": "SS number", "core.lastName": "Last name", "core.firstName": "First name", "core.middleName": "Middle name",
  "core.suffix": "Suffix", "core.birthDate": "Date of birth", "core.ids.tin": "Tax identification number (TIN)",
  "core.citizenship": "Nationality", "extra.religion": "Religion", "core.birthPlace": "Place of birth",
  "extra.birthPlaceAbroad": "Place of birth (if outside the Philippines)", "extra.unitBldg": "Rm./Flr./Unit no. & bldg. name",
  "core.address.houseNo": "House/lot & blk. no.", "core.address.street": "Street name", "extra.subdivision": "Subdivision",
  "core.address.barangay": "Barangay", "core.address.city": "City/municipality", "core.address.province": "Province",
  "extra.country": "Country", "core.address.zip": "ZIP code", "core.mobile": "Mobile number", "core.email": "E-mail address",
  "extra.telephone": "Telephone number", "extra.business": "Profession/business", "extra.businessStartYear": "Year prof./business started",
  "extra.monthlyEarnings": "Monthly earnings (₱)", "computed.today": "Date", "computed.printedName": "Printed name", signature: "Signature",
};
const WHO = { father: "Father", mother: "Mother's maiden name", spouse: "Spouse" };
function label(key) {
  if (LABELS[key]) return LABELS[key];
  const m = key.match(/^extra\.(father|mother|spouse|child(\d))(LastName|FirstName|MiddleName|Suffix|BirthDate)$/);
  const part = { LastName: "last name", FirstName: "first name", MiddleName: "middle name", Suffix: "suffix", BirthDate: "date of birth" }[m[3]];
  return `${m[2] ? `Child ${m[2]}` : WHO[m[1]]} — ${part}`;
}

const out = [];
for (const [page, rows] of Object.entries(ROWS)) {
  const values = filled[page].filter(i => VALUE_FONTS.has(i.font));
  for (const [top, keys] of rows) {
    const nearest = i => rows.reduce((best, r) => Math.abs(r[0] - i.top) < Math.abs(best - i.top) ? r[0] : best, rows[0][0]);
    const row = values.filter(i => Math.abs(i.top - top) < 3 && nearest(i) === top).sort((a, b) => a.left - b.left);
    // Merge single digits spaced ~24 apart into combs.
    const groups = [];
    for (const it of row) {
      const last = groups.at(-1);
      if (/^\d$/.test(it.str) && last?.digits && it.left - last.items.at(-1).left < 26) last.items.push(it);
      else groups.push({ digits: /^\d$/.test(it.str), items: [it] });
    }
    if (groups.length !== keys.length) throw new Error(`p${page} row ${top}: ${groups.length} groups ${JSON.stringify(groups.map(g => g.items.map(i => i.str).join("")))} vs ${keys.length} keys`);
    groups.forEach((g, i) => {
      let key = keys[i]; const comb = key.startsWith("#"); if (comb) key = key.slice(1);
      const first = g.items[0], lastItem = g.items.at(-1);
      const next = groups[i + 1]?.items[0];
      const height = Math.max(...g.items.map(x => x.height));
      const left = comb ? first.left - 7 : first.left - 1.5;
      const right = comb ? lastItem.left + lastItem.width + 7 : Math.min(next ? next.left - 6 : 985, Math.max(lastItem.left + lastItem.width + 60, first.left + first.width + 4));
      const box = [+(top - 2).toFixed(1), +left.toFixed(1), +(top + height + 1.5).toFixed(1), +Math.min(right, 990).toFixed(1)];
      const sample = g.items.map(x => x.str).join(comb ? "" : " ");
      out.push({ page: +page, key, label: key === "N/A" ? "Not applicable" : label(key), box, sample,
        ...(comb ? { comb: g.items.length } : {}), type: key === "signature" ? "signature" : comb ? "date" : "text" });
    });
  }
}
// Checkmarks are vector paths, so place these from the printed labels beside them.
const nextTo = (page, text, keyPair) => {
  const l = blank[page].find(i => i.str.trim() === text);
  return { page, key: keyPair[0], label: keyPair[1], type: "checkbox", sample: "true", box: [+(l.top - 1).toFixed(1), +(l.left - 17).toFixed(1), +(l.top + l.height + 0.5).toFixed(1), +(l.left - 3).toFixed(1)] };
};
out.push(nextTo(1, "Male", ["check.sexMale", "Sex — Male"]), nextTo(1, "Married", ["check.civilMarried", "Civil status — Married"]),
  nextTo(1, "Check this box if using additional sheet.", ["check.additionalSheet", "Uses additional sheet"]), nextTo(1, "NO", ["check.flexiNo", "Flexi-Fund — No"]));

// No blank-form label may have its centre inside an answer box (except checkboxes, which sit beside labels).
for (const f of out.filter(f => f.type !== "checkbox")) {
  const hit = blank[f.page].find(i => { const cy = i.top + i.height / 2, cx = i.left + Math.min(i.width, 30) / 2; return cy > f.box[0] && cy < f.box[2] && cx > f.box[1] && cx < f.box[3]; });
  if (hit) console.warn(`label "${hit.str}" inside ${f.key} box on p${f.page}`);
}
fs.writeFileSync("lib/demo-e1-layout.json", JSON.stringify(out, null, 0).replaceAll("},{", "},\n{"));
console.log(`${out.length} fields → lib/demo-e1-layout.json`);

// Fingerprint each demo PDF with the answer boxes it already has written, so the app can
// fall back to these when a browser's text layer doesn't line up (see lib/demo-e1.ts).
const { createHash } = await import("node:crypto");
const known = {};
for (const name of ["E1-Personal-Record.pdf", "E1-Personal-Record-SEMI-FILLED.pdf", "E1-Personal-Record-FILLED.pdf"]) {
  const bytes = fs.readFileSync(`public/demo/${name}`);
  const text = await items(`public/demo/${name}`);
  known[createHash("sha256").update(bytes).digest("hex")] = { name, written: out.flatMap((f, idx) => f.type !== "checkbox" && text[f.page].some(i => {
    const cy = i.top + i.height / 2, cx = i.left + Math.min(i.width, 30) / 2; return cy > f.box[0] && cy < f.box[2] && cx > f.box[1] && cx < f.box[3]; }) ? [idx] : []) };
}
fs.writeFileSync("lib/demo-e1-known.json", JSON.stringify(known));
console.log(Object.values(known).map(k => `${k.name}: ${k.written.length} written`).join(", "));

// The ready-made "Lumen AI" extraction of the filled E-1: the record the demo saves.
// Religion, email, business start year and earnings are left out on purpose so the
// presenter answers them live in Final Check.
const ASK_LIVE = new Set(["extra.religion", "core.email", "extra.businessStartYear", "extra.monthlyEarnings"]);
const iso = s => `${s.slice(4)}-${s.slice(0, 2)}-${s.slice(2, 4)}`;
const record = []; const seen = new Set();
for (const f of out) {
  if (!/^(core|extra)\./.test(f.key) || ASK_LIVE.has(f.key) || seen.has(f.key)) continue;
  seen.add(f.key);
  const value = f.key.endsWith("irthDate") ? iso(f.sample) : f.key === "core.ids.tin" ? f.sample.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1-$2-$3") : f.sample;
  record.push({ key: f.key, value, pageNumber: f.page, wordIndices: [] });
}
record.push({ key: "core.sex", value: "Male", pageNumber: 1, wordIndices: [] }, { key: "core.civilStatus", value: "Married", pageNumber: 1, wordIndices: [] });
fs.writeFileSync("lib/demo-e1-record.json", JSON.stringify(record, null, 1));
console.log(`${record.length} record values → lib/demo-e1-record.json`);
