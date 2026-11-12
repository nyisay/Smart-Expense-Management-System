"use server";

import { AuthError } from "next-auth";
import { redirect, RedirectType } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { register } from "./service";

export type AuthState = { ok: boolean; message: string };

export async function registerAction(_state: AuthState, form: FormData): Promise<AuthState> {
  let result: AuthState;
  try {
    result = await register({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  } catch {
    return { ok: false, message: "Registration is temporarily unavailable. Please try again." };
  }
  if (!result.ok) return result;
  // Next redirects throw; keep this outside the error handler.
  redirect("/login?registered=1", RedirectType.replace);
}

export async function loginAction(_state: AuthState, form: FormData): Promise<AuthState> {
  try {
    await signIn("credentials", { email: form.get("email"), password: form.get("password"), redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: "Unable to sign in. Check your details or try again later." };
    throw error;
  }
  return { ok: true, message: "Signed in." };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
