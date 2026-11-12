import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { entries, makeValue, type PersonalRecord } from "./models";
import { renderFile, type FormPage } from "./pdf";
export const demoFields: [string, string][] = [
  ["core.firstName", "Juan"], ["core.middleName", "Santos"], ["core.lastName", "Dela Cruz"],
  ["core.birthDate", "2004-03-18"], ["core.sex", "Male"], ["core.citizenship", "Filipino"],
  ["core.address.city", "Pasig City"], ["core.address.barangay", "San Antonio"],
  ["core.mobile", "09170000000"], ["core.ids.sss", "00-0000000-0"],
];
export const demoPages = [{ number: 1, text: demoFields.map(([k,v]) => `${k}: ${v}`).join("\n"),
  words: demoFields.flatMap(([k,v], i) => [{ index: i*2, text: k }, { index: i*2+1, text: v }]) }];
async function samplePdf(title: string, lines: string[]) {
  const pdf = await PDFDocument.create(); const page = pdf.addPage([595,842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(title, { x: 45, y: 775, size: 20, font, color: rgb(.1,.35,.28) });
  page.drawText("SAMPLE - NOT VALID", { x: 45, y: 742, size: 16, font, color: rgb(.7,.2,.15) });
  lines.forEach((line,i) => page.drawText(line, { x: 45, y: 685-i*34, size: 12, font }));
  return new File([new Uint8Array(await pdf.save())], `${title.toLowerCase().replaceAll(" ", "-")}.pdf`, { type: "application/pdf" });
}
export async function sampleId() { return samplePdf("Pirma Lang Sample ID", demoFields.map(([k,v]) => `${k.replace("core.", "")}: ${v}`)); }
export async function sampleBirthCertificate() { return samplePdf("Sample Birth Certificate", ["First name: Juan", "Last name: Dela Cruz", "Mother maiden name: Maria Santos", "Father name: Jose Dela Cruz"]); }
export async function sampleForm(record: PersonalRecord, second = false): Promise<FormPage[]> {
  const labels = ["First name", "Middle name", "Last name", "Birth date", "Sex", "Citizenship", "City", "Barangay", "Mobile", "SSS number", "Birth place", "Occupation"];
  const keys = [...demoFields.map(([key]) => key), "core.birthPlace", "extra.occupation"];
  const file = await samplePdf(second ? "Sample Membership Form" : "Sample Employment Form", []);
  const pdf = await PDFDocument.load(await file.arrayBuffer()); const page = pdf.getPage(0);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boxes = labels.map((label, i) => {
    const y = 680 - i*43;
    page.drawText(label, { x:45, y, size:10, font }); page.drawRectangle({ x:210,y:y-8,width:335,height:27,borderWidth:.6,borderColor:rgb(.6,.65,.6) });
    return [(842-(y+19))/842*1000,210/595*1000,(842-(y-8))/842*1000,545/595*1000] as [number,number,number,number];
  });
  page.drawText("Practice template only - not an official government form.", { x:45,y:55,size:9,font });
  const pages = await renderFile(new File([new Uint8Array(await pdf.save())], file.name, { type: "application/pdf" }));
  const saved = new Map(entries(record));
  pages[0].fields = labels.map((label,i) => ({ id:`demo-${i}`,label,box:boxes[i],type:i===3?"date":"text",recordKey:keys[i],value:saved.get(keys[i])?.value,status:saved.has(keys[i])?"green":"red",reason:saved.has(keys[i])?"From your confirmed record":"Missing from your record" }));
  return pages;
}
export const demoValues = () => demoFields.map(([key,value]) => [key,makeValue(value,"SAMPLE ID — NOT VALID","Sample document")] as const);
