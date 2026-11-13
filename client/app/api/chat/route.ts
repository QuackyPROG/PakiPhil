import { z } from "zod";
import { aiJsonWithSource, openLumenSession, sendLumenMessage, type AiSource } from "@/lib/ai";
import { ApiError, failure, jsonBody } from "@/lib/server";

const PERSONA = `You are Phil, the friendly cheetah guide inside PaPhil, an app that fills Philippine government forms (SSS, PhilHealth, Pag-IBIG, BIR, NBI and similar) from the user's saved record.
Reply in warm, simple Taglish, at most 3 short sentences, no markdown.
Explain what form fields mean, what to write, and where to find the information (e.g. which ID or document).
Never invent the user's personal details. Never ask for passwords, PINs or OTPs. If unsure about an agency rule, say so and suggest checking with the agency.`;

const body = z.object({
  message: z.string().trim().min(1).max(1000),
  sessionId: z.string().max(200).optional(),
  context: z.string().max(1500).optional(),
  history: z.array(z.object({ role: z.enum(["user", "phil"]), text: z.string().max(1200) })).max(8).optional(),
});

/** Phil chat: a persistent Lumen AI Chat session, falling back to a stateless answer if Lumen is down. */
export async function POST(request: Request) {
  try {
    const parsed = body.safeParse(await jsonBody(request));
    if (!parsed.success) throw new ApiError("Ask a shorter question.", 400);
    const { message, context, history = [] } = parsed.data;
    const turn = `${context ? `[What the user is looking at: ${context}]\n` : ""}${message}`;
    let sessionId = parsed.data.sessionId;
    try {
      const fresh = !sessionId;
      sessionId ??= await openLumenSession("Phil chat");
      // The persona rides on the first message of each session; later turns rely on the session's memory.
      const answer = await sendLumenMessage(sessionId, fresh ? `${PERSONA}\n\n${turn}` : turn);
      return Response.json({ answer, sessionId, source: "Lumen AI" satisfies AiSource });
    } catch (error) {
      console.warn(`[chat] Lumen AI Chat failed, using fallback: ${error instanceof Error ? error.message : error}`);
    }
    const transcript = history.map(h => `${h.role === "user" ? "User" : "Phil"}: ${h.text}`).join("\n").slice(-1500);
    const { data, source } = await aiJsonWithSource(`${PERSONA}\n${transcript ? `Conversation so far:\n${transcript}\n` : ""}${turn}\nReply as JSON {"answer":"..."}.`.slice(0, 4000),
      z.object({ answer: z.string().min(1).max(3000) }), { skipLumen: true });
    // No sessionId: the next question tries a fresh Lumen session again.
    return Response.json({ answer: data.answer, source });
  } catch (error) { return failure(error); }
}
