import { z } from "zod";
import { aiJson } from "@/lib/ai";
import { ApiError, failure, jsonBody } from "@/lib/server";
export async function POST(request: Request) {
  try {
    const parsed = z.object({ question: z.string().min(1).max(1000), context: z.string().max(1000).optional() }).safeParse(await jsonBody(request));
    if (!parsed.success) throw new ApiError("Ask a shorter question.", 400);
    return Response.json(await aiJson(`Explain this Philippine form field briefly in friendly Filipino/English. Do not invent personal answers. JSON {"answer":"..."}. ${JSON.stringify(parsed.data)}`, z.object({ answer: z.string().max(3000) })));
  } catch (error) { return failure(error); }
}
