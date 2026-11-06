import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { z } from "zod";
import sharp from "sharp";
import { randomBytes, randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { prisma } from "../../lib/prisma";
import { register } from "../../features/auth/service";
import { deleteTransaction } from "../../features/transactions/store";

test(
  "Authenticated HTTP lifecycle: sessions, transaction forms, ownership and logout",
  { timeout: 90000 },
  async () => {
    const port = 3197;
    const base = `http://127.0.0.1:${port}`;
    const canonical = `https://localhost:${port}`;
    const secret = randomBytes(32).toString("base64url");
    const email = `http-auth-${randomUUID()}@example.invalid`;
    const password = `Test-only-${randomUUID()}`;
    const registration = await register({
      email,
      password,
      name: "HTTP auth test",
    });
    assert.equal(registration.ok, true);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const other = await prisma.user.create({
      data: {
        email: `http-other-${randomUUID()}@example.invalid`,
        name: "Other account",
        passwordHash: "not-a-login-fixture",
      },
    });
    const receiptCategory = await prisma.category.findUniqueOrThrow({
      where: { key: "expense-food" },
    });
    let extractionCalls = 0;
    const ollama = createServer(async (req, res) => {
      if (req.method !== "POST" || req.url !== "/api/chat") {
        res.writeHead(404).end();
        return;
      }
      for await (const chunk of req) {
        void chunk;
      }
      extractionCalls++;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          done: true,
          message: {
            content: JSON.stringify({
              merchant: "Mock receipt shop",
              total: "12500",
              date: "2026-11-07",
              currency: "MMK",
              categoryId: receiptCategory.id,
              uncertain: [],
            }),
          },
        }),
      );
    });
    ollama.listen(0, "127.0.0.1");
    await once(ollama, "listening");
    const ollamaAddress = ollama.address();
    assert.ok(ollamaAddress && typeof ollamaAddress !== "string");
    const server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(port),
      ],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          AUTH_URL: canonical,
          AUTH_SECRET: secret,
          OLLAMA_BASE_URL: `http://127.0.0.1:${ollamaAddress.port}`,
          OLLAMA_MODEL: "gemma3:4b",
        },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );
    // Keep framework output private because errors may include request inputs.
    server.stdout.resume();
    let serverErrors = "";
    server.stderr.on("data", (chunk: Buffer) => {
      serverErrors = (serverErrors + chunk.toString()).slice(-12000);
    });
    const jar = new Map<string, string>();
    async function request(
      path: string,
      init: RequestInit = {},
      cookies = jar,
    ) {
      const response = await fetch(base + path, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        headers: {
          host: `localhost:${port}`,
          "x-forwarded-host": `localhost:${port}`,
          "x-forwarded-proto": "https",
          cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          ...init.headers,
        },
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";", 1)[0];
        const split = pair.indexOf("=");
        const key = pair.slice(0, split);
        const value = pair.slice(split + 1);
        if (value) cookies.set(key, value);
        else cookies.delete(key);
      }
      return response;
    }
    async function post(
      path: string,
      data: Record<string, string>,
      cookies = jar,
    ) {
      return request(
        path,
        {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
            origin: canonical,
          },
          body: new URLSearchParams(data),
        },
        cookies,
      );
    }
    async function csrf() {
      const response = await request("/api/auth/csrf");
      assert.equal(response.status, 200);
      const data: { csrfToken: string } = await response.json();
      return data.csrfToken;
    }
    function transactionForm(html: string, values: Record<string, string>) {
      const form = new FormData();
      const decode = (value: string) =>
        value
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
      for (const input of html.matchAll(/<input\b[^>]*>/g)) {
        if (!/type="hidden"/.test(input[0])) continue;
        const name = input[0].match(/name="([^"]+)"/)?.[1];
        const value = input[0].match(/value="([^"]*)"/)?.[1] ?? "";
        if (name) form.append(decode(name), decode(value));
      }
      assert.ok(
        [...form.keys()].some((key) => key.startsWith("$ACTION_")),
        "Server action form metadata is rendered",
      );
      for (const [key, value] of Object.entries(values)) form.set(key, value);
      return form;
    }
    try {
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        if (server.exitCode !== null)
          throw new Error("Test server exited before becoming ready.");
        try {
          const response = await fetch(base + "/login", {
            signal: AbortSignal.timeout(1000),
          });
          if (response.ok) {
            ready = true;
            break;
          }
        } catch {
          /* startup */
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      assert.equal(ready, true, "Production test server starts");
      const anonymous = await request("/app");
      const anonymousBody = await anonymous.text();
      assert.ok(
        anonymous.headers.get("location")?.includes("/login") ||
          (anonymousBody.includes("NEXT_REDIRECT") &&
            anonymousBody.includes("/login")),
      );
      assert.equal(anonymousBody.includes(user.email), false);
      const anonymousDashboard = await request("/dashboard");
      const anonymousDashboardBody = await anonymousDashboard.text();
      assert.ok(
        anonymousDashboard.headers.get("location")?.includes("/login") ||
          anonymousDashboardBody.includes("NEXT_REDIRECT"),
      );
      assert.equal(anonymousDashboardBody.includes("data-summary="), false);
      const noCsrf = new Map<string, string>();
      await post("/api/auth/callback/credentials", { email, password }, noCsrf);
      assert.equal(noCsrf.has("__Secure-authjs.session-token"), false);
      const token = await csrf();
      await post("/api/auth/callback/credentials", {
        email,
        password: "Wrong-password-here",
        csrfToken: token,
      });
      assert.equal(jar.has("__Secure-authjs.session-token"), false);
      const login = await post("/api/auth/callback/credentials", {
        email,
        password,
        csrfToken: token,
        callbackUrl: "https://evil.example/",
      });
      const cookie = login.headers
        .getSetCookie()
        .find((value) => value.startsWith("__Secure-authjs.session-token="));
      assert.ok(cookie, "Login issues a session cookie");
      for (const flag of [
        /;\s*HttpOnly(?:;|$)/i,
        /;\s*Secure(?:;|$)/i,
        /;\s*SameSite=Lax(?:;|$)/i,
        /;\s*Path=\/(?:;|$)/i,
      ]) {
        assert.ok(flag.test(cookie), "Required cookie attribute is present");
      }
      const expires = cookie.match(/;\s*Expires=([^;]+)/i)?.[1];
      assert.ok(expires);
      const lifetime = new Date(expires).getTime() - Date.now();
      assert.ok(
        lifetime > 7 * 60 * 60 * 1000 && lifetime <= 8 * 60 * 60 * 1000,
      );
      assert.equal(
        jar.get("__Secure-authjs.session-token")?.split(".").length,
        5,
        "Session is an encrypted JWT",
      );
      const destination: { url: string } = await login.json();
      assert.equal(new URL(destination.url).origin, canonical);
      assert.equal(new URL(destination.url).pathname, "/dashboard");
      const sessionResponse = await request("/api/auth/session");
      const session: { user: { id: string; passwordHash?: string } } =
        await sessionResponse.json();
      assert.equal(session.user.id, user.id);
      assert.equal(session.user.passwordHash, undefined);
      assert.ok((await (await request("/app")).text()).includes(user.email));
      const dashboardRange = "/dashboard?from=2026-11-01&to=2026-11-30";
      const emptyDashboard = await (await request(dashboardRange)).text();
      assert.ok(
        emptyDashboard.includes('data-summary="expenses" data-amount="0"'),
      );
      assert.ok(emptyDashboard.includes("No expenses in this range"));
      assert.ok(
        (await (await request("/transactions")).text()).includes(
          "Your ledger starts here",
        ),
      );
      const categories = await prisma.category.findMany();
      const categoryId = categories.find(
        (category) => category.key === "expense-food",
      )!.id;
      const newPage = await (await request("/transactions/new")).text();
      const values = {
        type: "EXPENSE",
        amount: "12500",
        categoryId,
        occurredOn: "2026-11-06",
        merchant: "HTTP test market",
        note: "Created through the form",
      };
      const createForm = transactionForm(newPage, values);
      const anonymousWrite = await request(
        "/transactions/new",
        { method: "POST", headers: { origin: canonical }, body: createForm },
        new Map(),
      );
      assert.equal(anonymousWrite.status, 303);
      assert.ok(anonymousWrite.headers.get("location")?.includes("/login"));
      const crossOrigin = await request("/transactions/new", {
        method: "POST",
        headers: { origin: "https://evil.example" },
        body: createForm,
      });
      assert.equal(
        crossOrigin.status,
        500,
        "Next.js rejects an untrusted action origin",
      );
      assert.equal(
        await prisma.transaction.count({ where: { ownerId: user.id } }),
        0,
      );
      const created = await request("/transactions/new", {
        method: "POST",
        headers: { origin: canonical },
        body: createForm,
      });
      assert.equal(created.status, 303, "Create action redirects after saving");
      const detailPath = new URL(created.headers.get("location")!, canonical)
        .pathname;
      const transactionId = detailPath.split("/").at(-1)!;
      const populatedDashboard = await (await request(dashboardRange)).text();
      assert.ok(
        populatedDashboard.includes(
          'data-summary="expenses" data-amount="12500"',
        ),
      );
      assert.ok(
        populatedDashboard.includes(
          'data-summary="balance" data-amount="-12500"',
        ),
      );
      assert.ok(populatedDashboard.includes("HTTP test market"));
      assert.ok(populatedDashboard.includes("Monthly expense trend"));
      assert.ok(populatedDashboard.includes("View exact monthly amounts"));
      assert.equal(
        (
          await prisma.transaction.findUniqueOrThrow({
            where: { id: transactionId },
          })
        ).amountMinor,
        BigInt(12500),
      );
      assert.ok(
        (await (await request(detailPath)).text()).includes("HTTP test market"),
      );
      await request("/transactions/new", {
        method: "POST",
        headers: { origin: canonical },
        body: createForm,
      });
      assert.equal(
        await prisma.transaction.count({ where: { ownerId: user.id } }),
        1,
        "HTTP create retries do not duplicate records",
      );
      assert.ok(
        (await (await request("/transactions?type=INCOME")).text()).includes(
          "No matching transactions",
        ),
      );
      assert.ok(
        (
          await (
            await request(
              "/transactions?from=2026-11-06&to=2026-11-06&type=EXPENSE",
            )
          ).text()
        ).includes("HTTP test market"),
      );
      const editPage = await (await request(`${detailPath}/edit`)).text();
      const otherJar = new Map<string, string>([
        [
          "__Secure-authjs.session-token",
          await encode({
            token: { sub: other.id },
            secret,
            salt: "__Secure-authjs.session-token",
          }),
        ],
      ]);
      const otherDashboard = await (
        await request(dashboardRange, {}, otherJar)
      ).text();
      assert.ok(
        otherDashboard.includes('data-summary="expenses" data-amount="0"'),
      );
      assert.equal(otherDashboard.includes("HTTP test market"), false);
      const categoryDashboard = await (
        await request(`${dashboardRange}&categoryId=${categoryId}`)
      ).text();
      assert.ok(categoryDashboard.includes('aria-pressed="true"'));
      assert.ok(
        categoryDashboard.includes('data-summary="income" data-amount="0"'),
      );
      assert.ok(
        categoryDashboard.includes(
          'data-summary="expenses" data-amount="12500"',
        ),
      );
      const badRange = await (
        await request("/dashboard?from=2026-12-01&to=2026-11-01")
      ).text();
      assert.ok(badRange.includes("Dashboard filters need attention"));
      const hiddenDetail = await (
        await request(detailPath, {}, otherJar)
      ).text();
      assert.ok(hiddenDetail.includes("Transaction not found"));
      assert.equal(hiddenDetail.includes("HTTP test market"), false);
      const unauthorized = await request(
        `${detailPath}/edit`,
        {
          method: "POST",
          headers: { origin: canonical },
          body: transactionForm(editPage, { ...values, amount: "99999" }),
        },
        otherJar,
      );
      assert.ok(
        (await unauthorized.text()).includes(
          "Transaction unavailable or changed",
        ),
      );
      assert.equal(
        (
          await prisma.transaction.findUniqueOrThrow({
            where: { id: transactionId },
          })
        ).amountMinor,
        BigInt(12500),
      );
      const updated = await request(`${detailPath}/edit`, {
        method: "POST",
        headers: { origin: canonical },
        body: transactionForm(editPage, {
          ...values,
          amount: "18000",
          note: "Updated through the form",
        }),
      });
      assert.equal(updated.status, 303);
      assert.ok(
        (await (await request(dashboardRange)).text()).includes(
          'data-summary="expenses" data-amount="18000"',
        ),
      );
      assert.ok(
        (await (await request(detailPath)).text()).includes(
          "Updated through the form",
        ),
      );
      await deleteTransaction(user.id, {
        id: transactionId,
        version: 2,
        confirmed: "yes",
      });
      assert.ok(
        (await (await request(dashboardRange)).text()).includes(
          'data-summary="expenses" data-amount="0"',
        ),
      );
      const receiptPage = await (await request("/receipts/new")).text();
      assert.ok(receiptPage.includes("Receipt to expense"));
      const anonymousReceiptPage = await (
        await request("/receipts/new", {}, new Map())
      ).text();
      assert.equal(anonymousReceiptPage.includes("Receipt to expense"), false);
      const receiptBytes = await sharp({
        create: { width: 32, height: 48, channels: 3, background: "white" },
      })
        .png()
        .toBuffer();
      const upload = transactionForm(receiptPage, {});
      upload.set(
        "image",
        new File([new Uint8Array(receiptBytes)], "test.png", {
          type: "image/png",
        }),
      );
      const deniedUpload = await request(
        "/receipts/new",
        { method: "POST", headers: { origin: canonical }, body: upload },
        new Map(),
      );
      assert.equal(deniedUpload.status, 303);
      assert.equal(extractionCalls, 0);
      const forgedOrigin = await request("/receipts/new", {
        method: "POST",
        headers: { origin: "https://evil.example" },
        body: upload,
      });
      assert.equal(forgedOrigin.status, 500);
      assert.equal(extractionCalls, 0);
      const extracted = await request("/receipts/new", {
        method: "POST",
        headers: { origin: canonical },
        body: upload,
      });
      const reviewHtml = await extracted.text();
      assert.equal(extracted.status, 200);
      assert.equal(extractionCalls, 1);
      assert.ok(reviewHtml.includes("Mock receipt shop"));
      assert.equal(
        await prisma.transaction.count({ where: { ownerId: user.id } }),
        0,
        "Extraction does not save",
      );
      // Cache Components delivers the extracted review through hydration form state.
      const reviewKey = reviewHtml
        .replace(/\\"/g, '"')
        .match(/"reviewKey":"([a-f0-9-]+)"/)?.[1];
      assert.ok(
        reviewKey,
        "Extraction returns a stable confirmation retry key",
      );
      // shortcut: pinned Next.js Flight transport; revisit on framework upgrades.
      const {
        encodeReply,
      }: { encodeReply: (args: unknown[]) => Promise<FormData | string> } =
        createRequire(import.meta.url)(
          "next/dist/compiled/react-server-dom-turbopack/client.node",
        );
      const manifest = z
        .object({
          node: z.record(
            z.string(),
            z.object({ exportedName: z.string().optional() }),
          ),
        })
        .parse(
          JSON.parse(
            readFileSync(
              new URL(
                "../../.next/server/server-reference-manifest.json",
                import.meta.url,
              ),
              "utf8",
            ),
          ),
        );
      const confirmActionId = Object.entries(manifest.node).find(
        ([, entry]) => entry.exportedName === "confirmReceiptAction",
      )?.[0];
      assert.ok(confirmActionId);
      async function receiptConfirmation(
        fields: Record<string, string>,
        cookies = jar,
      ) {
        const form = new FormData();
        for (const [name, value] of Object.entries(fields))
          form.set(name, value);
        return request(
          "/receipts/new",
          {
            method: "POST",
            headers: { origin: canonical, "Next-Action": confirmActionId! },
            body: await encodeReply([{ message: "" }, form]),
          },
          cookies,
        );
      }
      const confirmedValues = {
        amount: "21000",
        merchant: "Corrected receipt shop",
        occurredOn: "2026-11-07",
        currency: "MMK",
        categoryId,
        note: "Reviewed HTTP receipt",
        confirmed: "yes",
        submissionKey: reviewKey,
      };
      const deniedConfirmation = await receiptConfirmation(
        confirmedValues,
        new Map(),
      );
      assert.ok(
        deniedConfirmation.headers
          .get("x-action-redirect")
          ?.startsWith("/login;"),
      );
      const unconfirmed = await receiptConfirmation({
        ...confirmedValues,
        confirmed: "no",
      });
      assert.equal(unconfirmed.status, 200);
      assert.equal(
        await prisma.transaction.count({ where: { ownerId: user.id } }),
        0,
      );
      const confirmedReceipt = await receiptConfirmation(confirmedValues);
      assert.ok(
        confirmedReceipt.headers
          .get("x-action-redirect")
          ?.startsWith("/transactions/"),
      );
      const confirmedId = new URL(
        confirmedReceipt.headers.get("x-action-redirect")!.split(";")[0],
        canonical,
      ).pathname
        .split("/")
        .at(-1)!;
      const confirmedRecord = await prisma.transaction.findUniqueOrThrow({
        where: { id: confirmedId },
      });
      assert.equal(confirmedRecord.ownerId, user.id);
      assert.equal(confirmedRecord.amountMinor, BigInt(21000));
      assert.equal(confirmedRecord.type, "EXPENSE");
      const receiptDashboard = await (await request(dashboardRange)).text();
      assert.ok(
        receiptDashboard.includes(
          'data-summary="expenses" data-amount="21000"',
        ),
      );
      assert.ok(receiptDashboard.includes("Corrected receipt shop"));
      assert.equal(
        (
          await (
            await request("/transactions/" + confirmedId, {}, otherJar)
          ).text()
        ).includes("Corrected receipt shop"),
        false,
      );
      assert.ok(
        (await (await request(dashboardRange, {}, otherJar)).text()).includes(
          'data-summary="expenses" data-amount="0"',
        ),
      );
      await receiptConfirmation(confirmedValues);
      assert.equal(
        await prisma.transaction.count({ where: { ownerId: user.id } }),
        1,
      );
      await deleteTransaction(user.id, {
        id: confirmedId,
        version: 1,
        confirmed: "yes",
      });
      const tampered = new Map(jar);
      tampered.set("__Secure-authjs.session-token", "tampered");
      assert.equal(
        await (await request("/api/auth/session", {}, tampered)).json(),
        null,
      );
      const expired = new Map(jar);
      expired.set(
        "__Secure-authjs.session-token",
        await encode({
          token: { sub: user.id },
          secret,
          salt: "__Secure-authjs.session-token",
          maxAge: -60,
        }),
      );
      assert.equal(
        await (await request("/api/auth/session", {}, expired)).json(),
        null,
      );
      const logout = await post("/api/auth/signout", {
        csrfToken: await csrf(),
        callbackUrl: "/login",
      });
      assert.ok(
        logout.headers
          .getSetCookie()
          .some(
            (value) =>
              value.startsWith("__Secure-authjs.session-token=") &&
              value.includes("Max-Age=0"),
          ),
      );
      assert.equal(await (await request("/api/auth/session")).json(), null);
      await post("/api/auth/callback/credentials", {
        email,
        password,
        csrfToken: await csrf(),
      });
      assert.equal(jar.has("__Secure-authjs.session-token"), true);
      await prisma.user.delete({ where: { id: user.id } });
      assert.equal(
        await (await request("/api/auth/session")).json(),
        null,
        "Deleted users lose access",
      );
    } catch (error) {
      const messages = serverErrors
        .split("\n")
        .filter((line) =>
          /\b(?:Error|TypeError):|does not match.*origin/.test(line),
        );
      for (let line of messages) {
        for (const value of [
          password,
          secret,
          process.env.DATABASE_URL,
          process.env.DIRECT_URL,
          process.env.AUTH_SECRET,
        ]) {
          if (value) line = line.split(value).join("[REDACTED]");
        }
        console.error(
          line.replace(/postgres(?:ql)?:\/\/[^\s"'`]+/g, "[REDACTED]"),
        );
      }
      throw error;
    } finally {
      ollama.closeAllConnections();
      await new Promise<void>((resolve) => ollama.close(() => resolve()));
      if (server.exitCode === null) {
        const exit = once(server, "exit");
        server.kill();
        await exit;
      }
      await prisma.transaction.deleteMany({
        where: { ownerId: { in: [user.id, other.id] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [user.id, other.id] } },
      });
      await prisma.$disconnect();
    }
  },
);
