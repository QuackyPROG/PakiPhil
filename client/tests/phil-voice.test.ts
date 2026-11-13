import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanForSpeech, splitForSpeech, pitchPlan, clampPitch, PITCH_MIN, PITCH_MAX } from "../lib/phil-voice-text";

test("cleanForSpeech strips markdown, links, urls and emoji", () => {
  assert.equal(cleanForSpeech("**Tapos na!** 🎉 Pirma ka na lang."), "Tapos na! Pirma ka na lang.");
  assert.equal(cleanForSpeech("Punta ka sa [My.SSS](https://sss.gov.ph) o https://sss.gov.ph/login."), "Punta ka sa My.SSS o.");
  assert.equal(cleanForSpeech("# Hakbang\n- Una: `TIN`\n- Pangalawa"), "Hakbang. Una: TIN. Pangalawa");
});

test("splitForSpeech keeps sentences whole and caps total length", () => {
  assert.deepEqual(splitForSpeech("Ako si Phil. I-upload ang ID mo! Ako na ang bahala?"), ["Ako si Phil.", "I-upload ang ID mo!", "Ako na ang bahala?"]);
  const long = Array.from({ length: 40 }, (_, i) => `Pangungusap bilang ${i}.`).join(" ");
  const parts = splitForSpeech(long, 120);
  assert.ok(parts.join(" ").length <= 120, "stays within the cap");
  assert.equal(parts[0], "Pangungusap bilang 0.");
  assert.deepEqual(splitForSpeech("   "), []);
});

test("splitForSpeech breaks one very long sentence on word boundaries", () => {
  const words = Array.from({ length: 60 }, () => "salita").join(" ");
  const parts = splitForSpeech(words, 1000, 80);
  assert.ok(parts.length > 1);
  assert.ok(parts.every(p => p.length <= 80));
});

test("pitchPlan keeps duration constant: slower render, faster playback", () => {
  const plan = pitchPlan(1.25, 1.0);
  assert.equal(plan.playbackRate, 1.25);
  assert.equal(plan.lengthScale, 1.25);
  assert.equal(plan.lengthScale / plan.playbackRate, 1.0);
});

test("clampPitch bounds out-of-range and bad values", () => {
  assert.equal(clampPitch(9), PITCH_MAX);
  assert.equal(clampPitch(0.1), PITCH_MIN);
  assert.equal(clampPitch(Number.NaN), 1);
});
