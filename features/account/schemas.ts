import { z } from "zod";
import { registrationSchema } from "@/features/auth/schemas";

export const profilePhotoSchema = z.strictObject({
  expectedPhotoId: z.preprocess((value) => value === "" ? null : value, z.uuid().nullable()),
});
export const profilePhotoFileSchema = z.file().min(1).max(2_000_000).mime(["image/jpeg", "image/png", "image/webp"]);

export const profileSchema = z.strictObject({
  name: registrationSchema.shape.name,
  expectedName: z.string().min(1).max(80),
});

export const passwordChangeSchema = z.strictObject({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  newPassword: z.string().min(12, "Use at least 12 characters.").max(128),
  confirmPassword: z.string().min(1, "Confirm your new password.").max(128),
}).superRefine((value, context) => {
  if (value.newPassword !== value.confirmPassword) context.addIssue({
    code: "custom", path: ["confirmPassword"], message: "The new passwords do not match.",
  });
  if (value.newPassword === value.currentPassword) context.addIssue({
    code: "custom", path: ["newPassword"], message: "Choose a different password.",
  });
});
