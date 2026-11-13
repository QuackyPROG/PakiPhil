// Cleans the mascot PNGs in public/mascot into small sticker WebPs in public/mascot/web:
// removes the blotchy light halo (flood fill from the edges, stopped by the dark outline),
// leaving the cheetah on a fully transparent background with a softly feathered edge.
// Also writes a before/after sheet (on light and dark) if a path is given.
//   node scripts/mascot-clean.mjs [compare.png]
import fs from "node:fs";
import sharp from "sharp";

const WIDTH = 640;
const names = fs.readdirSync("public/mascot").filter(n => n.endsWith(".png"));
fs.mkdirSync("public/mascot/web", { recursive: true });
const tiles = [];
for (const name of names) {
  const { data, info } = await sharp(`public/mascot/${name}`).resize({ width: WIDTH }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info; const px = w * h;
  // 1. Flood fill "halo" pixels reachable from the border: faint, or light and unsaturated.
  const halo = new Uint8Array(px); const stack = [];
  const isHalo = i => { const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    return a < 200 || (Math.min(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 45); };
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop(); if (halo[i] || !isHalo(i)) continue; halo[i] = 1;
    const x = i % w, y = (i - x) / w;
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w);
  }
  // Drop tiny detached specks (stray marks under the feet); confetti and sparkles are far larger.
  const seen = new Uint8Array(px);
  for (let s = 0; s < px; s++) {
    if (halo[s] || seen[s]) continue;
    const blob = [s]; seen[s] = 1;
    for (let k = 0; k < blob.length; k++) {
      const i = blob[k], x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (n >= 0 && n < px && !halo[n] && !seen[n]) { seen[n] = 1; blob.push(n); }
    }
    if (blob.length < 60) for (const i of blob) halo[i] = 1;
  }
  // 2. Keep the artwork; feather the cut edge by blurring only the alpha mask.
  const mask = Buffer.alloc(px); for (let i = 0; i < px; i++) mask[i] = halo[i] ? 0 : 255;
  const soft = await sharp(mask, { raw: { width: w, height: h, channels: 1 } }).blur(0.7).extractChannel(0).raw().toBuffer();
  const out = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) { out[i * 4] = data[i * 4]; out[i * 4 + 1] = data[i * 4 + 1]; out[i * 4 + 2] = data[i * 4 + 2]; out[i * 4 + 3] = Math.min(soft[i], halo[i] ? soft[i] : 255); }
  const clean = sharp(out, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 0 });
  const file = `public/mascot/web/${name.replace(".png", ".webp")}`;
  await clean.clone().webp({ quality: 86, alphaQuality: 90 }).toFile(file);
  tiles.push({ name, before: await sharp(`public/mascot/${name}`).resize({ width: 320, height: 320, fit: "inside" }).png().toBuffer(), after: await sharp(file).resize({ width: 320, height: 320, fit: "inside" }).png().toBuffer() });
  console.log(`${file}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
if (process.argv[2]) {
  // Columns: original, cleaned on cream paper, cleaned on dark ink.
  const tile = 340;
  const bg = (color, top) => ({ input: { create: { width: tile, height: tile * tiles.length, channels: 4, background: color } }, left: top, top: 0 });
  const sheet = sharp({ create: { width: tile * 3, height: tile * tiles.length, channels: 4, background: "#9b7bdb" } });
  await sheet.composite([bg("#fbf6ea", tile), bg("#2b1d12", tile * 2), ...tiles.flatMap((t, i) => [{ input: t.before, left: 10, top: i * tile + 10 },
    { input: t.after, left: tile + 10, top: i * tile + 10 }, { input: t.after, left: tile * 2 + 10, top: i * tile + 10 }])]).png().toFile(process.argv[2]);
}
