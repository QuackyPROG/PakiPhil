export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export function validateUpload(file: { size: number; type: string }) {
  if (!file.size) throw new Error("Choose a non-empty file.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Choose a file no larger than 10 MB.");
  if (!FILE_TYPES.includes(file.type)) throw new Error("Use a PDF, JPG, PNG, or WebP file.");
}
