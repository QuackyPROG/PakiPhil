import { z } from "zod";
import { aiJsonWithSource, openLumenSession, sendLumenMessage } from "@/lib/ai";
import { askPhil } from "@/lib/phil-chat";
import { ApiError, failure, jsonBody } from "@/lib/server";

const body = z.object({
  message: z.string().trim().min(1).max(1000),
  sessionId: z.string().max(200).optional(),
  context: z.string().max(1500).optional(),
  history: z.array(z.object({ role: z.enum(["user", "phil"]), text: z.string().max(1200) })).max(8).optional(),
});

/** Phil chat: Lumen AI Chat first; if Lumen errors or declines the question, a general model answers instead. */
export async function POST(request: Request) {
  try {
    const parsed = body.safeParse(await jsonBody(request));
    if (!parsed.success) throw new ApiError("Ask a shorter question.", 400);
    return Response.json(await askPhil(parsed.data, {
      openSession: () => openLumenSession("Phil chat"),
      send: sendLumenMessage,
      fallback: async prompt => {
        const { data, source } = await aiJsonWithSource(`${prompt}\nReply as JSON {"answer":"..."}.`, z.object({ answer: z.string().min(1).max(3000) }), { skipLumen: true });
        return { answer: data.answer, source };
      },
    }));
  } catch (error) { return failure(error); }
}
