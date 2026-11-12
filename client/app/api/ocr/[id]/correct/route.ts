import { z } from "zod";
import { ApiError, failure, jsonBody, lumen } from "@/lib/server";
const schema = z.object({ pageNumber: z.number().int().positive(), wordIndex: z.number().int().nonnegative(), text: z.string().min(1).max(1000) });
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const parsed = schema.safeParse(await jsonBody(request));
    if (!parsed.success) throw new ApiError("Invalid correction.", 400);
    await lumen("ocr", `/documents/${encodeURIComponent(id)}/review/corrections`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: id, ...parsed.data }) });
    return Response.json({ ok: true });
  } catch (error) { return failure(error); }
}
