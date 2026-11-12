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
export async function aiJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  if (prompt.length > 4000) throw new ApiError("AI message exceeds 4,000 characters. Process a smaller page.", 400);
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return schema.parse(parseJson(await chat(prompt))); }
    catch (error) { last = error; if (error instanceof ApiError && error.status !== 504) break; }
  }
  if (process.env.GEMINI_API_KEY) return schema.parse(parseJson(await gemini(prompt)));
  if (last instanceof ApiError) throw last;
  throw new ApiError("Lumen AI did not return valid task JSON. Check the instance instructions or configure GEMINI_API_KEY for fallback.", 502);
}
