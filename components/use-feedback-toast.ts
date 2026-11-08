"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { toast, cancelLoginToast } from "@/components/ui/toaster";

type Feedback = { message: string; ok?: boolean; errors?: Record<string, string[] | undefined> };

export function useFeedbackToast(state: Feedback, successTitle = "Success", errorTitle = "Unable to complete action") {
  const previous = useRef<Feedback | null>(null);
  useEffect(() => {
    if (previous.current === state) return;
    previous.current = state;
    if (!state.message) return;
    if (state.ok) toast.success(state.message, successTitle);
    else {
      cancelLoginToast();
      const message = Object.keys(state.errors ?? {}).length ? "Please check the highlighted fields and try again." : state.message;
      toast.error(message, errorTitle);
    }
  }, [state, successTitle, errorTitle]);
}

export function toastInvalidInput(event: FormEvent<HTMLFormElement>) {
  if (event.target === event.currentTarget.querySelector("input:invalid, select:invalid, textarea:invalid")) {
    toast.error("Check required fields and input formats, then try again.", "Please check your input");
  }
}
