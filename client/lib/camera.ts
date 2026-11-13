// Camera capture helpers. The browser parts (getUserMedia, canvas) live in components/camera.tsx.
export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };

/** Document shapes the guide frame can take, as width ÷ height. */
export const GUIDE_ASPECT = { id: 85.6 / 53.98, form: 8.5 / 11 } as const;

/** The guide frame drawn over the preview: as large as fits in 86% × 78% of it, centred. */
export function guideRect(preview: Size, aspect: number): Rect {
  let width = preview.width * 0.86, height = width / aspect;
  if (height > preview.height * 0.78) { height = preview.height * 0.78; width = height * aspect; }
  return { x: (preview.width - width) / 2, y: (preview.height - height) / 2, width, height };
}

/**
 * The part of the camera frame (in video pixels) that sits inside the guide.
 * The preview shows the video with `object-fit: cover`, so the video is scaled to fill and its overflow is cropped evenly.
 */
export function captureRegion(preview: Size, video: Size, aspect: number): Rect {
  const scale = Math.max(preview.width / video.width, preview.height / video.height);
  const offsetX = (video.width * scale - preview.width) / 2, offsetY = (video.height * scale - preview.height) / 2;
  const g = guideRect(preview, aspect);
  const x = Math.max(0, Math.round((g.x + offsetX) / scale)), y = Math.max(0, Math.round((g.y + offsetY) / scale));
  return { x, y, width: Math.min(video.width - x, Math.round(g.width / scale)), height: Math.min(video.height - y, Math.round(g.height / scale)) };
}

/** Plain-language camera errors. Every one offers uploading a photo as the way forward. */
export function cameraErrorMessage(error: { name?: string }) {
  switch (error.name) {
    case "NotAllowedError": case "SecurityError": return "Camera blocked. Allow camera access in your browser's address bar, or upload a photo instead.";
    case "NotFoundError": case "OverconstrainedError": return "No camera found on this device. Upload a photo or PDF instead.";
    case "NotReadableError": case "AbortError": return "The camera is busy in another app. Close it and try again, or upload a photo instead.";
    case "Insecure": return "The camera only works on a secure (https) page. Upload a photo instead.";
    default: return "Could not start the camera. Upload a photo instead.";
  }
}
