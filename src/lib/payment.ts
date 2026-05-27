import { ZodError } from "zod";

export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

export function parseTransactionDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const d = Number(match[3]);
    return new Date(y, m, d, 12, 0, 0);
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid transaction date");
  }
  return parsed;
}

export function parseProofBase64(base64: string, mimeType: string, fileName: string) {
  if (!base64?.trim()) {
    throw new Error("Payment proof file is required");
  }
  const proofData = Buffer.from(base64, "base64");
  if (proofData.length === 0) {
    throw new Error("Payment proof file is empty or invalid");
  }
  if (proofData.length > MAX_PROOF_BYTES) {
    throw new Error("Proof file too large (max 5MB)");
  }
  const mime = mimeType?.trim() || "application/octet-stream";
  const allowed =
    ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p)) || mime === "application/pdf";
  if (!allowed) {
    throw new Error("Proof must be an image (JPEG, PNG, etc.) or PDF");
  }
  if (!fileName?.trim()) {
    throw new Error("Proof file name is required");
  }
  return { proofData, proofMimeType: mime, proofFileName: fileName.trim() };
}

export function formatApiError(e: unknown, fallback: string): string {
  if (e instanceof ZodError) {
    const issue = e.errors[0];
    if (issue) {
      const field = issue.path.length ? issue.path.join(".") : "field";
      return `${field}: ${issue.message}`;
    }
  }
  return e instanceof Error ? e.message : fallback;
}
