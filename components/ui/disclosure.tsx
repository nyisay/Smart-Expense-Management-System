"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import { Button } from "./button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

export function Disclosure({ title, children, defaultOpen = false, className }: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return <Collapsible defaultOpen={defaultOpen} className={cn("group/disclosure rounded-xl border bg-muted/10 p-3", className)}>
    <CollapsibleTrigger asChild>
      <Button type="button" variant="ghost" className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal text-left">
        {title}<ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-data-[state=open]/disclosure:rotate-180" />
      </Button>
    </CollapsibleTrigger>
    {/* Keep mounted so collapsing a receipt preview preserves its temporary image URL/ref. */}
    <CollapsibleContent forceMount className="pt-3 data-[state=closed]:hidden">{children}</CollapsibleContent>
  </Collapsible>;
}
