import { test } from "node:test";
import assert from "node:assert/strict";
import { captureRegion } from "../lib/camera";

test("the guide frame maps to the same part of the photo when the preview shows the whole video", () => {
  // 1000×500 preview of a 2000×1000 video, ID-card guide (aspect 1.6), 80% of the width at most.
  const r = captureRegion({ width: 1000, height: 500 }, { width: 2000, height: 1000 }, 1.6);
  // Guide: height-limited at 78% of 500 = 390 → width 624, centred at (188, 55). Doubled into video pixels.
  assert.deepEqual(r, { x: 376, y: 110, width: 1248, height: 780 });
});

test("on a portrait phone the crop skips the sides of a landscape camera feed that the preview hides", () => {
  // 400×800 preview, 1920×1080 feed: scaled ×0.7407 to 1422×800, so 511px are hidden on each side.
  const r = captureRegion({ width: 400, height: 800 }, { width: 1920, height: 1080 }, 8.5 / 11);
  assert.deepEqual(r, { x: 728, y: 240, width: 464, height: 601 });
});

test("camera failures explain what to do next", async () => {
  const { cameraErrorMessage } = await import("../lib/camera");
  assert.match(cameraErrorMessage({ name: "NotAllowedError" }), /allow camera/i);
  assert.match(cameraErrorMessage({ name: "NotFoundError" }), /no camera/i);
  assert.match(cameraErrorMessage({ name: "NotReadableError" }), /another app/i);
  assert.match(cameraErrorMessage({ name: "Insecure" }), /https/i);
  for (const name of ["NotAllowedError", "NotFoundError", "NotReadableError", "Insecure", "Weird"]) assert.match(cameraErrorMessage({ name }), /upload/i);
});
