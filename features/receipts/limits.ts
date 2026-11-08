// Leave room for multipart fields below Vercel's 4.5 MB request limit.
export const MAX_RECEIPT_BYTES = 4_000_000;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const RECEIPT_UPLOAD_ERROR = "Choose a JPG, PNG or WebP image up to 4 MB.";
