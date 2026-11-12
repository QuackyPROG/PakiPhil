import { ApiError, failure, lumen } from "@/lib/server";
import { FILE_TYPES, MAX_FILE_SIZE } from "@/lib/upload";
export async function POST(request: Request) {
  try {
    const type = request.headers.get("content-type")?.split(";")[0] ?? "";
    if (!FILE_TYPES.includes(type)) throw new ApiError("Use PDF, JPG, PNG, or WebP.", 415);
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError("Choose a file.", 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_FILE_SIZE) { await reader.cancel(); throw new ApiError("File exceeds 10 MB.", 413); }
      chunks.push(value);
    }
    if (!size) throw new ApiError("Choose a non-empty file.", 400);
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const name = request.headers.get("x-lumen-document-name") || "document";
    const result = await lumen("ocr", "/documents", { method: "POST", body: bytes,
      headers: { "Content-Type": type, "X-Lumen-Document-Name": name } });
    return Response.json({ documentId: result.data.DocumentID });
  } catch (error) { return failure(error); }
}
