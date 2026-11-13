/**
 * Phil's neural voice: a Filipino Piper model (tl_PH, CC BY-NC-SA 4.0) run in the browser.
 * eSpeak (via piper_phonemize WASM) turns text into phoneme ids; onnxruntime-web turns those into audio.
 * Everything loads lazily the first time sound is turned on, and callers fall back to speechSynthesis
 * while it loads or if it fails.
 */
import { cleanForSpeech, pitchPlan, splitForSpeech } from "./phil-voice-text";

const ORT_BASE = "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.18.0/";
const PHONEMIZE_BASE = "https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize";
const MODEL_FILE = "tl_PH-filipino-medium-model.onnx";
const HF_MODEL = `https://huggingface.co/IhorShevchuk/piper-voice-tl-filipino/resolve/f2cfe5d746916654b656a441bee21d5bb6e0886b/${MODEL_FILE}`;
/** Local copy first (fast in the demo), the pinned Hugging Face file if it is not deployed. */
const MODEL_SOURCES = [`/tts/${MODEL_FILE}`, HF_MODEL];
const CONFIG_URL = `/tts/${MODEL_FILE}.json`;
const CACHE = "phil-voice-v1";

type Tensor = unknown;
type Ort = {
  env: { wasm: { wasmPaths: string; numThreads: number } };
  Tensor: new (type: string, data: unknown, dims?: number[]) => Tensor;
  InferenceSession: { create: (model: ArrayBuffer, options: object) => Promise<{ run: (feeds: Record<string, Tensor>) => Promise<{ output: { data: Float32Array } }> }> };
};
type Phonemizer = { callMain: (args: string[]) => void };
type VoiceConfig = { audio: { sample_rate: number }; espeak: { voice: string }; inference: { noise_scale: number; length_scale: number; noise_w: number }; speaker_id_map?: Record<string, number> };
type VoiceWindow = Window & { ort?: Ort; createPiperPhonemize?: (options: object) => Promise<Phonemizer> };

export type VoiceStatus = "idle" | "loading" | "ready" | "failed";
let status: VoiceStatus = "idle";
const listeners = new Set<(s: VoiceStatus) => void>();
function setStatus(next: VoiceStatus) { status = next; listeners.forEach(fn => fn(next)); }
export const getVoiceStatus = () => status;
export function onVoiceStatus(fn: (s: VoiceStatus) => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement("script");
    el.src = src; el.async = true; el.crossOrigin = "anonymous";
    el.onload = () => resolve(); el.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(el);
  });
}

async function fetchModel(): Promise<ArrayBuffer> {
  const cache = "caches" in window ? await caches.open(CACHE).catch(() => null) : null;
  for (const url of MODEL_SOURCES) {
    const hit = await cache?.match(url);
    if (hit) return hit.arrayBuffer();
  }
  for (const url of MODEL_SOURCES) {
    const res = await fetch(url).catch(() => null);
    if (!res?.ok || /text\/html/.test(res.headers.get("content-type") ?? "")) continue;
    if (cache) await cache.put(url, res.clone()).catch(() => { /* storage full: still usable this session */ });
    return res.arrayBuffer();
  }
  throw new Error("Voice model unavailable");
}

type Engine = { ort: Ort; session: Awaited<ReturnType<Ort["InferenceSession"]["create"]>>; config: VoiceConfig; phonemizer: Phonemizer; sink: { fn: ((line: string) => void) | null } };
let engine: Promise<Engine> | null = null;

/** Starts loading the voice (idempotent). Resolves when Phil can speak with it. */
export function preloadVoice(): Promise<Engine> {
  if (engine) return engine;
  setStatus("loading");
  engine = (async () => {
    const w = window as VoiceWindow;
    await Promise.all([loadScript(`${ORT_BASE}ort.min.js`), loadScript(`${PHONEMIZE_BASE}.js`)]);
    const ort = w.ort!; ort.env.wasm.wasmPaths = ORT_BASE;
    const sink: Engine["sink"] = { fn: null };
    const [config, model, phonemizer] = await Promise.all([
      fetch(CONFIG_URL).then(r => { if (!r.ok) throw new Error("Voice config missing"); return r.json() as Promise<VoiceConfig>; }),
      fetchModel(),
      // One instance, reused: creating one per call reloads 18 MB of eSpeak data (~10 s).
      w.createPiperPhonemize!({
        noExitRuntime: true,
        print: (line: string) => sink.fn?.(line),
        printErr: () => { /* eSpeak warnings are noise */ },
        locateFile: (url: string) => url.endsWith(".wasm") ? `${PHONEMIZE_BASE}.wasm` : url.endsWith(".data") ? `${PHONEMIZE_BASE}.data` : url,
      }),
    ]);
    const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
    setStatus("ready");
    return { ort, session, config, phonemizer, sink };
  })();
  engine.catch(error => { console.warn("[phil-voice] falling back to browser speech:", error); engine = null; setStatus("failed"); });
  return engine;
}

function phonemize(e: Engine, text: string): number[] {
  let ids: number[] = [];
  e.sink.fn = line => { ids = JSON.parse(line).phoneme_ids; };
  e.phonemizer.callMain(["-l", e.config.espeak.voice, "--input", JSON.stringify([{ text }]), "--espeak_data", "/espeak-ng-data"]);
  e.sink.fn = null;
  return ids;
}

async function render(e: Engine, text: string, lengthScale: number): Promise<Float32Array> {
  const ids = phonemize(e, text);
  if (!ids.length) return new Float32Array();
  const { noise_scale, noise_w } = e.config.inference;
  const feeds: Record<string, Tensor> = {
    input: new e.ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
    input_lengths: new e.ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)])),
    scales: new e.ort.Tensor("float32", Float32Array.from([noise_scale, lengthScale, noise_w])),
  };
  if (Object.keys(e.config.speaker_id_map ?? {}).length) feeds.sid = new e.ort.Tensor("int64", BigInt64Array.from([BigInt(0)]));
  return (await e.session.run(feeds)).output.data;
}

let audio: AudioContext | null = null;
/** Call from a click: browsers only let audio start after a user gesture. */
export function unlockAudio() {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();
}

let generation = 0; let playing: AudioBufferSourceNode[] = [];
export function stopVoice() {
  generation++;
  playing.forEach(node => { node.onended = null; try { node.stop(); } catch { /* already stopped */ } });
  playing = [];
}

/**
 * Speaks with the Piper voice. Renders sentence by sentence and queues each one right after the
 * last, so speech starts after the first sentence. Rejects if the voice is not ready.
 */
export async function speakWithVoice(text: string, { pitch = 1, onStart, onEnd }: { pitch?: number; onStart?: () => void; onEnd?: () => void } = {}) {
  if (status !== "ready" || !engine) throw new Error("Voice not ready");
  const e = await engine;
  stopVoice(); const mine = generation;
  unlockAudio(); const ctx = audio!;
  const { lengthScale, playbackRate } = pitchPlan(pitch, e.config.inference.length_scale);
  let at = 0; let started = false; let last: AudioBufferSourceNode | null = null;
  for (const chunk of splitForSpeech(cleanForSpeech(text))) {
    const pcm = await render(e, chunk, lengthScale);
    if (mine !== generation) return;
    if (!pcm.length) continue;
    const buffer = ctx.createBuffer(1, pcm.length, e.config.audio.sample_rate);
    buffer.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
    const node = ctx.createBufferSource();
    node.buffer = buffer; node.playbackRate.value = playbackRate; node.connect(ctx.destination);
    at = Math.max(at, ctx.currentTime + 0.02);
    node.start(at); at += buffer.duration / playbackRate + 0.12;
    playing.push(node); last = node;
    if (!started) { started = true; onStart?.(); }
  }
  if (!last) { onEnd?.(); return; }
  const end = last;
  end.onended = () => { if (mine === generation) { playing = []; onEnd?.(); } };
}
