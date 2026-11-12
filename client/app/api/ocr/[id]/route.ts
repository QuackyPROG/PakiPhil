import { failure, lumen } from "@/lib/server";
import { normalizePages } from "@/lib/ocr";
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const path = `/documents/${encodeURIComponent(id)}`;
    const { data } = await lumen("ocr", path);
    const pages = ["READY", "PARTIAL"].includes(data.Status)
      ? normalizePages((await lumen("ocr", `${path}/pages?IncludeWords=true`)).data) : undefined;
    return Response.json({ status: data.Status, pages, failureReason: data.FailureReason }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}
