"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFeedbackToast, toastInvalidInput } from "@/components/use-feedback-toast";
import { FormSelect } from "@/components/ui/form-select";
import { createTransactionAction, editTransactionAction } from "./actions";
import type { CategoryOption, TransactionView } from "./schemas";
import { transactionDetailHref } from "./navigation";

export function TransactionForm({
  categories,
  record,
  submissionKey,
  today,
  returnTo = "/transactions",
}: {
  categories: CategoryOption[];
  record?: TransactionView;
  submissionKey?: string;
  today: string;
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState(
    record ? editTransactionAction : createTransactionAction,
    { message: "" },
  );
  // Keep retry/version identity stable across failed action rerenders.
  useFeedbackToast(state);
  const [identity] = useState({ id: record?.id, version: record?.version, submissionKey });
  // Controlled values preserve entries after React resets a completed form action.
  const [values, setValues] = useState({
    type: record?.type ?? "EXPENSE",
    amount: record?.amount ?? "",
    categoryId: record?.categoryId ?? "",
    occurredOn: record?.occurredOn ?? today,
    merchant: record?.merchant ?? "",
    note: record?.note ?? "",
  });
  const change = (key: keyof typeof values, value: string) =>
    setValues((previous) => ({ ...previous, [key]: value }));
  function error(name: string) {
    return state.errors?.[name]?.length ? (
      <p id={`${name}-error`} className="text-sm text-destructive">
        {state.errors[name][0]}
      </p>
    ) : null;
  }
  const validation = (name: string) => ({
    "aria-invalid": !!state.errors?.[name],
    "aria-describedby": state.errors?.[name] ? `${name}-error` : undefined,
  });
  return (
    <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-6">
      <input type="hidden" name="returnTo" value={returnTo} />
      {record ? (
        <>
          <input type="hidden" name="id" value={identity.id} />
          <input type="hidden" name="version" value={identity.version} />
        </>
      ) : (
        <input type="hidden" name="submissionKey" value={identity.submissionKey} />
      )}
      <fieldset disabled={pending} className="space-y-6 disabled:opacity-60">
        <legend className="sr-only">Transaction details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <FormSelect
              id="type"
              name="type"
              className="w-full"
              value={values.type}
              onValueChange={(value) =>
                setValues({
                  ...values,
                  type: value === "INCOME" ? "INCOME" : "EXPENSE",
                  categoryId: "",
                })
              }
              {...validation("type")}
             options={[{value:"EXPENSE",label:"Expense"},{value:"INCOME",label:"Income"}]} />
            {error("type")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (MMK)</Label>
            <Input
              id="amount"
              name="amount"
              inputMode="numeric"
              required
              pattern="[0-9]+"
              maxLength={16}
              placeholder="e.g. 12500"
              value={values.amount}
              onChange={(event) => change("amount", event.target.value)}
              {...validation("amount")}
            />
            <p className="text-xs text-muted-foreground">
              Whole kyat, without decimals or commas.
            </p>
            {error("amount")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <FormSelect
              id="categoryId"
              name="categoryId"
              className="w-full"
              value={values.categoryId}
              required
              onValueChange={(value) => change("categoryId", value)}
              {...validation("categoryId")}
             options={[{value:"",label:"Choose a category"},...categories.filter(category=>category.type===values.type).map(category=>({value:category.id,label:category.name}))]} />
            {error("categoryId")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="occurredOn">Date</Label>
            <DatePicker
              id="occurredOn"
              label="Date"
              name="occurredOn"
              min="1900-01-01"
              max="9999-12-31"
              required
              value={values.occurredOn}
              onValueChange={(value) => change("occurredOn", value)}
              {...validation("occurredOn")}
            />
            {error("occurredOn")}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="merchant">
            Merchant or source{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id="merchant"
            name="merchant"
            maxLength={200}
            placeholder="Who was it paid to or received from?"
            value={values.merchant}
            onChange={(event) => change("merchant", event.target.value)}
            {...validation("merchant")}
          />
          {error("merchant")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">
            Note{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="note"
            name="note"
            maxLength={1000}
            rows={4}
            placeholder="Any details you want to remember"
            value={values.note}
            onChange={(event) => change("note", event.target.value)}
            {...validation("note")}
          />
          {error("note")}
        </div>
      </fieldset>
      {state.message && (
        <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>
      )}
      {!categories.length && (
        <p role="alert" className="text-sm text-destructive">
          No categories are available. Ask the administrator to run the category
          seed.
        </p>
      )}
      <div className="flex flex-wrap gap-3 border-t pt-5">
        <Button
          type="submit"
          size="lg"
          disabled={pending || !categories.length}
        >
          {pending ? "Saving…" : record ? "Save changes" : "Create transaction"}
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={record ? transactionDetailHref(record.id, returnTo) : returnTo}>
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}
