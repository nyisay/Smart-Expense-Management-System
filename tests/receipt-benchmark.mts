// Opt-in local inference only; generated receipts contain no real personal information.
import "dotenv/config";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import { ollamaExtractor } from "../features/receipts/provider";
import { prepareReceiptImage } from "../features/receipts/image";
import { reviewSuggestion } from "../features/receipts/schemas";
import { assertLocalTestDatabase } from "./e2e/database";

assertLocalTestDatabase();
const categories = await prisma.category.findMany({
  where: { type: "EXPENSE" },
  select: { id: true, name: true },
});
await prisma.$disconnect();
const cases = [
  {
    name: "simple-total",
    lines: [
      "Merchant: Synthetic Restaurant",
      "Date: 2026-11-08",
      "Currency: MMK",
      "Lunch 1500",
      "FINAL TOTAL: MMK 1500",
    ],
    merchant: "Synthetic Restaurant",
    total: "1500",
  },
  {
    name: "subtotal-cash-change",
    lines: [
      "Merchant: Synthetic Restaurant",
      "Date: 2026-11-08",
      "Currency: MMK",
      "Meal 2500",
      "Subtotal 2500",
      "Tax 500",
      "FINAL TOTAL: MMK 3000",
      "Cash tendered 5000",
      "Change 2000",
    ],
    merchant: "Synthetic Restaurant",
    total: "3000",
  },
];
for (const fixture of cases) {
  const started = performance.now();
  try {
    const lines = ["SYNTHETIC TEST RECEIPT", ...fixture.lines];
    const svg = `<svg width="800" height="700" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><g fill="black" font-size="28" font-family="sans-serif">${lines.map((line, index) => `<text x="30" y="${55 + index * 55}">${line}</text>`).join("")}</g></svg>`;
    const image = await sharp(Buffer.from(svg)).png().toBuffer();
    const prepared = await prepareReceiptImage(
      new File([new Uint8Array(image)], "synthetic.png", { type: "image/png" }),
    );
    const raw = await ollamaExtractor({
      OLLAMA_BASE_URL: "http://127.0.0.1:11434",
      OLLAMA_MODEL: "gemma3:4b",
    })(prepared, categories);
    const suggestion = reviewSuggestion(
      raw,
      categories.map((category) => category.id),
    );
    const fields = {
      merchant: suggestion.merchant === fixture.merchant,
      total: suggestion.total === fixture.total,
      date: suggestion.date === "2026-11-08",
      currency: suggestion.currency === "MMK",
      category:
        suggestion.categoryId ===
        categories.find((category) => category.name === "Food")?.id,
    };
    console.log(
      JSON.stringify({
        fixture: fixture.name,
        model: "gemma3:4b",
        elapsedMs: Math.round(performance.now() - started),
        matches: fields,
      }),
    );
    if (!Object.values(fields).every(Boolean)) process.exitCode = 1;
  } catch {
    console.log(
      JSON.stringify({
        fixture: fixture.name,
        model: "gemma3:4b",
        elapsedMs: Math.round(performance.now() - started),
        status: "provider-failed-or-invalid-output",
      }),
    );
    process.exitCode = 1;
  }
}
