"use client";
import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { budgetAction } from "./actions";

export function BudgetForm({ month, category, limit, version, budgetId }: { month: string; category: { id: string; name: string }; limit: string | null; version: number; budgetId: string | null }) {
  const [state, action, pending] = useActionState(budgetAction, { message: "" });
  const [amount, setAmount] = useState(limit ?? "");
  return <form action={action} className="space-y-3 border-t pt-4">
    <input type="hidden" name="month" value={month} />
    <input type="hidden" name="categoryId" value={category.id} />
    <input type="hidden" name="version" value={version} />
    <input type="hidden" name="id" value={budgetId ?? ""} />
    <Label htmlFor={`budget-${category.id}`}>{category.name} monthly limit (MMK)</Label>
    <Input id={`budget-${category.id}`} name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} required pattern="[0-9]+" maxLength={16} inputMode="numeric" disabled={pending} aria-describedby={`budget-error-${category.id}`} />
    <p id={`budget-error-${category.id}`} role="status" className="text-sm text-destructive">{state.message}</p>
    <div className="flex flex-wrap gap-2">
      <Button name="intent" value="save" disabled={pending}>Save {category.name} budget</Button>
      {limit !== null && <Button name="intent" value="remove" formNoValidate variant="outline" disabled={pending}>Remove {category.name} limit</Button>}
    </div>
    <p className="text-xs text-muted-foreground">Removing a limit keeps every transaction.</p>
  </form>;
}
