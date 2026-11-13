"use client";
// The ending shot: the stamp slams, Phil cheers, confetti falls in the brand colours.
import { useEffect, useRef } from "react";
import { Cheetah, usePhilContext } from "../mascot";
import { IconDownload } from "./icons";
import { gsap, reducedMotion, useGSAP } from "./motion";

const COLORS = ["var(--purple)", "var(--gold)", "var(--sky)", "var(--ok)", "#e8705a"];
export function Celebration({ fields, busy, onAgain, onAnother, onClose }: { fields: number; busy: boolean; onAgain: () => void; onAnother: () => void; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null); const first = useRef<HTMLButtonElement>(null);
  const { sfx } = usePhilContext();
  useEffect(() => {
    first.current?.focus();
    const close = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  useGSAP(() => {
    sfx("done");
    if (reducedMotion()) return;
    const tl = gsap.timeline();
    tl.from(".celebration", { opacity: 0, duration: 0.25 })
      .from(".celebration-card", { y: 60, scale: 0.92, duration: 0.6 }, "<")
      .from(".celebration-card .cheetah", { y: 50, scaleY: 0.7, transformOrigin: "50% 100%", duration: 0.7, ease: "back.out(2.4)" }, "-=0.35")
      .from(".celebration-card .stamp", { scale: 3.2, opacity: 0, rotate: -25, duration: 0.32, ease: "power4.in", onComplete: () => sfx("stamp") }, "-=0.2")
      .to(".celebration-card", { x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: "none" })
      .from(".celebration-card h2, .celebration-card p, .celebration-card .actions", { y: 14, opacity: 0, stagger: 0.07, duration: 0.4 }, "-=0.1");
    gsap.utils.toArray<HTMLElement>(".confetti i").forEach(piece => {
      gsap.set(piece, { x: gsap.utils.random(0, window.innerWidth), rotate: gsap.utils.random(0, 360), background: gsap.utils.random(COLORS) });
      gsap.to(piece, { y: window.innerHeight + 60, x: `+=${gsap.utils.random(-140, 140)}`, rotate: `+=${gsap.utils.random(-540, 540)}`,
        duration: gsap.utils.random(1.8, 3.2), delay: 0.5 + gsap.utils.random(0, 0.6), ease: "power1.in" });
    });
  }, { scope: root });
  return <div ref={root}>
    <div className="confetti" aria-hidden>{Array.from({ length: 70 }, (_, i) => <i key={i} />)}</div>
    <div className="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <div className="celebration-card">
        <Cheetah pose="Done" />
        <span className="stamp big">Pirma na lang!</span>
        <h2 id="celebration-title">Tapos na ang form mo.</h2>
        <p>{fields} answers placed. Your PDF is downloading; print it, sign it, submit it.</p>
        <div className="actions">
          <button ref={first} className="primary" disabled={busy} onClick={onAgain}><IconDownload />Download PDF again</button>
          <button onClick={onAnother}>Fill another form</button>
          <button className="text-button" onClick={onClose}>Back to the form</button>
        </div>
      </div>
    </div>
  </div>;
}
