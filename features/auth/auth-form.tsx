"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeedbackToast, toastInvalidInput } from "@/components/use-feedback-toast";
import { beginLoginToast } from "@/components/ui/toaster";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const fieldStyle = "rounded-none border-x-0 border-t-0 bg-transparent pl-0 shadow-none";
  const [state, action, pending] = useActionState(
    registering ? registerAction : loginAction,
    { ok: false, message: "" },
  );
  useFeedbackToast(state, registering ? "Registration request received" : "Signed in successfully", registering ? "Registration unavailable" : "Unable to sign in");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-6 sm:px-8 sm:py-10">
        <div className="grid w-full max-w-[972px] lg:min-h-[655.2px] lg:grid-cols-2">
          <div data-auth-photo aria-hidden="true" className="relative hidden overflow-hidden rounded-l-2xl border border-r-0 border-border/60 bg-muted/15 lg:block">
            <Image src="/auth/account-market-photo.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 1px" className="object-cover" />
          </div>
          <section aria-labelledby="auth-heading" className="glass-panel flex min-h-[640px] min-w-0 flex-col justify-between gap-10 rounded-2xl border border-border px-5 py-8 sm:px-10 sm:py-10 lg:gap-6 lg:rounded-l-none lg:px-12">
            <div className="flex items-center justify-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Wallet className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold tracking-tight">Smart Expense</p>
                <p className="text-xs text-muted-foreground">Your finances, in focus</p>
              </div>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-8">
              <header className="space-y-2 text-center">
                <h1 id="auth-heading" className="text-3xl font-semibold tracking-tight">
                  {registering ? "Create your account" : "Sign in"}
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {registering ? "A clearer view of your money starts here." : "Welcome back. Enter your details to continue."}
                </p>
              </header>
              <form action={action} onInvalidCapture={toastInvalidInput} onSubmit={() => { if (!registering) beginLoginToast(); }} className="space-y-5">
                {registering && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-name">Name</Label>
                    <Input id="auth-name" name="name" required maxLength={80} autoComplete="name" className={fieldStyle} placeholder="Your name" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="auth-email">Email</Label>
                  <Input id="auth-email" name="email" type="email" required maxLength={254} autoComplete="email" className={fieldStyle} placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password">Password</Label>
                  <PasswordInput id="auth-password" name="password" required minLength={12} maxLength={128}
                    className={fieldStyle} placeholder={registering ? "Choose a password" : "Enter your password"}
                    autoComplete={registering ? "new-password" : "current-password"}
                    aria-describedby="password-help" toggleDisabled={pending} />
                </div>
                <p id="password-help" className="text-xs text-muted-foreground">Use 12–128 characters.</p>
                <div role="status" aria-live="polite">
                  {state.message && <Alert role="presentation" variant={state.ok ? "default" : "destructive"}><AlertDescription>{state.message}</AlertDescription></Alert>}
                </div>
                <Button disabled={pending} className="h-12 w-full rounded-full">
                  {pending ? "Please wait…" : registering ? "Register" : "Sign in"}
                </Button>
              </form>
            </div>
            <p className="text-center text-sm leading-relaxed text-muted-foreground">
              {registering ? "Already have an account? " : "New to Smart Expense? "}
              <Link className="rounded font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" href={registering ? "/login" : "/register"}>
                {registering ? "Go to sign in" : "Create an account"}
              </Link>
            </p>
          </section>
        </div>
    </main>
  );
}
