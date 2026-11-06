import "server-only";
import sharp from "sharp";
import { z } from "zod";

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const MAX_RECEIPT_PIXELS = 20_000_000;
export class ReceiptError extends Error {}

const fileSchema = z
  .file()
  .min(1)
  .max(MAX_RECEIPT_BYTES)
  .mime(["image/jpeg", "image/png", "image/webp"]);

export async function prepareReceiptImage(input: unknown): Promise<Buffer> {
  const parsed = fileSchema.safeParse(input);
  if (!parsed.success)
    throw new ReceiptError("Choose a JPG, PNG or WebP image up to 10 MiB.");
  const file = parsed.data;
  const bytes = Buffer.from(await file.arrayBuffer());
  const signature = bytes.subarray(0, 12);
  const type = signature.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
    ? "image/jpeg"
    : signature
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : signature.toString("ascii", 0, 4) === "RIFF" &&
          signature.toString("ascii", 8, 12) === "WEBP"
        ? "image/webp"
        : null;
  if (type !== file.type)
    throw new ReceiptError("The image content does not match its file type.");
  try {
    const image = sharp(bytes, {
      limitInputPixels: MAX_RECEIPT_PIXELS,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_RECEIPT_PIXELS ||
      (metadata.pages ?? 1) > 1
    )
      throw new Error("Unsupported dimensions or animation");
    // Decode fully, orient and strip metadata before sending pixels to the provider.
    return await image
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
  } catch {
    throw new ReceiptError(
      "Unable to decode this image. Use a static image up to 20 megapixels.",
    );
  }
}
