"use client";
// Home hero: a paper SSS E-1 that fills itself while Phil watches, then gets stamped.
import { useRef } from "react";
import { Cheetah } from "../mascot";
import { gsap, reducedMotion, useGSAP } from "./motion";

const ROWS: [string, string][] = [
  ["Last name", "VILLANUEVA"], ["First name", "JOSE MIGUEL"], ["Date of birth", "03 14 1988"],
  ["TIN", "123-456-789"], ["Street", "MABINI ST."], ["Mobile", "0917-555-0142"], ["Spouse", "ANGELICA DIZON"],
];
export function HeroDemo() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const values = gsap.utils.toArray<HTMLElement>(".demo-row em");
    if (reducedMotion()) return;
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 0.4 });
    tl.set(values, { clipPath: "inset(0 100% 0 0)" }).set(".demo-stamp", { opacity: 0 })
      .from(".demo-form", { y: 30, rotate: -8, opacity: 0, duration: 0.8 })
      .to(values, { clipPath: "inset(0 0% 0 0)", duration: 0.45, stagger: 0.32, ease: "steps(14)" }, "+=0.2")
      .fromTo(".demo-stamp", { scale: 2.6, opacity: 0, rotate: -24 }, { scale: 1, opacity: 1, rotate: -9, duration: 0.3, ease: "power4.in" }, "+=0.2")
      .to(".demo-form", { x: 5, duration: 0.05, repeat: 5, yoyo: true, ease: "none" })
      .to({}, { duration: 2.4 })
      .to(".demo-form", { y: -20, opacity: 0, duration: 0.5, ease: "power2.in" });
    // Pause when off screen or in a background tab.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) tl.play(); else tl.pause(); });
    io.observe(root.current!); return () => io.disconnect();
  }, { scope: root });
  return <div ref={root} className="demo-desk" aria-hidden>
    <div className="demo-form">
      <header><i /><b>Personal Record<br />E-1</b></header>
      {ROWS.map(([label, value]) => <div className="demo-row" key={label}><span>{label}</span><em>{value}</em></div>)}
      <div className="demo-sign"><span>Signature</span><span>Date</span></div>
      <div className="demo-stamp"><span className="stamp">Pirma na lang</span></div>
    </div>
    <Cheetah pose="Happy" className="demo-mascot" />
  </div>;
}
