import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import Link from "next/link";
import { formatAmount } from "@/lib/money";
import type { DashboardData } from "./store";

export function RecentTable({ records }: { records: DashboardData["recent"] }) {
  return <div className="hidden overflow-x-auto md:block">
    <Table className="w-full text-left text-sm">
      <TableCaption className="sr-only">Recent transactions matching the selected dates and category, whole MMK</TableCaption>
      <TableHeader className="border-b text-xs text-muted-foreground"><TableRow><TableHead scope="col" className="py-3 font-medium">Transaction</TableHead><TableHead scope="col" className="p-3 font-medium">Category</TableHead><TableHead scope="col" className="p-3 font-medium">Date</TableHead><TableHead scope="col" className="p-3 text-right font-medium">Amount</TableHead></TableRow></TableHeader>
      <TableBody className="divide-y">{records.map((record) => <TableRow key={record.id} className="hover:bg-muted/30">
        <TableHead scope="row" className="max-w-64 py-4 pr-3 font-medium"><Link href={`/transactions/${record.id}`} className="break-words underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{record.merchant || record.categoryName}</Link><span className="mt-1 block text-xs font-normal text-muted-foreground">{record.type === "INCOME" ? "Income" : "Expense"}</span></TableHead>
        <TableCell className="p-3 text-muted-foreground">{record.categoryName}</TableCell>
        <TableCell className="whitespace-nowrap p-3 text-muted-foreground"><time dateTime={record.occurredOn}>{record.occurredOn}</time></TableCell>
        <TableCell className={`whitespace-nowrap p-3 text-right font-medium tabular-nums ${record.type === "INCOME" ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>{record.type === "INCOME" ? "+" : "−"}{formatAmount(record.amount)}</TableCell>
      </TableRow>)}</TableBody>
    </Table>
  </div>;
}
