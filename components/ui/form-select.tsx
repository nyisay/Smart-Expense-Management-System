"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type AriaAttributes } from "react";
import { cn } from "cn";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type Option = { value: string; label: string; disabled?: boolean };
type FormSelectProps = AriaAttributes & {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
};
const emptyOption = "__empty_option__";
const subscribe = () => () => {};

export function FormSelect({ id, name, value, defaultValue = "", onValueChange, options, required, disabled, className, ...aria }: FormSelectProps) {
  const generatedId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const resetting = useRef(false);
  const [draft, setDraft] = useState(defaultValue);
  const [invalid, setInvalid] = useState(false);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const current = value ?? draft;
  useEffect(() => {
    const form = trigger.current?.form;
    const reset = () => {
      // Radix also resets controlled values; failed actions must retain the user's draft.
      resetting.current = true;
      queueMicrotask(() => {
        const native = trigger.current?.parentElement?.querySelector("select");
        if (native) native.value = value ?? defaultValue;
        resetting.current = false;
      });
      if (value === undefined) setDraft(defaultValue);
      setInvalid(false);
    };
    form?.addEventListener("reset", reset, true);
    return () => form?.removeEventListener("reset", reset, true);
  }, [value, defaultValue]);
  return <div className="min-w-0" onInvalidCapture={(event) => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); }}>
    <Select name={name} value={current} required={required} disabled={disabled} onValueChange={(next) => {
      if (trigger.current?.matches(":disabled") || (resetting.current && value !== undefined)) return;
      const selected = next === emptyOption ? "" : next;
      if (value === undefined) setDraft(selected);
      setInvalid(false);
      onValueChange?.(selected);
    }}>
      <SelectTrigger {...aria} ref={trigger} id={id ?? generatedId} disabled={disabled || !hydrated} aria-invalid={aria["aria-invalid"] || invalid} className={cn("w-full min-w-0 bg-card", className)}>
        <SelectValue placeholder={options.find((option) => !option.value)?.label ?? "Choose an option"}>
          {current ? options.find((option) => option.value === current)?.label : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4} className="max-w-[calc(100vw-2rem)]">
        {options.map((option) => <SelectItem key={option.value} value={option.value || emptyOption} data-value={option.value} disabled={option.disabled} className="min-h-11 whitespace-normal transition-none">{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>;
}
