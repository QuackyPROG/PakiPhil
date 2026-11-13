"use client";
/* eslint-disable @next/next/no-img-element -- Small local sticker images that swap per pose. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { post } from "@/lib/api";
import { gsap, playSfx, preloadSfx, reducedMotion, useGSAP, type Sfx } from "./ui/motion";
import { IconSend } from "./ui/icons";

export function usePhil() {
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
  const toggle = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setMuted(was => {
      const next = !was;
      if (!next) { preloadSfx(); playSfx("pop"); } // A cue on turning sound on proves it works.
      return next;
    });
  }, []);
  return { muted, speaking, speak, toggle };
}

export const POSES = ["Happy", "Scanning", "Thinking", "CheckingInfo", "Confused", "Surprised", "Excited", "Done", "Sad"] as const;
export type Pose = typeof POSES[number];
export type Mood = { pose: Pose; line: string; detail?: string };
export type ChatMessage = { role: "user" | "phil"; text: string; source?: string; failed?: boolean };

/** Phil the cheetah, in one of nine poses. */
export function Cheetah({ pose, className = "", alt = "" }: { pose: Pose; className?: string; alt?: string }) {
  return <img src={`/mascot/web/${pose}.webp`} alt={alt} className={`cheetah ${className}`} draggable={false} />;
}

/** Reads the app's existing progress and error text into a pose and a Taglish line. */
export function moodFor(progress: string, error: string, idle: Mood): Mood {
  if (error) return { pose: "Confused", line: "Ay, may problema dito.", detail: error };
  const p = progress;
  if (!p) return idle;
  if (/^Uploading|Reading — Lumen OCR|Rendering pages/.test(p)) return { pose: "Scanning", line: "Sandali, binabasa ko…", detail: p };
  if (/^Done — Lumen OCR/.test(p)) return { pose: "Happy", line: "Nabasa ko na! I-extract na natin.", detail: p };
  if (/^Extracting/.test(p)) return { pose: "Thinking", line: "Inaayos ko ang details mo…", detail: p };
  const found = p.match(/found (\d+) details/);
  if (found) return { pose: "Excited", line: `Ayan! ${found[1]} details nakuha ko.`, detail: "Silipin mo muna bago i-save." };
  if (/^Done — Lumen AI/.test(p)) return { pose: "Excited", line: "Ayan! Silipin mo muna.", detail: p };
  if (/^Saved/.test(p)) return { pose: "Happy", line: "Naka-save na sa record mo!", detail: "Puwede ka nang mag-Paki-fill." };
  if (/Reading labels|finding blanks|filling with Lumen AI|✓$/.test(p)) return { pose: "CheckingInfo", line: "Hinahanap ko ang mga blanko…", detail: p };
  if (/correction/i.test(p)) return { pose: "Happy", line: "Noted! Inayos ko na.", detail: p };
  return { ...idle, detail: p };
}

const THINKING: Mood = { pose: "Thinking", line: "Sandali, iniisip ko…", detail: "Tinatanong ko si Lumen AI. Ilang segundo lang." };

type PhilApi = ReturnType<typeof usePhil> & {
  mood: Mood; setMood: (mood: Mood) => void; sfx: (kind: Sfx) => void;
  messages: ChatMessage[]; pending: boolean; ask: (question: string) => void;
  /** What the user is looking at right now (form name, missing fields), sent with each question. */
  setChatContext: (context: string) => void;
};
const PhilContext = createContext<PhilApi | null>(null);
export function PhilProvider({ children }: { children: ReactNode }) {
  const voice = usePhil();
  const [mood, setMood] = useState<Mood>({ pose: "Happy", line: "Hi! Ako si Phil." });
  const [messages, setMessages] = useState<ChatMessage[]>([]); const [pending, setPending] = useState(false);
  const session = useRef<string | undefined>(undefined); const context = useRef("");
  const history = useRef<ChatMessage[]>([]);
  useEffect(() => { history.current = messages; }, [messages]);
  const sfx = useCallback((kind: Sfx) => { if (!voice.muted) playSfx(kind); }, [voice.muted]);
  const { speak } = voice;
  const ask = useCallback((question: string) => {
    const text = question.trim(); if (!text) return;
    setMessages(old => [...old, { role: "user", text }]); setPending(true); sfx("ask");
    const recent = history.current.filter(m => !m.failed).slice(-6).map(({ role, text }) => ({ role, text }));
    post<{ answer: string; sessionId?: string; source?: string }>("/api/chat", { message: text, sessionId: session.current, context: context.current || undefined, history: recent })
      .then(result => {
        session.current = result.sessionId;
        setMessages(old => [...old, { role: "phil", text: result.answer, source: result.source }]);
        sfx("answer"); speak(result.answer);
      })
      .catch((error: Error) => {
        setMessages(old => [...old, { role: "phil", failed: true, text: `Pasensya, hindi ako nakasagot (${error.message}) Subukan ulit?` }]);
        sfx("error");
      })
      .finally(() => setPending(false));
  }, [sfx, speak]);
  const setChatContext = useCallback((value: string) => { context.current = value.slice(0, 1500); }, []);
  const value = useMemo(() => ({ ...voice, mood: pending ? THINKING : mood, setMood, sfx, messages, pending, ask, setChatContext }),
    [voice, mood, sfx, messages, pending, ask, setChatContext]);
  return <PhilContext.Provider value={value}>{children}</PhilContext.Provider>;
}
export function usePhilContext() {
  const api = useContext(PhilContext);
  if (!api) throw new Error("PhilProvider is missing.");
  return api;
}
/** Screens call this with their own status text; Phil reacts. */
export function useMood(progress: string, error: string, idle: Mood) {
  const { setMood } = usePhilContext();
  const { pose, line, detail } = moodFor(progress, error, idle);
  useEffect(() => { setMood({ pose, line, detail }); }, [setMood, pose, line, detail]);
}

const STARTERS = ["Ano ang kulang pa sa form ko?", "Saan ko makikita ang SSS number ko?", "Ano ang TIN?"];

/** Phil's corner of the screen: pose and line up top, and a Lumen AI chat underneath. */
export function PhilGuide({ suggestions = STARTERS }: { suggestions?: string[] }) {
  const { mood, sfx, speaking, messages, pending, ask } = usePhilContext();
  const root = useRef<HTMLElement>(null); const log = useRef<HTMLDivElement>(null); const input = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(mood); const first = useRef(true);
  // Squash, swap pose, pop back whenever the mood changes.
  useGSAP(() => {
    if (first.current || reducedMotion()) { first.current = false; setShown(mood); return; }
    const cheetah = root.current?.querySelector(".guide-stage .cheetah"); const bubble = root.current?.querySelector(".guide-stage .bubble");
    const swap = mood.pose !== shown.pose;
    gsap.timeline()
      .to(bubble ?? [], { y: 4, opacity: 0, duration: 0.12, ease: "power2.in" }, 0)
      .to(swap ? cheetah ?? [] : [], { scaleY: 0.84, scaleX: 1.08, y: 6, duration: 0.14, ease: "power2.in", transformOrigin: "50% 100%" }, 0)
      .call(() => { setShown(mood); if (swap) sfx("pop"); })
      .to(swap ? cheetah ?? [] : [], { scaleY: 1, scaleX: 1, y: 0, duration: 0.55, ease: "back.out(2.6)" })
      .to(bubble ?? [], { y: 0, opacity: 1, duration: 0.3 }, "<0.05");
  }, { dependencies: [mood.pose, mood.line, mood.detail], scope: root });
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" }); }, [messages.length, pending]);
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (pending || !input.current) return;
    ask(input.current.value); input.current.value = "";
  }
  const label = shown.pose.replace(/([A-Z])/g, " $1").trim().toLowerCase();
  return <aside ref={root} className={`guide ${speaking ? "speaking" : ""} ${pending ? "pending" : ""}`} aria-label="Phil, your guide">
    <div className="guide-stage">
      <div className="bubble" aria-live="polite"><b>{shown.line}</b>{shown.detail && <small>{shown.detail}</small>}</div>
      <button className="cheetah-button" onClick={() => input.current?.focus()} aria-label="Ask Phil a question"><Cheetah pose={shown.pose} alt={`Phil, ${label}`} /></button>
    </div>
    <div className="chat">
      <div ref={log} className="chat-log" role="log" aria-live="polite" aria-label="Chat with Phil">
        {!messages.length && <div className="chat-empty"><p>May tanong sa form? Tanungin mo ako. <span className="lumen">Lumen AI</span></p>
          <div className="chips">{suggestions.map(s => <button key={s} type="button" className="chip-button" disabled={pending} onClick={() => ask(s)}>{s}</button>)}</div></div>}
        {messages.map((m, i) => <p key={i} className={`msg ${m.role} ${m.failed ? "failed" : ""}`}>{m.text}{m.source && m.source !== "Lumen AI" && <small> via {m.source}</small>}</p>)}
        {pending && <p className="msg phil typing" role="status" aria-label="Phil is typing"><i /><i /><i /></p>}
      </div>
      <form className="chat-input" onSubmit={submit}>
        <input ref={input} name="question" placeholder={pending ? "Sumasagot si Phil…" : "Itanong kay Phil…"} aria-label="Ask Phil" maxLength={1000} autoComplete="off" />
        <button type="submit" className="primary icon-only" disabled={pending} aria-label="Send question"><IconSend /></button>
      </form>
    </div>
  </aside>;
}
