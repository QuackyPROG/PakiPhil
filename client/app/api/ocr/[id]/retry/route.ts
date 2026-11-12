import { failure, lumen } from "@/lib/server";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await lumen("ocr", `/documents/${encodeURIComponent(id)}/retry`, { method: "POST" });
    return Response.json({ ok: true });
  } catch (error) { return failure(error); }
}
