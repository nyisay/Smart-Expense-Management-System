import Link from "next/link";
import { formatAmount } from "@/lib/money";
import type { DashboardData } from "./store";

export function RecentTable({ records }: { records: DashboardData["recent"] }) {
  return <div className="hidden overflow-x-auto md:block">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Recent transactions matching the selected dates and category, whole MMK</caption>
      <thead className="border-b text-xs text-muted-foreground"><tr><th scope="col" className="py-3 font-medium">Transaction</th><th scope="col" className="p-3 font-medium">Category</th><th scope="col" className="p-3 font-medium">Date</th><th scope="col" className="p-3 text-right font-medium">Amount</th></tr></thead>
      <tbody className="divide-y">{records.map((record) => <tr key={record.id} className="hover:bg-muted/30">
        <th scope="row" className="max-w-64 py-4 pr-3 font-medium"><Link href={`/transactions/${record.id}`} className="break-words underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{record.merchant || record.categoryName}</Link><span className="mt-1 block text-xs font-normal text-muted-foreground">{record.type === "INCOME" ? "Income" : "Expense"}</span></th>
        <td className="p-3 text-muted-foreground">{record.categoryName}</td>
        <td className="whitespace-nowrap p-3 text-muted-foreground"><time dateTime={record.occurredOn}>{record.occurredOn}</time></td>
        <td className={`whitespace-nowrap p-3 text-right font-medium tabular-nums ${record.type === "INCOME" ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{record.type === "INCOME" ? "+" : "−"}{formatAmount(record.amount)}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
