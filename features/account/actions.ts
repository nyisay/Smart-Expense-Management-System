"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { logoutAction } from "@/features/auth/actions";
import { AccountError, updateProfile, changePassword } from "./store";

export type AccountState = { ok: boolean; message: string; errors?: Record<string, string[] | undefined> };
function failure(error: unknown): AccountState {
  if (error instanceof z.ZodError) return { ok: false, message: "Please correct the highlighted fields.", errors: z.flattenError(error).fieldErrors };
  return { ok: false, message: error instanceof AccountError ? error.message : "Unable to save right now. Your entries have been kept. Please retry." };
}

export async function updateProfileAction(_state: AccountState, form: FormData): Promise<AccountState> {
  const user = await requireUser();
  try {
    await updateProfile(user.id, { name: form.get("name"), expectedName: form.get("expectedName") });
  } catch (error) { return failure(error); }
  revalidatePath("/", "layout");
  return { ok: true, message: "Your profile has been updated." };
}

export async function changePasswordAction(_state: AccountState, form: FormData): Promise<AccountState> {
  const user = await requireUser();
  try {
    await changePassword(user.id, {
      currentPassword: form.get("currentPassword"),
      newPassword: form.get("newPassword"),
      confirmPassword: form.get("confirmPassword"),
    });
  } catch (error) { return failure(error); }
  // The database version already invalidates every existing JWT; clear this cookie too.
  await logoutAction();
  return { ok: true, message: "Password updated. Sign in again with your new password." };
}
