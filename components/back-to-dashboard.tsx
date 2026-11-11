import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";

export function BackToDashboard({ className }: { className?: string }) {
  return <Link href="/dashboard" className={cn("inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring", className)}><ArrowLeft className="size-4" aria-hidden="true" />Back to dashboard</Link>;
}
