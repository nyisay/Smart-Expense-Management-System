import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { getServerEnv } from "../lib/env";
import { assertLocalTestDatabase } from "./e2e/database";

test("server configuration enforces a canonical origin and rejects unsafe production settings without exposing values", () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://example.invalid/test",
      AUTH_SECRET: randomBytes(32).toString("hex"),
      AUTH_URL: "http://localhost:3000",
    });
    assert.equal(getServerEnv().AUTH_URL, "http://localhost:3000");
    for (const url of [
      "http://remote.invalid",
      "https://example.invalid/path",
      "https://user:placeholder@example.invalid",
      "https://example.invalid?query=1",
      "https://example.invalid#fragment",
    ]) {
      process.env.AUTH_URL = url;
      assert.throws(
        () => getServerEnv(),
        (error: unknown) =>
          error instanceof Error &&
          error.message.includes("AUTH_URL") &&
          !error.message.includes(url),
      );
    }
    Object.assign(process.env, {
      NODE_ENV: "production",
      AUTH_URL: "http://localhost:3000",
    });
    assert.throws(() => getServerEnv(), /AUTH_URL/);
    process.env.AUTH_URL = "https://example.invalid";
    assert.equal(getServerEnv().AUTH_URL, "https://example.invalid");
    process.env.AUTH_SECRET = "REPLACE_PLACEHOLDER";
    assert.throws(() => getServerEnv(), /AUTH_SECRET/);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in original)) delete process.env[key];
    Object.assign(process.env, original);
  }
});

test("browser test database guard rejects remote/production targets before any writes", () => {
  const original = process.env.DATABASE_URL;
  try {
    for (const url of [
      "postgresql://placeholder@remote.invalid/smart_expense_db",
      "postgresql://placeholder@localhost/production",
      "https://localhost/smart_expense_db",
      "invalid",
    ]) {
      process.env.DATABASE_URL = url;
      assert.throws(() => assertLocalTestDatabase());
    }
    for (const url of [
      "postgresql://placeholder@localhost/smart_expense_db",
      "postgresql://placeholder@127.0.0.1/mvp_test",
    ]) {
      process.env.DATABASE_URL = url;
      assert.doesNotThrow(() => assertLocalTestDatabase());
    }
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
});
