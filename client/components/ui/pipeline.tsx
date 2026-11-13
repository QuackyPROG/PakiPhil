"use client";
// The Lumen pipeline: Upload → Lumen OCR → Lumen AI → Silip, read from the screen's progress text.
import { useRef } from "react";
import { IconCheck } from "./icons";
import { gsap, reducedMotion, useGSAP } from "./motion";

const STEPS = [
  { label: "Upload" }, { label: "OCR", lumen: true }, { label: "AI", lumen: true }, { label: "Silip" },
];
/** Index of the step in progress (STEPS.length when everything is done), or -1 when idle. */
export function stepFor(progress: string, kind: "scan" | "fill"): number {
  const p = progress;
  if (!p) return -1;
  if (/^Uploading|^Rendering pages/.test(p)) return 0;
  if (/Lumen OCR…|Reading labels|finding blanks/.test(p)) return 1;
  if (/^Done — Lumen OCR/.test(p)) return 2;
  if (/^Extracting|filling with Lumen AI|of \d+ ✓$/.test(p)) return 2;
  if (/found \d+ details|^Done — Lumen AI|Ready for your final check/.test(p)) return 3;
  if (/^Saved|Tapos/.test(p)) return 4;
  return kind === "scan" ? -1 : 3;
}

export function Pipeline({ progress, kind, done = false }: { progress: string; kind: "scan" | "fill"; done?: boolean }) {
  const step = done ? STEPS.length : stepFor(progress, kind);
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(".now .dot", { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "back.out(3)" });
  }, { dependencies: [step], scope: root });
  if (step < 0) return progress ? <p className="pipeline-status" role="status">{progress}</p> : null;
  return <div ref={root}>
    <ol className="pipeline" aria-label="Lumen progress">
      {STEPS.map((s, i) => <li key={s.label} className={i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
        <span className="dot">{i < step && <IconCheck />}</span>
        <span>{s.lumen && <span className="lumen">Lumen</span>}{s.label}</span>
      </li>)}
    </ol>
    <p className="pipeline-status" role="status">{progress}</p>
  </div>;
}
