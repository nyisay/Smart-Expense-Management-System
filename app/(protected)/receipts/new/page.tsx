import { BackToDashboard } from "@/components/back-to-dashboard";
import { randomUUID } from "node:crypto";
import { getCategories } from "@/features/transactions/queries";
import { ReceiptUploadForm } from "@/features/receipts/upload-form";

export const metadata = { title: "Upload receipt | Smart Expense" };

export default async function ReceiptUploadPage() {
  const categories = (await getCategories()).filter(
    (category) => category.type === "EXPENSE",
  );
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <BackToDashboard />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Receipt to expense
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload, review, then confirm. You control what gets saved.
        </p>
      </header>
      <ReceiptUploadForm key={randomUUID()} categories={categories} usesCloud={process.env.RECEIPT_PROVIDER === "ollama-cloud"} />
    </main>
  );
}
