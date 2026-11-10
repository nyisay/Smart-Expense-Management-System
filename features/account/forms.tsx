"use client";

import { useActionState, useState } from "react";
import { Save, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeedbackToast, toastInvalidInput } from "@/components/use-feedback-toast";
import { updateProfileAction, changePasswordAction, type AccountState } from "./actions";

const initialState: AccountState = { ok: false, message: "" };
function Feedback({ state }: { state: AccountState }) {
  return <div role="status" aria-live="polite">
    {state.message && <Alert role="presentation" variant={state.ok ? "default" : "destructive"}>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>}
  </div>;
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [value, setValue] = useState(name);
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  useFeedbackToast(state, "Profile saved", "Profile update failed");
  return <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-5">
    <input type="hidden" name="expectedName" value={name} />
    <div className="space-y-2">
      <Label htmlFor="profile-name">Display name</Label>
      <Input id="profile-name" name="name" autoComplete="name" required maxLength={80} value={value}
        onChange={(event) => setValue(event.target.value)} disabled={pending}
        aria-invalid={Boolean(state.errors?.name)} aria-describedby="profile-name-help profile-name-error" />
      <p id="profile-name-help" className="text-sm text-muted-foreground">Your name appears in your personal workspace.</p>
      <p id="profile-name-error" className="text-sm text-destructive">{state.errors?.name?.join(" ")}</p>
    </div>
    <div className="space-y-2">
      <Label htmlFor="profile-email">Email address</Label>
      <Input id="profile-email" type="email" value={email} readOnly autoComplete="email" aria-describedby="profile-email-help" className="text-muted-foreground" />
      <p id="profile-email-help" className="text-sm text-muted-foreground">Your sign-in email is read-only.</p>
    </div>
    <Feedback state={state} />
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
      <Button type="submit" disabled={pending || value.trim() === name}><Save aria-hidden="true" />{pending ? "Saving…" : "Save profile"}</Button>
      <Button type="button" variant="outline" onClick={() => setValue(name)} disabled={pending || value === name}>Reset changes</Button>
    </div>
  </form>;
}

const passwordFields = [
  ["currentPassword", "Current password", "current-password"],
  ["newPassword", "New password", "new-password"],
  ["confirmPassword", "Confirm new password", "new-password"],
] as const;

export function PasswordForm() {
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  useFeedbackToast(state, "Password updated", "Password update failed");
  return <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-5">
    {passwordFields.map(([field, label, autocomplete]) => <div key={field} className="space-y-2">
      <Label htmlFor={`account-${field}`}>{label}</Label>
      <PasswordInput id={`account-${field}`} name={field} visibilityLabel={label.toLowerCase()} autoComplete={autocomplete}
        required minLength={field === "currentPassword" ? 1 : 12} maxLength={128} disabled={pending}
        value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
        aria-invalid={Boolean(state.errors?.[field])} aria-describedby={`account-${field}-error password-policy`} />
      <p id={`account-${field}-error`} className="text-sm text-destructive">{state.errors?.[field]?.join(" ")}</p>
    </div>)}
    <p id="password-policy" className="text-sm text-muted-foreground">Use a different password with 12–128 characters. All devices, including this one, will be signed out.</p>
    <Feedback state={state} />
    <div className="border-t border-border pt-5">
      <Button type="submit" disabled={pending}><LockKeyhole aria-hidden="true" />{pending ? "Updating password…" : "Update password and sign out"}</Button>
    </div>
  </form>;
}
