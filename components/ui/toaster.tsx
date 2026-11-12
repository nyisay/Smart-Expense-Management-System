"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Toast } from "radix-ui";
import { CircleCheck, CircleAlert, X } from "lucide-react";
import { Button } from "./button";

type Notice = { id: number; kind: "success" | "error"; title: string; message: string };
let sequence = 0;
let loginStartedAt: number | null = null;
const eventName = "expense-notification";

function publish(kind: Notice["kind"], message: string, title: string) {
  window.dispatchEvent(new CustomEvent<Notice>(eventName, {
    detail: { id: ++sequence, kind, title, message },
  }));
}

export const toast = {
  success: (message: string, title = "Success") => publish("success", message, title),
  error: (message: string, title = "Unable to complete action") => publish("error", message, title),
};

// Only a short-lived UI intent; never credentials, session data or browser storage.
export function beginLoginToast() { loginStartedAt = Date.now(); }
export function cancelLoginToast() { loginStartedAt = null; }

export function Toaster() {
  const pathname = usePathname();
  const [notice, setNotice] = useState<Notice | null>(null);
  useEffect(() => {
    const receive = (event: Event) => {
      if (event instanceof CustomEvent) setNotice(event.detail);
    };
    window.addEventListener(eventName, receive);
    return () => window.removeEventListener(eventName, receive);
  }, []);
  useEffect(() => {
    if (pathname === "/login") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("registered") === "1") {
        toast.success("If registration can be completed, you can now sign in.", "Registration request received");
        url.searchParams.delete("registered");
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
    }
    if (pathname === "/dashboard" && loginStartedAt !== null) {
      const timely = Date.now() - loginStartedAt < 60_000;
      cancelLoginToast();
      if (timely) toast.success("Your personal dashboard is ready.", "Signed in successfully");
    }
  }, [pathname]);
  return <Toast.Provider label="Notification" swipeDirection="right" duration={6000}>
    {notice && <Toast.Root key={notice.id} open data-slot="toast" data-kind={notice.kind} data-toast-id={notice.id}
      duration={notice.kind === "error" ? 10_000 : 6000}
      onOpenChange={(open) => { if (!open) setNotice((current) => current?.id === notice.id ? null : current); }}
      className="pointer-events-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-2 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]">
      {notice.kind === "success" ? <CircleCheck aria-hidden="true" className="mt-0.5 size-5 text-[var(--positive)]" /> : <CircleAlert aria-hidden="true" className="mt-0.5 size-5 text-destructive" />}
      <div className="min-w-0"><Toast.Title className="text-sm font-semibold">{notice.title}</Toast.Title><Toast.Description className="mt-1 break-words text-sm text-muted-foreground">{notice.message}</Toast.Description></div>
      <Toast.Close asChild><Button type="button" size="icon-sm" variant="ghost" aria-label="Dismiss notification"><X aria-hidden="true" /></Button></Toast.Close>
    </Toast.Root>}
    <Toast.Viewport label="Notifications (F8)" className="pointer-events-none fixed top-4 right-4 z-[100] m-0 flex w-[calc(100vw-2rem)] max-w-sm list-none flex-col gap-3 outline-none sm:top-auto sm:bottom-4" />
  </Toast.Provider>;
}
