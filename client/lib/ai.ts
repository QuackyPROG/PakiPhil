import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ApiError, lumen } from "./server";
export function parseJson(text: string): unknown {
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI returned no JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}
export async function gemini(prompt: string, image?: string) {
  if (!process.env.GEMINI_API_KEY) throw new ApiError("Configure GEMINI_API_KEY for form detection or AI fallback.", 503);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }, ...(image ? [{ inlineData: { mimeType: "image/png", data: image } }] : [])] }],
    config: { responseMimeType: "application/json", httpOptions: { timeout: 25000 } } });
  return result.text ?? "";
}
const OPENROUTER_FREE_VISION = ["nvidia/nemotron-3.5-super-vl:free", "google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"];
export async function openrouter(prompt: string, image?: string) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new ApiError("Configure OPENROUTER_API_KEY for the free vision fallback.", 503);
  const preferred = process.env.OPENROUTER_MODEL?.trim();
  const models = [...new Set([...(preferred ? [preferred] : []), ...OPENROUTER_FREE_VISION])].slice(0, 3);
  const content = [{ type: "text", text: prompt }, ...(image ? [{ type: "image_url", image_url: { url: `data:image/png;base64,${image}` } }] : [])];
  // Free "thinking" models can spend ~50s reasoning and sometimes return no answer; extraction doesn't need it.
  const reasoning = process.env.OPENROUTER_REASONING === "on" ? undefined : { enabled: false };
  let answer = "";
  for (let attempt = 0; attempt < 2 && !answer.trim(); attempt++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", signal: AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "PakiFill" },
      body: JSON.stringify({ model: models[0], models, reasoning, messages: [{ role: "user", content }] }) });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(`OpenRouter request failed (${String(body?.error?.message ?? response.status).slice(0, 120)}).`, response.status === 429 ? 429 : 502);
    answer = z.string().catch("").parse(body?.choices?.[0]?.message?.content);
    if (!answer.trim()) console.warn(`[ai] OpenRouter ${body?.model ?? models[0]} returned an empty answer${attempt ? "" : "; retrying"}`);
  }
  return answer;
}
/** Vision call: Gemini when configured, OpenRouter's free models otherwise or if Gemini fails. */
export async function vision(prompt: string, image?: string) {
  if (process.env.GEMINI_API_KEY) {
    try { return await gemini(prompt, image); }
    catch (error) { if (!process.env.OPENROUTER_API_KEY) throw error; }
  }
  if (process.env.OPENROUTER_API_KEY) return openrouter(prompt, image);
  throw new ApiError("Configure GEMINI_API_KEY or OPENROUTER_API_KEY for form detection or AI fallback.", 503);
}
async function chat(message: string) {
  let instance = process.env.LUMEN_AI_INSTANCE_ID;
  if (!instance) {
    const result = await lumen("ai_chat", "/instances");
    instance = result.Instances?.find((i: { Name: string }) => i.Name === "Pirma Lang Extractor")?.InstanceID
      ?? result.Instances?.find((i: { Name: string; Status: string }) => i.Name === "PLP-Hackathon-Blank" && i.Status === "ACTIVE")?.InstanceID;
  }
  if (!instance) throw new ApiError("Create a Pirma Lang Extractor AI instance or set LUMEN_AI_INSTANCE_ID.", 503);
  const base = `/instances/${encodeURIComponent(instance)}/sessions`;
  const session = await lumen("ai_chat", base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Pirma Lang task" }) });
  const result = await lumen("ai_chat", `${base}/${encodeURIComponent(session.Session.id)}/messages`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
  return z.string().parse(result.Answer.answer);
}
export type AiSource = "Lumen AI" | "Gemini" | "OpenRouter";
function reason(error: unknown) {
  if (error instanceof z.ZodError) return "answer did not match the expected format";
  if (error instanceof SyntaxError || (error instanceof Error && error.message === "AI returned no JSON object.")) return "answer was not valid JSON";
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) return "timed out";
  const message = error instanceof Error ? error.message : String(error);
  // Google SDK errors are raw JSON bodies; keep only the first sentence of the provider's message.
  try {
    const inner = JSON.parse(message)?.error;
    if (inner?.message) return `${inner.code ?? ""} ${String(inner.message).split(/(?<=\.)\s/)[0]}`.trim();
  } catch { /* not JSON */ }
  return message.slice(0, 200);
}
/** Tries Lumen AI (twice), then Gemini, then OpenRouter; reports which one answered, or why each failed. */
export async function aiJsonWithSource<T>(prompt: string, schema: z.ZodType<T>): Promise<{ data: T; source: AiSource }> {
  if (prompt.length > 4000) throw new ApiError("AI message exceeds 4,000 characters. Process a smaller page.", 400);
  const failures = new Set<string>();
  let lastError: unknown;
  const attempt = async (source: AiSource, call: () => Promise<string>) => {
    let text: string | undefined;
    try {
      text = await call();
      const data = schema.parse(parseJson(text));
      console.info(`[ai] answered by ${source}`);
      return { data, source };
    } catch (error) {
      const quote = text !== undefined && !text.includes("{") ? ` ("${text.trim().slice(0, 80)}")` : "";
      console.warn(`[ai] ${source} failed: ${reason(error)}${quote}`);
      failures.add(`${source}: ${reason(error)}${quote}`);
      lastError = error;
      return null;
    }
  };
  for (let i = 0; i < 2; i++) {
    const result = await attempt("Lumen AI", () => chat(prompt));
    if (result) return result;
    // Only a timeout is worth retrying; a refusal or malformed answer will repeat.
    const transient = lastError instanceof ApiError ? lastError.status === 504 : lastError instanceof Error && lastError.name === "TimeoutError";
    if (!transient) break;
  }
  const fallbacks: [AiSource, () => Promise<string>][] = [];
  if (process.env.GEMINI_API_KEY) fallbacks.push(["Gemini", () => gemini(prompt)]);
  if (process.env.OPENROUTER_API_KEY) fallbacks.push(["OpenRouter", () => openrouter(prompt)]);
  if (!fallbacks.length && lastError instanceof ApiError) throw lastError;
  for (const [source, call] of fallbacks) {
    const result = await attempt(source, call);
    if (result) return result;
  }
  throw new ApiError(`AI could not complete this request — ${[...failures].join("; ")}.${fallbacks.length ? "" : " Configure GEMINI_API_KEY or OPENROUTER_API_KEY for a fallback."}`, 502);
}
export async function aiJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  return (await aiJsonWithSource(prompt, schema)).data;
}
