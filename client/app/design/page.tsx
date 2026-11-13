"use client";
// Living style guide for the PaPhil design system. Not linked from the app; open /design.
import { PhilProvider, Cheetah, POSES } from "@/components/mascot";
import { Pipeline } from "@/components/ui/pipeline";
import { BrandMark, IconAlert, IconCheck, IconDownload, IconEye, IconLock, IconMic, IconScan, IconSparkle, IconUpload } from "@/components/ui/icons";

const COLORS: [string, string, string][] = [
  ["--paper", "Bond paper", "Page background"], ["--manila", "Manila", "Panels, upload tray, clipboard"], ["--sheet", "Sheet", "Cards and form pages"],
  ["--ink", "Ink", "Text, outlines, dark bars"], ["--ink-soft", "Soft ink", "Secondary text"], ["--purple", "Folder purple", "Primary actions"],
  ["--gold", "Coat gold", "Current step, highlights"], ["--sky", "Scanner blue", "Lumen"], ["--ok", "Filled", "Verified answers"],
  ["--check", "Check", "Needs a look"], ["--missing", "Missing", "Needs an answer"],
];
export default function DesignPage() {
  return <PhilProvider><main className="shell stack">
    <div className="section-head"><h1>PaPhil design system</h1><p>A sticker book of Filipino paperwork: bond paper, manila folders, rubber stamps, and Phil the cheetah. Tokens live in app/globals.css; rules in DESIGN.md.</p></div>
    <section className="stack"><h2>Colour</h2><div className="swatches">{COLORS.map(([token, name, use]) => <div className="swatch" key={token}><i style={{ background: `var(${token})` }} /><span><b>{name}</b><br /><code>{token}</code><br />{use}</span></div>)}</div></section>
    <section className="stack"><h2>Type</h2>
      <h1>Ikaw ang bida. Kami sa form.</h1><h2>Bricolage Grotesque 800, display and headings</h2><h3>Heading three, for card titles</h3>
      <p>Figtree carries body copy and controls at 16px with a 1.55 line height, set to roughly 68 characters per line.</p>
      <p className="mono">JetBrains Mono: OCR words and record values only. VILLANUEVA, 03141988</p></section>
    <section className="stack"><h2>Buttons and fields</h2>
      <div className="actions"><button className="primary big">Gawin ang record ko</button><button className="big">Paki-fill ang form</button><button className="primary"><IconDownload />Download filled PDF</button><button>Exclude</button><button disabled>Preparing…</button><button className="danger">Burahin ang record ko</button><button className="text-button">Ask Phil</button></div>
      <label style={{ maxWidth: 360 }}>Answer for Religion<input className="value-input" defaultValue="ROMAN CATHOLIC" /></label>
      <label className="inline"><input type="checkbox" defaultChecked />Remember for future forms</label></section>
    <section className="stack"><h2>Status</h2><div className="actions"><span className="chip green"><IconCheck />Filled</span><span className="chip yellow"><IconEye />Check</span><span className="chip red"><IconAlert />Missing</span></div>
      <p className="notice">Sample form: a practice layout, not an official form.</p><p className="error">Lumen AI could not complete this request. Please retry.</p></section>
    <section className="stack"><h2>Stamp</h2><div className="actions" style={{ gap: 48 }}><span className="stamp">Pirma na lang</span><span className="stamp big">Pirma na lang!</span></div></section>
    <section className="stack"><h2>Lumen pipeline</h2><Pipeline kind="scan" progress="Reading — Lumen OCR… page 2 of 3" /><Pipeline kind="fill" progress="Page 1 of 3 — filling with Lumen AI…" /></section>
    <section className="stack"><h2>Icons</h2><div className="actions">{[BrandMark, IconCheck, IconAlert, IconEye, IconUpload, IconDownload, IconMic, IconLock, IconScan, IconSparkle].map((Icon, i) => <Icon key={i} width={32} height={32} />)}</div></section>
    <section className="stack"><h2>Phil</h2><div className="poses">{POSES.map(pose => <div key={pose}><Cheetah pose={pose} />{pose}</div>)}</div></section>
  </main></PhilProvider>;
}
