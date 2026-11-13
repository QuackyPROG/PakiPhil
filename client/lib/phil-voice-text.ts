/** Pure helpers for Phil's voice: turning chat text into speakable chunks, and pitch math. */

export const PITCH_MIN = 0.75;
export const PITCH_MAX = 1.4;
export const PITCH_DEFAULT = 1;

/** Strips what reads badly aloud: markdown, links, bare URLs, emoji. Lines become sentences. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S*[^\s.,!?;:)]/g, "")
    .replace(/[`*_~>#]+/g, "")
    .replace(/\p{Extended_Pictographic}️?/gu, "")
    .split(/\n+/)
    .map(line => line.replace(/^\s*(?:[-•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean)
    .map((line, i, all) => (i < all.length - 1 && !/[.!?:;,…]$/.test(line) ? `${line}.` : line))
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Splits text into sentence-sized chunks so the first one can play while the rest render.
 * Stops at `maxTotal` characters (a chat answer can be long; Phil reads the start).
 */
export function splitForSpeech(text: string, maxTotal = 600, maxChunk = 200): string[] {
  const sentences = text.trim().match(/[^.!?…]+[.!?…]*/g)?.map(s => s.trim()).filter(Boolean) ?? [];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= maxChunk) { chunks.push(sentence); continue; }
    let piece = "";
    for (const word of sentence.split(/\s+/)) {
      if (piece && `${piece} ${word}`.length > maxChunk) { chunks.push(piece); piece = word; }
      else piece = piece ? `${piece} ${word}` : word;
    }
    if (piece) chunks.push(piece);
  }
  const kept: string[] = []; let total = 0;
  for (const chunk of chunks) {
    const next = total + (kept.length ? 1 : 0) + chunk.length;
    if (next > maxTotal) break;
    kept.push(chunk); total = next;
  }
  return kept;
}

export function clampPitch(value: number): number {
  if (!Number.isFinite(value)) return PITCH_DEFAULT;
  return Math.min(PITCH_MAX, Math.max(PITCH_MIN, value));
}

/**
 * Piper has no pitch input. Render `pitch` times slower, play back `pitch` times faster:
 * duration is unchanged and every frequency shifts by `pitch`.
 */
export function pitchPlan(pitch: number, baseLengthScale = 1): { lengthScale: number; playbackRate: number } {
  const p = clampPitch(pitch);
  return { lengthScale: baseLengthScale * p, playbackRate: p };
}
