"use client";

import type { ReactElement } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { logoutAction } from "./actions";

function ConfirmationButtons() {
  const { pending } = useFormStatus();
  return (
    <AlertDialogFooter className="flex-row justify-center sm:justify-center">
      <AlertDialogCancel type="button" disabled={pending}>No</AlertDialogCancel>
      <Button type="submit" variant="destructive" className="bg-destructive text-background hover:bg-destructive/90 dark:bg-destructive dark:text-background dark:hover:bg-destructive/90" disabled={pending}>{pending ? "Logging out…" : "Yes"}</Button>
    </AlertDialogFooter>
  );
}

export function LogoutConfirmation({ children }: { children: ReactElement }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
          <AlertDialogDescription>You’ll need to sign in again to access your account.</AlertDialogDescription>
        </AlertDialogHeader>
        <form action={logoutAction}><ConfirmationButtons /></form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
