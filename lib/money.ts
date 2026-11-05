export const CURRENCY = "MMK" as const;
export const CURRENCY_EXPONENT = 0;
export const REPORTING_TIMEZONE = "Asia/Yangon";
export const MAX_AMOUNT_MINOR = BigInt("9000000000000000");

export function parseAmount(value: string): bigint {
  if (!/^(0|[1-9]\d{0,15})$/.test(value)) {
    throw new Error(
      "Enter a whole-kyat amount without decimals or separators.",
    );
  }
  const amount = BigInt(value);
  if (amount <= BigInt(0) || amount > MAX_AMOUNT_MINOR) {
    throw new Error("Amount is outside the supported range.");
  }
  return amount;
}

export function serializeAmount(value: bigint): string {
  return value.toString();
}

export function formatAmount(value: string | bigint): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(BigInt(value));
}
