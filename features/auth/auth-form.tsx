"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction } from "./actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [state, action, pending] = useActionState(registering ? registerAction : loginAction, { ok: false, message: "" });
  const inputClass = "w-full rounded border border-zinc-400 bg-transparent px-3 py-2";
  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">{registering ? "Create your account" : "Sign in"}</h1>
      <form action={action} className="space-y-5">
        {registering && <label className="block">Name<input className={inputClass} name="name" required maxLength={80} autoComplete="name" /></label>}
        <label className="block">Email<input className={inputClass} name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label className="block">Password<input className={inputClass} name="password" type="password" required minLength={12} maxLength={128} autoComplete={registering ? "new-password" : "current-password"} /></label>
        <p className="text-sm">Use 12–128 characters.</p>
        <p role="status" aria-live="polite">{state.message}</p>
        <button disabled={pending} className="rounded bg-zinc-900 px-5 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
          {pending ? "Please wait…" : registering ? "Register" : "Sign in"}
        </button>
      </form>
      <p className="mt-6"><Link className="underline" href={registering ? "/login" : "/register"}>{registering ? "Go to sign in" : "Create an account"}</Link></p>
    </main>
  );
}
