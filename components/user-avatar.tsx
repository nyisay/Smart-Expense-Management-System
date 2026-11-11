"use client";

import { Avatar } from "radix-ui";
import { cn } from "cn";

export function UserAvatar({ name, photoId, className }: { name: string; photoId: string | null; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  return <Avatar.Root className={cn("inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary", className)}>
    {photoId && <Avatar.Image src={`/api/account/photo?v=${photoId}`} alt={`${name}'s profile photo`} className="size-full object-cover" />}
    <Avatar.Fallback delayMs={0} className="flex size-full items-center justify-center" aria-hidden="true">{initials}</Avatar.Fallback>
  </Avatar.Root>;
}
