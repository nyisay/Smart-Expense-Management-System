"use client";

import { useId, useSyncExternalStore } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";

function subscribe(callback: () => void) {
  window.addEventListener("expense-theme", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("expense-theme", callback);
    window.removeEventListener("storage", callback);
  };
}

export function ThemeSwitcher() {
  const id = useId();
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme ?? "dark", () => "dark");
  return <div className="space-y-2">
    <Label htmlFor={id} className="text-xs text-muted-foreground">Appearance</Label>
    <NativeSelect id={id} className="w-full" value={theme} onChange={(event) => {
      const next = event.target.value === "frosted" ? "frosted" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("smart-expense-theme", next); } catch { /* Storage can be disabled; the current visit still works. */ }
      window.dispatchEvent(new Event("expense-theme"));
    }}>
      <NativeSelectOption value="dark">Dark Base</NativeSelectOption>
      <NativeSelectOption value="frosted">Frosted Glass</NativeSelectOption>
    </NativeSelect>
  </div>;
}
