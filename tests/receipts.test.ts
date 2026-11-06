import "dotenv/config";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import {
  prepareReceiptImage,
  MAX_RECEIPT_BYTES,
} from "../features/receipts/image";
import { ollamaExtractor } from "../features/receipts/provider";
import { reviewSuggestion } from "../features/receipts/schemas";
import { extractReceipt, confirmReceipt } from "../features/receipts/service";
import { loadDashboard } from "../features/dashboard/store";
import { findTransaction } from "../features/transactions/store";

const users: string[] = [];
let categoryId: string;
let image: Buffer;
const raw = () => ({
  merchant: "Sample shop",
  total: "12500",
  date: "2026-11-07",
  currency: "MMK",
  categoryId,
  uncertain: [],
});
const file = (bytes = image, type = "image/png") =>
  new File([new Uint8Array(bytes)], "receipt", { type });

before(async () => {
  image = await sharp({
    create: { width: 32, height: 48, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  for (let index = 0; index < 2; index++) {
    users.push(
      (
        await prisma.user.create({
          data: {
            email: `receipt-${randomUUID()}@example.invalid`,
            name: "Receipt tests",
            passwordHash: "not-a-login-fixture",
          },
        })
      ).id,
    );
  }
  categoryId = (
    await prisma.category.findUniqueOrThrow({ where: { key: "expense-food" } })
  ).id;
});
after(async () => {
  await prisma.transaction.deleteMany({ where: { ownerId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});

test("receipt upload decodes JPG/PNG/WebP and strips metadata; rejects MIME, size, truncation and animations", async () => {
  for (const [format, mime] of [
    ["png", "image/png"],
    ["jpeg", "image/jpeg"],
    ["webp", "image/webp"],
  ] as const) {
    const bytes = await sharp(image).withMetadata().toFormat(format).toBuffer();
    const decoded = await prepareReceiptImage(file(bytes, mime));
    const metadata = await sharp(decoded).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 32);
    assert.equal(metadata.exif, undefined);
  }
  for (const input of [
    null,
    "text",
    file(image, "image/gif"),
    file(image, "image/jpeg"),
    file(Buffer.alloc(0)),
    file(Buffer.alloc(MAX_RECEIPT_BYTES + 1)),
    file(image.subarray(0, 20)),
    file(Buffer.from("not an image")),
  ]) {
    await assert.rejects(prepareReceiptImage(input));
  }
  // Valid signature with a malicious PNG IHDR declaring excessive dimensions.
  const large = Buffer.from(image);
  large.writeUInt32BE(100000, 16);
  await assert.rejects(prepareReceiptImage(file(large)));
  const tooManyPixels = await sharp({
    create: { width: 5000, height: 4001, channels: 3, background: "white" },
  }).png().toBuffer();
  await assert.rejects(prepareReceiptImage(file(tooManyPixels)));
  const animation = await sharp(
    Buffer.concat([Buffer.alloc(12, 255), Buffer.alloc(12, 0)]),
    { raw: { width: 2, height: 4, channels: 3, pageHeight: 2 } },
  )
    .webp({ loop: 0 })
    .toBuffer();
  assert.equal((await sharp(animation).metadata()).pages, 2);
  await assert.rejects(prepareReceiptImage(file(animation, "image/webp")));
});

test("receipt suggestions flag ambiguity, missing/invalid dates, unknown categories and unsupported currencies without inventing values", () => {
  const valid = reviewSuggestion(raw(), [categoryId]);
  assert.deepEqual(valid.uncertain, []);
  const ambiguous = reviewSuggestion(
    { ...raw(), uncertain: ["total", "merchant"] },
    [categoryId],
  );
  assert.equal(ambiguous.total, null);
  assert.equal(ambiguous.merchant, null);
  for (const date of [
    null,
    "2026-02-29",
    "03/04/26",
    "2026-13-07",
    "1899-01-01",
  ]) {
    assert.equal(reviewSuggestion({ ...raw(), date }, [categoryId]).date, null);
  }
  for (const total of [
    null,
    "1.5",
    "0",
    "-3",
    "9000000000000001",
    "1,200",
    "12.00",
    "1e4",
  ]) {
    assert.equal(
      reviewSuggestion({ ...raw(), total }, [categoryId]).total,
      null,
    );
  }
  for (const currency of [null, "USD", "$", "EUR"]) {
    const result = reviewSuggestion({ ...raw(), currency }, [categoryId]);
    assert.equal(result.total, null);
  }
  assert.equal(
    reviewSuggestion({ ...raw(), categoryId: randomUUID() }, [categoryId])
      .categoryId,
    null,
  );
  assert.throws(() =>
    reviewSuggestion({ ...raw(), total: 12500 }, [categoryId]),
  );
  assert.throws(() =>
    reviewSuggestion({ ...raw(), rawOCR: "private" }, [categoryId]),
  );
});

test("Ollama adapter sends schema and pixels with bounded local-only requests and validates mocked JSON", async () => {
  let calls = 0;
  const transport: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(String(url), "http://127.0.0.1:11434/api/chat");
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "gemma3:4b");
    assert.equal(body.stream, false);
    assert.equal(body.format.additionalProperties, false);
    assert.equal(body.messages[1].images[0], image.toString("base64"));
    return Response.json({
      done: true,
      message: { content: JSON.stringify(raw()) },
    });
  };
  assert.deepEqual(
    await ollamaExtractor({}, transport)(image, [
      { id: categoryId, name: "Food" },
    ]),
    raw(),
  );
  for (const OLLAMA_BASE_URL of [
    "https://external.example",
    "http://127.0.0.1:11434@evil.example",
    "file:///private",
    "http://127.0.0.1:11434/path",
  ]) {
    await assert.rejects(
      ollamaExtractor({ OLLAMA_BASE_URL }, transport)(image, []),
    );
  }
  await assert.rejects(
    ollamaExtractor({ OLLAMA_MODEL: "gemma3:cloud" }, transport)(image, []),
  );
  assert.equal(calls, 1);
  for (const response of [
    new Response("upstream failure", { status: 500 }),
    new Response("not JSON"),
    Response.json({ done: true, message: { content: "{}" } }),
    Response.json({ done: false, message: { content: JSON.stringify(raw()) } }),
    new Response("x".repeat(65537)),
  ]) {
    await assert.rejects(ollamaExtractor({}, async () => response)(image, []));
  }
  await assert.rejects(
    ollamaExtractor({}, async () => {
      throw new DOMException("Timeout", "TimeoutError");
    })(image, []),
  );
});

test("mocked extraction authorizes before provider calls and never persists financial data", async () => {
  const baseline = await prisma.transaction.count({
    where: { ownerId: users[0] },
  });
  let calls = 0;
  const mock = async () => {
    calls++;
    return raw();
  };
  await assert.rejects(extractReceipt(null, file(), mock));
  await assert.rejects(extractReceipt(randomUUID(), file(), mock));
  await assert.rejects(
    extractReceipt(users[0], file(image, "image/gif"), mock),
  );
  assert.equal(calls, 0);
  const suggestion = await extractReceipt(users[0], file(), mock);
  assert.equal(suggestion.total, "12500");
  assert.equal(calls, 1);
  await assert.rejects(
    extractReceipt(users[0], file(), async () => {
      throw new Error("Unavailable");
    }),
  );
  assert.equal(
    await prisma.transaction.count({ where: { ownerId: users[0] } }),
    baseline,
  );
  assert.equal(await prisma.receipt.count({ where: { ownerId: users[0] } }), 0);
});

test("explicitly confirmed corrected receipts create one exact owned expense and refresh dashboard totals", async () => {
  const input = {
    merchant: "Corrected shop",
    amount: "18000",
    occurredOn: "2026-11-07",
    currency: "MMK",
    categoryId,
    note: "Reviewed",
    confirmed: "yes",
    submissionKey: randomUUID(),
  };
  for (const invalid of [
    { ...input, confirmed: "no" },
    { ...input, currency: "USD" },
    { ...input, amount: "1.25" },
    { ...input, occurredOn: "2026-02-29" },
    { ...input, ownerId: users[1] },
    { ...input, type: "INCOME" },
  ]) {
    await assert.rejects(confirmReceipt(users[0], invalid));
  }
  await assert.rejects(confirmReceipt(null, input));
  await assert.rejects(confirmReceipt(randomUUID(), input));
  const incomeCategory = (
    await prisma.category.findUniqueOrThrow({ where: { key: "income-salary" } })
  ).id;
  await assert.rejects(
    confirmReceipt(users[0], { ...input, categoryId: incomeCategory }),
  );
  const range = { from: "2026-11-07", to: "2026-11-07" };
  const before = await loadDashboard(users[0], range);
  const [saved, retry] = await Promise.all([
    confirmReceipt(users[0], input),
    confirmReceipt(users[0], input),
  ]);
  assert.equal(saved.id, retry.id);
  assert.equal(saved.type, "EXPENSE");
  assert.equal(saved.amount, "18000");
  assert.equal(saved.merchant, "Corrected shop");
  assert.equal(saved.occurredOn, "2026-11-07");
  assert.equal(await findTransaction(users[1], saved.id), null);
  const after = await loadDashboard(users[0], range);
  assert.equal(BigInt(after.expense) - BigInt(before.expense), BigInt(18000));
  assert.equal(BigInt(after.balance) - BigInt(before.balance), BigInt(-18000));
  assert.equal(
    after.categories.find((category) => category.id === categoryId)?.amount,
    "18000",
  );
  assert.equal((await loadDashboard(users[1], range)).expense, "0");
  await assert.rejects(confirmReceipt(users[0], { ...input, amount: "19000" }));
  assert.equal(
    await prisma.transaction.count({ where: { ownerId: users[0] } }),
    1,
  );
});
