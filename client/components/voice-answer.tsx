"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { IconMic } from "./ui/icons";
type Recognition = {
  lang: string; interimResults: boolean;
  start: () => void; abort: () => void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
const subscribe = () => () => {};
const voiceSupported = () => { const browser = window as SpeechWindow; return Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition); };
export function VoiceAnswer({ onResult }: { onResult: (text: string) => void }) {
  const recognition = useRef<Recognition | null>(null);
  const supported = useSyncExternalStore(subscribe, voiceSupported, () => false); const [listening, setListening] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    return () => { if (recognition.current) { recognition.current.onend = null; recognition.current.abort(); } };
  }, []);
  function start() {
    if (listening) { recognition.current?.abort(); return; }
    const browser = window as SpeechWindow;
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) return;
    const speech = new Constructor(); recognition.current = speech; speech.lang = "fil-PH"; speech.interimResults = false;
    speech.onresult = event => onResult(event.results[0][0].transcript);
    speech.onerror = event => { setError(`Voice unavailable (${event.error}). Type your answer instead.`); setListening(false); };
    speech.onend = () => setListening(false);
    try { setError(""); setListening(true); speech.start(); } catch { setListening(false); setError("Could not start the microphone. Type your answer instead."); }
  }
  if (!supported) return null;
  return <div><button type="button" aria-pressed={listening} onClick={start}><IconMic />{listening ? "Stop listening" : "Answer by voice"}</button><small role="status">{listening ? "Listening… Review your answer before confirming." : error}</small></div>;
}
