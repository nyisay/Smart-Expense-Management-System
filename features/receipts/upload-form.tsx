"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryOption } from "@/features/transactions/schemas";
import type { ReceiptSuggestion } from "./schemas";
import { extractReceiptAction, confirmReceiptAction } from "./actions";

const fieldLabels = {
  merchant: "Merchant",
  total: "Final total",
  date: "Transaction date",
  currency: "Currency",
  categoryId: "Expense category",
};

function ReviewForm({
  suggestion,
  submissionKey,
  categories,
}: {
  suggestion: ReceiptSuggestion;
  submissionKey: string;
  categories: CategoryOption[];
}) {
  const [state, action, pending] = useActionState(confirmReceiptAction, {
    message: "",
  });
  const [values, setValues] = useState({
    merchant: suggestion.merchant ?? "",
    amount: suggestion.total ?? "",
    occurredOn: suggestion.date ?? "",
    currency: suggestion.currency ?? "",
    categoryId: suggestion.categoryId ?? "",
    note: "",
  });
  const [confirmed, setConfirmed] = useState(false);
  function change(key: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setConfirmed(false);
  }
  const error = (name: string) =>
    state.errors?.[name] ? (
      <p id={`review-${name}-error`} className="text-sm text-destructive">
        {state.errors[name][0]}
      </p>
    ) : null;
  const validation = (name: string) => ({
    "aria-invalid": !!state.errors?.[name],
    "aria-describedby": state.errors?.[name]
      ? `review-${name}-error`
      : undefined,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Review and confirm</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          AI suggestions can be wrong. Check the receipt and correct every
          field. Only your confirmed values will be saved.
        </p>
        {suggestion.uncertain.length > 0 && (
          <p role="status" className="mb-4 rounded-lg border p-3 text-sm">
            Missing or uncertain — enter manually:{" "}
            {suggestion.uncertain.map((field) => fieldLabels[field]).join(", ")}
            .
          </p>
        )}
        {suggestion.currency !== "MMK" && (
          <p className="mb-4 text-sm text-destructive">
            {suggestion.currency
              ? `Detected currency: ${suggestion.currency}.`
              : "Currency could not be identified."}{" "}
            Only MMK expenses are supported. No currency conversion is
            performed; verify currency and enter a whole-kyat amount yourself.
          </p>
        )}
        <form action={action} className="space-y-5">
          <input type="hidden" name="submissionKey" value={submissionKey} />
          <fieldset
            disabled={pending}
            className="space-y-5 disabled:opacity-60"
          >
            <legend className="sr-only">Reviewed receipt expense</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="review-merchant">Merchant (optional)</Label>
                <Input
                  id="review-merchant"
                  name="merchant"
                  maxLength={200}
                  value={values.merchant}
                  onChange={(e) => change("merchant", e.target.value)}
                  {...validation("merchant")}
                />
                {error("merchant")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-amount">Final total (whole kyat)</Label>
                <Input
                  id="review-amount"
                  name="amount"
                  required
                  inputMode="numeric"
                  pattern="[0-9]+"
                  maxLength={16}
                  value={values.amount}
                  onChange={(e) => change("amount", e.target.value)}
                  {...validation("amount")}
                />
                {error("amount")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-occurredOn">Transaction date</Label>
                <Input
                  id="review-occurredOn"
                  name="occurredOn"
                  required
                  type="date"
                  min="1900-01-01"
                  max="9999-12-31"
                  value={values.occurredOn}
                  onChange={(e) => change("occurredOn", e.target.value)}
                  {...validation("occurredOn")}
                />
                {error("occurredOn")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-currency">Currency</Label>
                <NativeSelect
                  className="w-full"
                  id="review-currency"
                  name="currency"
                  required
                  value={values.currency}
                  onChange={(e) => change("currency", e.target.value)}
                  {...validation("currency")}
                >
                  <NativeSelectOption value="">
                    Verify currency
                  </NativeSelectOption>
                  {values.currency && values.currency !== "MMK" && (
                    <NativeSelectOption value={values.currency} disabled>
                      {values.currency} — unsupported
                    </NativeSelectOption>
                  )}
                  <NativeSelectOption value="MMK">
                    MMK — whole kyat
                  </NativeSelectOption>
                </NativeSelect>
                {error("currency")}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="review-categoryId">Expense category</Label>
                <NativeSelect
                  className="w-full"
                  id="review-categoryId"
                  name="categoryId"
                  required
                  value={values.categoryId}
                  onChange={(e) => change("categoryId", e.target.value)}
                  {...validation("categoryId")}
                >
                  <NativeSelectOption value="">
                    Choose a category
                  </NativeSelectOption>
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {error("categoryId")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review-note">Note (optional)</Label>
              <Textarea
                id="review-note"
                name="note"
                maxLength={1000}
                value={values.note}
                onChange={(e) => change("note", e.target.value)}
                {...validation("note")}
              />
              {error("note")}
            </div>
            <div>
              <label className="flex items-start gap-3 text-sm">
                <input
                  className="mt-1 size-4 shrink-0 accent-primary"
                  type="checkbox"
                  name="confirmed"
                  value="yes"
                  required
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  {...validation("confirmed")}
                />
                <span>
                  I reviewed the merchant, final total, date, currency and
                  category and confirm this expense.
                </span>
              </label>
              {error("confirmed")}
            </div>
          </fieldset>
          {state.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            disabled={
              pending ||
              !confirmed ||
              values.currency !== "MMK" ||
              !categories.length
            }
          >
            {pending ? "Saving…" : "Confirm and save expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReceiptUploadForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [state, action, pending] = useActionState(
    extractReceiptAction,
    { message: "" },
    "/receipts/new",
  );
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload a receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <Label htmlFor="receipt-image">Receipt image</Label>
            <Input
              id="receipt-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              disabled={pending}
              aria-describedby="receipt-limits"
            />
            <p id="receipt-limits" className="text-sm text-muted-foreground">
              JPG, PNG or WebP. Maximum 10 MiB and 20 megapixels; static images
              only. Images are processed temporarily by this server and local
              Ollama and are not stored. Suggestions stay in this page until
              confirmed; leaving or reloading discards them.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Extracting…"
                  : state.suggestion
                    ? "Extract another image"
                    : "Extract receipt"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/transactions/new">Enter manually</Link>
              </Button>
            </div>
          </form>
          <div aria-live="polite" aria-busy={pending} className="mt-4 text-sm">
            {pending
              ? "Reading your receipt with local Ollama. This can take up to two minutes. Nothing is saved during extraction."
              : state.message}
          </div>
        </CardContent>
      </Card>
      {!pending && state.suggestion && state.reviewKey && (
        <ReviewForm
          key={state.reviewKey}
          suggestion={state.suggestion}
          submissionKey={state.reviewKey}
          categories={categories}
        />
      )}
      {!categories.length && (
        <p role="alert">
          No expense categories are available. Run the category seed before
          saving.
        </p>
      )}
    </div>
  );
}
