import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteGroup } from "@/features/groups/forms";
import { getGroups } from "@/features/groups/queries";

export const metadata = { title: "Groups | Smart Expense" };
export default async function GroupsPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const groups = await getGroups();
  const query = await searchParams;
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Link href="/dashboard" className="text-sm underline underline-offset-4">
        Back to dashboard
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Smart Group Splitting
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Shared bills, exact shares and clear repayments. Group records stay
            separate from your personal dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/groups/new">Create group</Link>
        </Button>
      </header>
      {query.deleted === "yes" && <Alert role="status"><AlertDescription>Group deleted. Its bills and repayments were removed.</AlertDescription></Alert>}
      {!groups.length && (
        <Card>
          <CardContent className="py-8">
            <h2 className="font-semibold">Your groups start here</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a group and add named participants, including guests.
            </p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="break-words">
                <Link
                  href={`/groups/${group.id}`}
                  className="underline underline-offset-4"
                >
                  {group.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {group._count.members} participant(s) · {group._count.expenses}{" "}
              bill(s) · {group.currency}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <DeleteGroup key={`${group.id}:${group.updatedAt.toISOString()}`} group={{ ...group, updatedAt: group.updatedAt.toISOString() }} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
