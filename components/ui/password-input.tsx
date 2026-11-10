"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { Input } from "./input";
import { Button } from "./button";

export function PasswordInput({
  id, className, disabled, toggleDisabled, visibilityLabel = "password", ...props
}: Omit<ComponentProps<"input">, "type"> & { id: string; visibilityLabel?: string; toggleDisabled?: boolean }) {
  const [visible, setVisible] = useState(false);
  const label = `${visible ? "Hide" : "Show"} ${visibilityLabel}`;
  return <div className="relative">
    <Input {...props} id={id} type={visible ? "text" : "password"} disabled={disabled} className={cn("pr-12", className)} />
    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 text-muted-foreground"
      aria-label={label} aria-controls={id} title={label} disabled={disabled || toggleDisabled}
      onClick={() => setVisible((value) => !value)}>
      {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </Button>
  </div>;
}
