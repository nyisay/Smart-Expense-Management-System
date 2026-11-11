"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeedbackToast, toastInvalidInput } from "@/components/use-feedback-toast";
import { profilePhotoFileSchema } from "./schemas";
import { updateProfilePhotoAction, type AccountState } from "./actions";

const subscribe = () => () => {};

export function ProfilePhotoForm({ photoId }: { photoId: string | null }) {
  const [state, action, pending] = useActionState(updateProfilePhotoAction, { ok: false, message: "" } satisfies AccountState);
  const [error, setError] = useState("");
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  useFeedbackToast(state, "Profile photo saved", "Photo update failed");
  return <form action={action} onInvalidCapture={toastInvalidInput} className="mb-6 space-y-4 border-b pb-6">
    <input type="hidden" name="expectedPhotoId" value={photoId ?? ""} />
    <fieldset disabled={pending || !hydrated} className="space-y-3">
      <legend className="sr-only">Profile photo</legend>
      <Label htmlFor="profile-photo">Profile photo</Label>
      <Input id="profile-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required aria-invalid={!!error} aria-describedby="profile-photo-help profile-photo-error" onChange={(event) => {
        const file = event.target.files?.[0];
        const message = file && !profilePhotoFileSchema.safeParse(file).success ? "Choose a JPG, PNG or WebP photo up to 2 MB." : "";
        event.target.setCustomValidity(message);
        setError(message);
      }} />
      <p id="profile-photo-help" className="text-xs text-muted-foreground">JPG, PNG or WebP up to 2 MB. Saved as a centered 256×256 thumbnail, visible only in your signed-in workspace.</p>
      <p id="profile-photo-error" role={error ? "alert" : undefined} className="text-sm text-destructive">{error}</p>
      <div className="flex flex-wrap gap-2"><Button type="submit" name="intent" value="upload"><ImagePlus aria-hidden="true" />{pending ? "Updating photo…" : "Upload photo"}</Button>
        {photoId && <Button type="submit" name="intent" value="remove" formNoValidate variant="outline"><Trash2 aria-hidden="true" />Remove photo</Button>}
      </div>
    </fieldset>
    <div role="status" aria-live="polite">{state.message && <Alert role="presentation" variant={state.ok ? "default" : "destructive"}><AlertDescription>{state.message}</AlertDescription></Alert>}</div>
  </form>;
}
