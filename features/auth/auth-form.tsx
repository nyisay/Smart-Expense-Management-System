"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, registerAction } from "./actions";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [state, action, pending] = useActionState(
    registering ? registerAction : loginAction,
    { ok: false, message: "" },
  );
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-7 px-4 py-12 sm:max-w-lg sm:px-6">
      <div className="ml-auto w-40"><ThemeSwitcher /></div>
      <div className="flex items-center justify-center gap-3">
        <span className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-sm">
          <Wallet className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold tracking-tight">Smart Expense</p>
          <p className="text-sm text-muted-foreground">Your finances, in focus</p>
        </div>
      </div>
      <Card className="[--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
        <CardHeader>
          <h1 className="text-2xl font-semibold tracking-tight">
            {registering ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A clearer view of your everyday spending.
          </p>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-5">
            {registering && (
              <div className="space-y-2">
                <Label htmlFor="auth-name">Name</Label>
                <Input id="auth-name" name="name" required maxLength={80} autoComplete="name" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" name="email" type="email" required maxLength={254} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete={registering ? "new-password" : "current-password"}
                aria-describedby="password-help"
              />
            </div>
            <p id="password-help" className="text-sm text-muted-foreground">
              Use 12–128 characters.
            </p>
            <p role="status" aria-live="polite" className="text-sm">
              {state.message}
            </p>
            <Button disabled={pending} className="w-full">
              {pending ? "Please wait…" : registering ? "Register" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link
              className="rounded text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              href={registering ? "/login" : "/register"}
            >
              {registering ? "Go to sign in" : "Create an account"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
