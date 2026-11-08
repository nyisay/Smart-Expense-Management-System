import { formatAmount } from "@/lib/money";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BudgetForm } from "./form";
import type { BudgetMonth } from "./store";

export function BudgetView({ data }: { data: BudgetMonth }) {
  return <div className="grid gap-5 md:grid-cols-2">{data.categories.map((category) => <Card key={category.id}>
    <CardHeader><CardTitle><h2>{category.name}</h2></CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-xl font-semibold tabular-nums [overflow-wrap:anywhere]">Spent {formatAmount(category.spent)}</p>
      {category.limit === null ? <p className="text-sm text-muted-foreground">Unbudgeted — no limit set for this month.</p> : <>
        <div role="progressbar" aria-label={`${category.name} budget progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.progress} aria-valuetext={`${formatAmount(category.spent)} of ${formatAmount(category.limit)}, ${category.percentage}`} className="h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${category.progress}%` }} />
        </div>
        <p className="break-words text-sm">{category.percentage} of {formatAmount(category.limit)}</p>
        <p className="text-sm" data-budget-category={category.name} data-spent={category.spent} data-overspend={category.overspend}>
          {category.status === "over" ? `Overspent by ${formatAmount(category.overspend)}` : `${formatAmount(category.remaining!)} remaining`}
          {category.status === "approaching" ? " · 80% threshold reached" : category.status === "reached" ? " · Limit reached" : ""}
        </p>
      </>}
      <BudgetForm key={`${data.month}-${category.id}-${category.budgetId}-${category.version}`} month={data.month} category={category} limit={category.limit} version={category.version} budgetId={category.budgetId} />
    </CardContent>
  </Card>)}</div>;
}
