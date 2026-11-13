"use client";
/* eslint-disable @next/next/no-img-element -- Local still from the camera, shown before it is used. */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { captureRegion, cameraErrorMessage, guideRect, GUIDE_ASPECT, type Rect } from "@/lib/camera";
import { Cheetah, usePhilContext } from "./mascot";
import { IconCamera, IconCheck, IconClose, IconFlip } from "./ui/icons";
import { gsap, reducedMotion } from "./ui/motion";

type Kind = keyof typeof GUIDE_ASPECT;
const COPY: Record<Kind, { title: string; hint: string }> = {
  id: { title: "Kunan ang ID mo", hint: "Ilagay ang buong ID sa loob ng frame. Iwas sa silaw at anino." },
  form: { title: "Kunan ang form", hint: "Ilapag ang papel sa patag na mesa. Kasya dapat ang buong pahina sa frame." },
};
const LONG_EDGE = 2400;
const subscribe = () => () => {};
const liveCameraSupported = () => !!navigator.mediaDevices?.getUserMedia;

/** "Take a photo": a live camera with a document guide where the browser allows it, the phone's own camera picker otherwise. */
export function CameraButton({ kind, disabled, onFile }: { kind: Kind; disabled?: boolean; onFile: (file: File) => void }) {
  const live = useSyncExternalStore(subscribe, liveCameraSupported, () => true);
  const [open, setOpen] = useState(false);
  if (!live) return <label className={`button camera-button ${disabled ? "is-disabled" : ""}`}><IconCamera />Take a photo
    <input type="file" hidden accept="image/*" capture="environment" disabled={disabled} onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} /></label>;
  return <>
    <button type="button" className="camera-button" disabled={disabled} onClick={() => setOpen(true)}><IconCamera />Take a photo</button>
    {open && <CameraSheet kind={kind} onClose={() => setOpen(false)} onCapture={file => { setOpen(false); onFile(file); }} />}
  </>;
}

type Phase = "starting" | "live" | "still" | "error";
function CameraSheet({ kind, onClose, onCapture }: { kind: Kind; onClose: () => void; onCapture: (file: File) => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const view = useRef<HTMLDivElement>(null); const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null); const still = useRef<Blob | null>(null);
  const [phase, setPhase] = useState<Phase>("starting"); const [error, setError] = useState("");
  const [facing, setFacing] = useState<"environment" | "user">("environment"); const [cameras, setCameras] = useState(0);
  const [stillUrl, setStillUrl] = useState(""); const [frame, setFrame] = useState<Rect | null>(null);
  const { sfx } = usePhilContext();
  const aspect = GUIDE_ASPECT[kind];

  const stop = useCallback(() => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; }, []);
  useEffect(() => { dialog.current?.showModal(); return stop; }, [stop]);
  // (Re)start the camera whenever the facing direction changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!window.isSecureContext) throw { name: "Insecure" };
        stop();
        const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
        if (cancelled) { media.getTracks().forEach(t => t.stop()); return; }
        stream.current = media;
        if (video.current) { video.current.srcObject = media; await video.current.play().catch(() => {}); }
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) { setCameras(devices.filter(d => d.kind === "videoinput").length); setPhase("live"); }
      } catch (e) { if (!cancelled) { setError(cameraErrorMessage(e as { name?: string })); setPhase("error"); } }
    })();
    return () => { cancelled = true; };
  }, [facing, stop]);
  // Keep the guide frame in step with the preview's size.
  useEffect(() => {
    const el = view.current; if (!el) return;
    const measure = () => setFrame(guideRect({ width: el.clientWidth, height: el.clientHeight }, aspect));
    measure(); const observer = new ResizeObserver(measure); observer.observe(el); return () => observer.disconnect();
  }, [aspect]);
  useEffect(() => () => { if (stillUrl) URL.revokeObjectURL(stillUrl); }, [stillUrl]);

  function shoot() {
    const v = video.current, el = view.current; if (!v || !el || !v.videoWidth) return;
    const region = captureRegion({ width: el.clientWidth, height: el.clientHeight }, { width: v.videoWidth, height: v.videoHeight }, aspect);
    const scale = Math.min(1, LONG_EDGE / Math.max(region.width, region.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(region.width * scale); canvas.height = Math.round(region.height * scale);
    canvas.getContext("2d")!.drawImage(v, region.x, region.y, region.width, region.height, 0, 0, canvas.width, canvas.height);
    sfx("pop");
    if (!reducedMotion()) gsap.fromTo(".camera-flash", { opacity: 0.85 }, { opacity: 0, duration: 0.45, ease: "power2.out" });
    canvas.toBlob(blob => {
      if (!blob) { setError("Could not save the photo. Try again, or upload a photo instead."); setPhase("error"); return; }
      still.current = blob; setStillUrl(URL.createObjectURL(blob)); setPhase("still");
    }, "image/jpeg", 0.9);
  }
  function use() {
    if (!still.current) return;
    stop(); onCapture(new File([still.current], `${kind === "id" ? "id" : "form"}-photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
  }
  function retake() { setStillUrl(""); still.current = null; setPhase("live"); }
  const copy = COPY[kind];
  return <dialog ref={dialog} className="camera-sheet" aria-label={copy.title} onCancel={e => { e.preventDefault(); stop(); onClose(); }}>
    <div className="camera-top">
      <div className="camera-phil"><Cheetah pose={phase === "error" ? "Confused" : phase === "still" ? "CheckingInfo" : "Scanning"} /><div><strong>{phase === "still" ? "Malinaw ba?" : copy.title}</strong><small>{phase === "still" ? "Basa ba lahat ng letra at numero? Kung hindi, kunan ulit." : copy.hint}</small></div></div>
      <button type="button" className="camera-icon" aria-label="Close camera" onClick={() => { stop(); onClose(); }}><IconClose /></button>
    </div>
    <div ref={view} className={`camera-view ${facing === "user" ? "mirrored" : ""}`}>
      <video ref={video} playsInline muted aria-label="Camera preview" hidden={phase === "still"} />
      {phase === "still" && stillUrl && <img src={stillUrl} alt="Your photo" className="camera-still" />}
      {(phase === "live" || phase === "starting") && frame && <div className="camera-guide" style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height }} aria-hidden><i /><i /><i /><i /></div>}
      {phase === "starting" && <p className="camera-status" role="status"><span className="spinner" aria-hidden />Binubuksan ang camera…</p>}
      {phase === "error" && <div className="camera-status error-state" role="alert"><p>{error}</p><button type="button" onClick={() => { stop(); onClose(); }}>Upload instead</button></div>}
      <div className="camera-flash" aria-hidden />
    </div>
    <div className="camera-controls">
      {phase === "still" ? <>
        <button type="button" onClick={retake}>Retake</button>
        <button type="button" className="primary big" onClick={use}><IconCheck />Use this photo</button>
      </> : <>
        <span className="camera-slot">{cameras > 1 && <button type="button" className="camera-icon" aria-label="Switch camera" disabled={phase !== "live"} onClick={() => setFacing(f => f === "environment" ? "user" : "environment")}><IconFlip /></button>}</span>
        <button type="button" className="shutter" aria-label="Take photo" disabled={phase !== "live"} onClick={shoot}><span /></button>
        <span className="camera-slot" />
      </>}
    </div>
  </dialog>;
}
