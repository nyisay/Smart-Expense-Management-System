import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/money";
import type { GroupView } from "./store";
import { DeleteBill } from "./forms";

export function GroupFormPage({
  title,
  back,
  children,
}: {
  title: string;
  back: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <Link href={back} className="text-sm underline underline-offset-4">
        Back
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </main>
  );
}

export function GroupDetail({ group }: { group: GroupView }) {
  const name = (id: string) =>
    group.members.find((member) => member.id === id)?.name;
  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 sm:px-6">
      <Link href="/groups" className="text-sm underline underline-offset-4">
        Back to groups
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-sm text-muted-foreground">
            Owner-managed group · MMK
          </p>
          <h1 className="break-words text-3xl font-semibold tracking-tight">
            {group.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Group bills and repayments stay separate from your personal
            transactions and dashboard totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/groups/${group.id}/members/new`}>
              Add participant
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/groups/${group.id}/expenses/new`}>
              Add group expense
            </Link>
          </Button>
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Group spending</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="break-words text-3xl font-semibold"
              data-group-total={group.total}
            >
              {formatAmount(group.total)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {group.expenses.length} bill(s) · {group.members.length}{" "}
              participant(s). Repayments do not change spending.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Who owes whom</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Suggested repayments based on all current bills and recorded
              repayments.
            </p>
            {group.plan.length ? (
              <ul className="space-y-3">
                {group.plan.map((payment) => (
                  <li
                    key={`${payment.fromMemberId}:${payment.toMemberId}`}
                    className="flex flex-wrap justify-between gap-2 rounded-lg bg-muted p-3 text-sm"
                  >
                    <span className="min-w-0 break-words">
                      <strong>{name(payment.fromMemberId)}</strong> owes{" "}
                      <strong>{name(payment.toMemberId)}</strong>
                    </span>
                    <span className="font-semibold">
                      {formatAmount(payment.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No outstanding balances.</p>
            )}
            <Button variant="outline" asChild>
              <Link href={`/groups/${group.id}/settlements/new`}>
                Record repayment
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <section aria-labelledby="balances-title" className="space-y-4">
        <div>
          <h2 id="balances-title" className="text-xl font-semibold">
            Participant balances
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Net = paid − owed + repayments sent − repayments received. Positive
            means is owed; negative means owes. Guests are named labels managed
            by you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {group.balances.map((balance) => (
            <Card key={balance.id}>
              <CardHeader>
                <CardTitle className="break-words">
                  {name(balance.id)}
                  {group.members.find((member) => member.id === balance.id)
                    ?.isSelf
                    ? " (you)"
                    : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p
                  className="break-words text-xl font-semibold"
                  data-member-id={balance.id}
                  data-net={balance.net}
                >
                  {formatAmount(balance.net)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {BigInt(balance.net) > BigInt(0)
                      ? "is owed"
                      : BigInt(balance.net) < BigInt(0)
                        ? "owes"
                        : "settled"}
                  </span>
                </p>
                <dl className="space-y-1 text-sm">
                  {[
                    ["Paid", balance.paid],
                    ["Owed share", balance.owed],
                    ["Repaid", balance.sent],
                    ["Received repayments", balance.received],
                  ].map(([label, amount]) => (
                    <div
                      key={label}
                      className="flex flex-wrap justify-between gap-x-2"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>{formatAmount(amount)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section aria-labelledby="bills-title" className="space-y-4">
        <h2 id="bills-title" className="text-xl font-semibold">
          Group expenses
        </h2>
        {!group.expenses.length && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No group expenses yet. Add participants, then record the first
              bill.
            </CardContent>
          </Card>
        )}
        <div className="space-y-3">
          {group.expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">
                      {expense.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <time dateTime={expense.occurredOn}>
                        {expense.occurredOn}
                      </time>{" "}
                      · Paid by {name(expense.payerMemberId)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatAmount(expense.amount)}
                  </p>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer underline underline-offset-4">
                    View exact shares
                  </summary>
                  <ul className="mt-3 space-y-1">
                    {expense.shares.map((share) => (
                      <li
                        key={share.memberId}
                        className="flex flex-wrap justify-between gap-2"
                      >
                        <span className="break-words">
                          {name(share.memberId)}
                        </span>
                        <span>{formatAmount(share.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/groups/${group.id}/expenses/${expense.id}/edit`}
                    >
                      Edit bill
                    </Link>
                  </Button>
                  <DeleteBill
                    key={`${expense.id}:${expense.version}`}
                    groupId={group.id}
                    record={expense}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section aria-labelledby="repayments-title" className="space-y-4">
        <h2 id="repayments-title" className="text-xl font-semibold">
          Recorded repayments
        </h2>
        <p className="text-sm text-muted-foreground">
          Records of money already repaid outside this application; the app does
          not move money.
        </p>
        {!group.settlements.length ? (
          <p className="text-sm">No repayments recorded.</p>
        ) : (
          <ul className="space-y-2">
            {group.settlements.map((settlement) => (
              <li
                key={settlement.id}
                className="flex flex-wrap justify-between gap-3 rounded-lg border p-4 text-sm"
              >
                <span className="break-words">
                  {name(settlement.fromMemberId)} repaid{" "}
                  {name(settlement.toMemberId)} ·{" "}
                  <time dateTime={settlement.occurredOn}>
                    {settlement.occurredOn}
                  </time>
                </span>
                <span className="font-semibold">
                  {formatAmount(settlement.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
