"use client";
import { useCallback, useEffect, useState } from "react";
export function useAteFill() {
  const [muted, setMuted] = useState(true); const [speaking, setSpeaking] = useState(false);
  const speak = useCallback((text: string) => {
    if (muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => /fil|tl/i.test(v.lang)) ?? voices.find(v => v.lang.startsWith("en")) ?? null;
    utterance.onstart = () => setSpeaking(true); utterance.onend = utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [muted]);
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  return { muted, speaking, speak, toggle: () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); setSpeaking(false); setMuted(v => !v); } };
}
export function AteFill({ speaking = false }: { speaking?: boolean }) {
  return <svg viewBox="0 0 180 190" role="img" aria-label="Ate Fill, your friendly form helper" className={`mascot ${speaking ? "speaking" : ""}`}>
    <ellipse cx="90" cy="178" rx="62" ry="9" fill="#d7e3d6" /><path d="M40 169q0-61 50-61t50 61" fill="#1d6655" />
    <path d="M56 126l34 30 34-30-15-10H71z" fill="#f5f1df" /><path d="M87 139h6v34h-6z" fill="#ebae55" />
    <ellipse cx="90" cy="73" rx="54" ry="59" fill="#263e36" /><circle cx="139" cy="53" r="19" fill="#263e36" />
    <ellipse cx="90" cy="80" rx="44" ry="48" fill="#efbd8e" /><path d="M46 64q20-4 28-27 16 26 62 28-9-43-47-43-35 0-43 42" fill="#263e36" />
    <g fill="none" stroke="#263e36" strokeWidth="3"><rect x="51" y="68" width="33" height="24" rx="10" /><rect x="96" y="68" width="33" height="24" rx="10" /><path d="M84 77h12" /></g>
    <circle cx="69" cy="79" r="3" fill="#263e36" /><circle cx="111" cy="79" r="3" fill="#263e36" />
    <ellipse cx="60" cy="99" rx="8" ry="4" fill="#dd8f79" /><ellipse cx="120" cy="99" rx="8" ry="4" fill="#dd8f79" />
    <path className="mouth" d="M79 105q11 13 22 0" fill="#943e3b" stroke="#943e3b" strokeWidth="3" />
    <rect x="114" y="133" width="39" height="43" rx="4" transform="rotate(12 114 133)" fill="#fffdf5" /><path d="M123 145l5 5 10-12" fill="none" stroke="#1d6655" strokeWidth="3" />
  </svg>;
}
