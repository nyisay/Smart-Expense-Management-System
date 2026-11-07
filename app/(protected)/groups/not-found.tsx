import Link from "next/link";
export default function GroupNotFound() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6 py-12">
      <h1 className="text-2xl font-semibold">Group or bill not found</h1>
      <p>This record is unavailable.</p>
      <Link href="/groups" className="underline underline-offset-4">
        Back to groups
      </Link>
    </main>
  );
}
