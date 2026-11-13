// Phil's chat brain: Lumen AI Chat first, a general model when Lumen will not answer.
// Lumen and the fallback are passed in, so this file stays free of keys and network code.

export const PERSONA = `You are Phil, the friendly cheetah guide inside PaPhil, an app that fills Philippine government forms (SSS, PhilHealth, Pag-IBIG, BIR, PSA, NBI and similar) from the user's saved record.
Reply in warm, simple Taglish, at most 3 short sentences, no markdown.
Explain what form fields mean, what to write, where to find the information (which ID or document), and how to get or recover government numbers and IDs.
Never invent the user's personal details. Never ask for passwords, PINs or OTPs. If unsure about an agency rule, say so and suggest checking with the agency.`;

/** What the shared hackathon instance says when its scope gate blocks a message. It is a 200, not an error. */
const REFUSAL = /outside what this assistant covers/i;
export const isLumenRefusal = (answer: string) => REFUSAL.test(answer) || !answer.trim();

export type PhilTurn = { role: "user" | "phil"; text: string };
export type PhilQuestion = { message: string; sessionId?: string; context?: string; history?: PhilTurn[] };
export type PhilReply = { answer: string; source: string; sessionId?: string };
export type PhilDeps = {
  openSession: () => Promise<string>;
  send: (sessionId: string, message: string) => Promise<string>;
  /** A stateless model that answers from the whole prompt. */
  fallback: (prompt: string) => Promise<{ answer: string; source: string }>;
};

export async function askPhil({ message, sessionId, context, history = [] }: PhilQuestion, deps: PhilDeps): Promise<PhilReply> {
  const turn = `${context ? `[What the user is looking at: ${context}]\n` : ""}${message}`;
  try {
    sessionId ??= await deps.openSession();
    // The instance keeps no behaviour of its own ("teams set behavior in their own messages"), so every turn carries the persona.
    const answer = await deps.send(sessionId, `${PERSONA}\n\n${turn}`.slice(0, 4000));
    if (!isLumenRefusal(answer)) return { answer, source: "Lumen AI", sessionId };
    console.warn("[chat] Lumen AI Chat declined the question (instance scope); answering from the fallback");
  } catch (error) {
    console.warn(`[chat] Lumen AI Chat failed, using fallback: ${error instanceof Error ? error.message : error}`);
  }
  const transcript = history.map(h => `${h.role === "user" ? "User" : "Phil"}: ${h.text}`).join("\n").slice(-1500);
  // Label the speakers so the model answers *as* Phil rather than addressing the user as Phil.
  const prompt = `${PERSONA}\n\n${transcript ? `Conversation so far:\n${transcript}\n\n` : ""}${context ? `[What the user is looking at: ${context}]\n` : ""}The user asks: ${message}\nWrite Phil's reply to the user.`;
  const { answer, source } = await deps.fallback(prompt.slice(-3900));
  return { answer, source, sessionId };
}
