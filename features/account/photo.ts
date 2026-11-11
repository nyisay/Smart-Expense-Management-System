import "server-only";
import sharp from "sharp";
import { profilePhotoFileSchema } from "./schemas";

export class ProfilePhotoError extends Error {}

export async function prepareProfilePhoto(input: unknown): Promise<Buffer> {
  const file = profilePhotoFileSchema.safeParse(input);
  if (!file.success) throw new ProfilePhotoError("Choose a JPG, PNG or WebP photo up to 2 MB.");
  try {
    const image = sharp(Buffer.from(await file.data.arrayBuffer()), { limitInputPixels: 12_000_000, failOn: "warning" });
    const metadata = await image.metadata();
    const mime = metadata.format === "jpeg" ? "image/jpeg" : metadata.format === "png" ? "image/png" : metadata.format === "webp" ? "image/webp" : null;
    if (mime !== file.data.type || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image");
    const thumbnail = await image.rotate().resize(256, 256, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
    if (thumbnail.length > 65536) throw new Error("Thumbnail too large");
    return thumbnail;
  } catch {
    throw new ProfilePhotoError("Unable to read this photo. Use a static image up to 12 megapixels.");
  }
}
