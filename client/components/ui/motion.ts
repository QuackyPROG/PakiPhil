"use client";
// GSAP setup and the generated sound effects. Sounds play only when the presenter turns Sound on.
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.defaults({ ease: "expo.out", duration: 0.45 });
export { gsap, useGSAP };

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Sound effects: Kenney "Interface Sounds" (CC0, kenney.nl), files in public/sfx. See public/sfx/LICENSE.txt.
const SFX = { stamp: 0.55, pop: 0.35, done: 0.6, ask: 0.4, answer: 0.45, error: 0.45, open: 0.35, close: 0.35 } as const;
export type Sfx = keyof typeof SFX;
const cache = new Map<Sfx, HTMLAudioElement>();
/** Preload every cue so the first play is instant. */
export function preloadSfx() {
  if (typeof Audio === "undefined") return;
  for (const kind of Object.keys(SFX) as Sfx[]) if (!cache.has(kind)) { const a = new Audio(`/sfx/${kind}.wav`); a.preload = "auto"; a.volume = SFX[kind]; cache.set(kind, a); }
}
export function playSfx(kind: Sfx) {
  try {
    preloadSfx();
    const base = cache.get(kind); if (!base) return;
    // Clone so quick repeats (several stamps in a row) overlap instead of cutting each other off.
    const voice = base.cloneNode() as HTMLAudioElement; voice.volume = base.volume;
    void voice.play().catch(() => { /* autoplay blocked or audio unavailable: sound is optional */ });
  } catch { /* audio is optional */ }
}
