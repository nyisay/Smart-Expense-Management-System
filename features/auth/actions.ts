"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { register } from "./service";

export type AuthState = { ok: boolean; message: string };

export async function registerAction(_state: AuthState, form: FormData): Promise<AuthState> {
  try {
    return await register({ name: form.get("name"), email: form.get("email"), password: form.get("password") });
  } catch {
    return { ok: false, message: "Registration is temporarily unavailable. Please try again." };
  }
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
