"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFeedbackToast, toastInvalidInput } from "@/components/use-feedback-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { formatAmount, parseAmount } from "@/lib/money";
import { allocateShares } from "./calculations";
import {
  createGroupAction,
  deleteGroupAction,
  addMemberAction,
  createExpenseAction,
  editExpenseAction,
  deleteExpenseAction,
  recordSettlementAction,
  type GroupFormState,
} from "./actions";
import type { GroupView, ExpenseView } from "./store";

function Feedback({ state }: { state: GroupFormState }) {
  useFeedbackToast(state);
  const labels: Record<string, string> = {
    name: "Name",
    selfName: "Your participant name",
    title: "Bill title",
    amount: "Amount",
    occurredOn: "Date",
    payerMemberId: "Payer",
    mode: "Split method",
    shares: "Shares",
    fromMemberId: "Sender",
    toMemberId: "Recipient",
    confirmed: "Confirmation",
  };
  return state.message ? (
    <Alert variant="destructive"><AlertDescription className="space-y-1">
      <p>{state.message}</p>
      {Object.entries(state.errors ?? {}).map(([field, messages]) => (
        <p key={field}>
          {labels[field] ?? "Form"}: {messages[0]}
        </p>
      ))}
    </AlertDescription></Alert>
  ) : null;
}
function Cancel({ href }: { href: string }) {
  return (
    <Button variant="outline" asChild>
      <Link href={href}>Cancel</Link>
    </Button>
  );
}

export function NewGroupForm({
  id,
  selfName,
}: {
  id: string;
  selfName: string;
}) {
  const [state, action, pending] = useActionState(createGroupAction, {
    message: "",
  });
  const [identity] = useState(id);
  const [values, setValues] = useState({ name: "", selfName });
  return (
    <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-5">
      <input type="hidden" name="id" value={identity} />
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">New group</legend>
        <div className="space-y-2">
          <Label htmlFor="group-name">Group name</Label>
          <Input
            id="group-name"
            name="name"
            required
            maxLength={80}
            placeholder="Weekend trip"
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
            aria-invalid={!!state.errors?.name}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="self-name">Your participant name</Label>
          <Input
            id="self-name"
            name="selfName"
            required
            maxLength={80}
            value={values.selfName}
            onChange={(e) => setValues({ ...values, selfName: e.target.value })}
            aria-invalid={!!state.errors?.selfName}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Currency: MMK, whole kyat. You manage this group and its named
          participants, including guests.
        </p>
      </fieldset>
      <Feedback state={state} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending}>
          {pending ? "Creating…" : "Create group"}
        </Button>
        <Cancel href="/groups" />
      </div>
    </form>
  );
}

export function MemberForm({ groupId, id }: { groupId: string; id: string }) {
  const [state, action, pending] = useActionState(addMemberAction, {
    message: "",
  });
  const [identity] = useState(id);
  const [name, setName] = useState("");
  return (
    <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-5">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="id" value={identity} />
      <div className="space-y-2">
        <Label htmlFor="participant-name">Participant or guest name</Label>
        <Input
          id="participant-name"
          name="name"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          aria-invalid={!!state.errors?.name}
        />
        <p className="text-sm text-muted-foreground">
          Use a unique name. A participant is a label managed by you and does
          not need an account.
        </p>
      </div>
      <Feedback state={state} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending}>
          {pending ? "Adding…" : "Add participant"}
        </Button>
        <Cancel href={`/groups/${groupId}`} />
      </div>
    </form>
  );
}

export function ExpenseForm({
  group,
  record,
  submissionKey,
  today,
}: {
  group: Pick<GroupView, "id" | "members">;
  record?: ExpenseView;
  submissionKey?: string;
  today: string;
}) {
  const [state, action, pending] = useActionState(
    record ? editExpenseAction : createExpenseAction,
    { message: "" },
  );
  const [identity] = useState({
    id: record?.id,
    version: record?.version,
    submissionKey,
  });
  const [values, setValues] = useState({
    title: record?.title ?? "",
    amount: record?.amount ?? "",
    occurredOn: record?.occurredOn ?? today,
    payerMemberId: record?.payerMemberId ?? "",
    mode: "AMOUNT",
  });
  const [shares, setShares] = useState(() =>
    Object.fromEntries(
      group.members.map((member) => [
        member.id,
        record?.shares.find((share) => share.memberId === member.id)?.amount ??
          "0",
      ]),
    ),
  );
  let preview: { memberId: string; owedMinor: bigint }[] = [];
  let splitMessage = "";
  try {
    preview = allocateShares(
      parseAmount(values.amount),
      values.mode,
      group.members.map((member) => ({
        memberId: member.id,
        value: shares[member.id],
      })),
    );
  } catch (error) {
    splitMessage = error instanceof Error ? error.message : "Check the split.";
  }
  return (
    <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-6">
      <input type="hidden" name="groupId" value={group.id} />
      {record ? (
        <>
          <input type="hidden" name="id" value={identity.id} />
          <input type="hidden" name="version" value={identity.version} />
        </>
      ) : (
        <input
          type="hidden"
          name="submissionKey"
          value={identity.submissionKey}
        />
      )}
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">Group bill details</legend>
        <div className="space-y-2">
          <Label htmlFor="bill-title">Bill title</Label>
          <Input
            id="bill-title"
            name="title"
            required
            maxLength={200}
            placeholder="Dinner"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            aria-invalid={!!state.errors?.title}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bill-amount">Bill total (MMK)</Label>
            <Input
              id="bill-amount"
              name="amount"
              required
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={16}
              value={values.amount}
              onChange={(e) => setValues({ ...values, amount: e.target.value })}
              aria-invalid={!!state.errors?.amount}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-date">Date</Label>
            <Input
              id="bill-date"
              name="occurredOn"
              required
              type="date"
              min="1900-01-01"
              max="9999-12-31"
              value={values.occurredOn}
              onChange={(e) =>
                setValues({ ...values, occurredOn: e.target.value })
              }
              aria-invalid={!!state.errors?.occurredOn}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-payer">Who paid?</Label>
            <NativeSelect
              id="bill-payer"
              name="payerMemberId"
              required
              className="w-full"
              value={values.payerMemberId}
              onChange={(e) =>
                setValues({ ...values, payerMemberId: e.target.value })
              }
              aria-invalid={!!state.errors?.payerMemberId}
            >
              <NativeSelectOption value="">Choose payer</NativeSelectOption>
              {group.members.map((member) => (
                <NativeSelectOption key={member.id} value={member.id}>
                  {member.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-mode">Allocate shares by</Label>
            <NativeSelect
              id="bill-mode"
              name="mode"
              className="w-full"
              value={values.mode}
              onChange={(e) => {
                setValues({ ...values, mode: e.target.value });
                setShares(
                  Object.fromEntries(
                    group.members.map((member) => [member.id, "0"]),
                  ),
                );
              }}
            >
              <NativeSelectOption value="AMOUNT">
                Exact amounts (MMK)
              </NativeSelectOption>
              <NativeSelectOption value="PERCENT">
                Percentages
              </NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="font-medium">Each participant owes</h2>
          <p id="split-help" className="text-sm text-muted-foreground">
            {values.mode === "AMOUNT"
              ? "Enter whole-kyat amounts totaling the bill. Use 0 for someone not sharing it."
              : "Enter percentages totaling 100%, up to two decimal places. Remaining kyat go to the largest fractional shares; ties use participant ID order."}
          </p>
          {group.members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-[minmax(0,1fr)_minmax(6rem,9rem)] items-center gap-3"
            >
              <Label className="break-words" htmlFor={`share-${member.id}`}>
                {member.name}
                {member.isSelf ? " (you)" : ""}
              </Label>
              <input type="hidden" name="memberId" value={member.id} />
              <Input
                id={`share-${member.id}`}
                name="shareValue"
                required
                inputMode={values.mode === "PERCENT" ? "decimal" : "numeric"}
                maxLength={20}
                value={shares[member.id]}
                onChange={(e) =>
                  setShares({ ...shares, [member.id]: e.target.value })
                }
                aria-describedby="split-help split-preview"
                aria-invalid={!!state.errors?.shares}
              />
            </div>
          ))}
        </div>
        <div
          id="split-preview"
          role="status"
          aria-live="polite"
          className="rounded-lg border p-3 text-sm"
        >
          {splitMessage || (
            <>
              <p className="mb-2 font-medium">Exact saved shares</p>
              <ul className="space-y-1">
                {preview.map((share) => (
                  <li
                    key={share.memberId}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <span>
                      {
                        group.members.find(
                          (member) => member.id === share.memberId,
                        )?.name
                      }
                    </span>
                    <span>{formatAmount(share.owedMinor)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {record && (
          <p className="text-sm text-muted-foreground">
            Editing replaces this bill’s shares. Recorded repayments remain in
            the ledger and balances are recalculated.
          </p>
        )}
      </fieldset>
      <Feedback state={state} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending}>
          {pending
            ? "Saving…"
            : record
              ? "Save bill changes"
              : "Save group expense"}
        </Button>
        <Cancel href={`/groups/${group.id}`} />
      </div>
    </form>
  );
}

export function SettlementForm({
  group,
  submissionKey,
  today,
}: {
  group: Pick<GroupView, "id" | "members">;
  submissionKey: string;
  today: string;
}) {
  const [state, action, pending] = useActionState(recordSettlementAction, {
    message: "",
  });
  const [identity] = useState(submissionKey);
  const [values, setValues] = useState({
    fromMemberId: "",
    toMemberId: "",
    amount: "",
    occurredOn: today,
  });
  const [confirmed, setConfirmed] = useState(false);
  function change(field: keyof typeof values, value: string) {
    setValues({ ...values, [field]: value });
    setConfirmed(false);
  }
  return (
    <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-5">
      <input type="hidden" name="groupId" value={group.id} />
      <input type="hidden" name="submissionKey" value={identity} />
      <p className="text-sm text-muted-foreground">
        Record a repayment already made outside this application. This does not
        send money or create a personal transaction. Recorded repayments are
        append-only in this MVP; check the direction and amount carefully.
      </p>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">Completed repayment</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {(["fromMemberId", "toMemberId"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`settlement-${field}`}>
                {field === "fromMemberId" ? "Who repaid?" : "Who received it?"}
              </Label>
              <NativeSelect
                className="w-full"
                id={`settlement-${field}`}
                name={field}
                required
                value={values[field]}
                onChange={(e) => change(field, e.target.value)}
                aria-invalid={!!state.errors?.[field]}
              >
                <NativeSelectOption value="">
                  Choose participant
                </NativeSelectOption>
                {group.members.map((member) => (
                  <NativeSelectOption key={member.id} value={member.id}>
                    {member.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="settlement-amount">Repaid amount (MMK)</Label>
          <Input
            id="settlement-amount"
            name="amount"
            required
            inputMode="numeric"
            pattern="[0-9]+"
            maxLength={16}
            value={values.amount}
            onChange={(e) => change("amount", e.target.value)}
            aria-invalid={!!state.errors?.amount}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settlement-date">Repayment date</Label>
          <Input
            id="settlement-date"
            name="occurredOn"
            required
            type="date"
            min="1900-01-01"
            max="9999-12-31"
            value={values.occurredOn}
            onChange={(e) => change("occurredOn", e.target.value)}
            aria-invalid={!!state.errors?.occurredOn}
          />
        </div>
        <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
          <Checkbox
            id="settlement-confirmed"
            className="mt-0.5 size-5 after:-inset-y-3"
            name="confirmed"
            value="yes"
            required
            checked={confirmed}
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
          <Label htmlFor="settlement-confirmed" className="cursor-pointer text-sm font-normal leading-relaxed">
            I confirm this repayment already happened and the direction and
            amount are correct.
          </Label>
        </div>
      </fieldset>
      <Feedback state={state} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending || !confirmed}>
          {pending ? "Recording…" : "Record repayment"}
        </Button>
        <Cancel href={`/groups/${group.id}`} />
      </div>
    </form>
  );
}

export function DeleteGroup({ group }: { group: {
  id: string;
  name: string;
  updatedAt: string;
  _count: { members: number; expenses: number; settlements: number };
} }) {
  const [state, action, pending] = useActionState(deleteGroupAction, { message: "" });
  const [revision] = useState(group.updatedAt);
  return <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" size="sm" aria-label={`Delete group ${group.name}`}><Trash2 aria-hidden="true" />Delete group</Button>
    </AlertDialogTrigger>
    <AlertDialogContent onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this group?</AlertDialogTitle>
        <AlertDialogDescription className="break-words">
          Permanently delete “{group.name}”, its {group._count.members} participant(s), {group._count.expenses} bill(s) and their shares, and {group._count.settlements} recorded repayment(s). This cannot be undone. Personal transactions stay unchanged. Deleting records does not refund payments.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-4">
        <input type="hidden" name="groupId" value={group.id} />
        <input type="hidden" name="updatedAt" value={revision} />
        <input type="hidden" name="confirmed" value="yes" />
        <Feedback state={state} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button type="submit" variant="destructive" disabled={pending}><Trash2 aria-hidden="true" />{pending ? "Deleting…" : "Delete group permanently"}</Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  </AlertDialog>;
}

export function DeleteBill({
  groupId,
  record,
}: {
  groupId: string;
  record: Pick<ExpenseView, "id" | "version" | "title">;
}) {
  const [state, action, pending] = useActionState(deleteExpenseAction, {
    message: "",
  });
  const [version] = useState(record.version);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          Delete bill
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this group bill?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {record.title} and its shares. Recorded repayments remain;
            member balances will be recalculated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action} onInvalidCapture={toastInvalidInput} className="space-y-4">
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="id" value={record.id} />
          <input type="hidden" name="version" value={version} />
          <input type="hidden" name="confirmed" value="yes" />
          <Feedback state={state} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Confirm delete"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
