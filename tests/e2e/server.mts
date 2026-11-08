import "dotenv/config";
import { createServer as httpServer, request as httpRequest } from "node:http";
import { createServer as httpsServer } from "node:https";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { generate } from "selfsigned";
import { prisma } from "../../lib/prisma";
import { assertLocalTestDatabase } from "./database";

assertLocalTestDatabase();
const category = await prisma.category.findUniqueOrThrow({
  where: { key: "expense-food" },
  select: { id: true },
});
await prisma.$disconnect();
let mode = "normal";
const mock = httpServer(async (req, res) => {
  if (req.url === "/scenario" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 100) {
        res.writeHead(413).end();
        return;
      }
    }
    if (!["normal", "ambiguous", "failure"].includes(body)) {
      res.writeHead(400).end();
      return;
    }
    mode = body;
    res.end("ok");
    return;
  }
  if (req.url !== "/api/chat" || req.method !== "POST") {
    res.writeHead(404).end();
    return;
  }
  // Consume and discard synthetic image bytes; never retain or log the request.
  for await (const chunk of req) {
    void chunk;
  }
  if (mode === "failure") {
    res.writeHead(503).end();
    return;
  }
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      done: true,
      message: {
        content: JSON.stringify({
          merchant: "Synthetic receipt shop",
          total: mode === "ambiguous" ? null : "12,500.00",
          date: mode === "ambiguous" ? "2026-02-29" : "2026-11-08",
          currency: "Ks",
          categoryId: category.id,
          uncertain: mode === "ambiguous" ? ["total", "date"] : [],
        }),
      },
    }),
  );
});
mock.listen(3198, "127.0.0.1");
await once(mock, "listening");

const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3195",
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      AUTH_URL: "https://127.0.0.1:3196",
      AUTH_SECRET: randomBytes(32).toString("base64url"),
      OLLAMA_BASE_URL: "http://127.0.0.1:3198",
      OLLAMA_MODEL: "mvp-e2e-mock",
    },
    stdio: "ignore",
    windowsHide: true,
  },
);
let ready = false;
for (let attempt = 0; attempt < 100; attempt++) {
  if (app.exitCode !== null)
    throw new Error("Isolated Next.js test server exited during startup.");
  try {
    ready = (await fetch("http://127.0.0.1:3195/login")).ok;
    if (ready) break;
  } catch {
    /* startup */
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!ready) throw new Error("Isolated Next.js test server did not start.");
const certificate = await generate(
  [{ name: "commonName", value: "127.0.0.1" }],
  {
    algorithm: "sha256",
    keySize: 2048,
    extensions: [
      { name: "subjectAltName", altNames: [{ type: 7, ip: "127.0.0.1" }] },
    ],
  },
);
const proxy = httpsServer(
  { key: certificate.private, cert: certificate.cert },
  (req, res) => {
    const upstream = httpRequest(
      {
        hostname: "127.0.0.1",
        port: 3195,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: "127.0.0.1:3196",
          "x-forwarded-host": "127.0.0.1:3196",
          "x-forwarded-proto": "https",
        },
      },
      (reply) => {
        res.writeHead(reply.statusCode ?? 502, reply.headers);
        reply.pipe(res);
      },
    );
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  },
);
proxy.listen(3196, "127.0.0.1");
function stop() {
  proxy.closeAllConnections();
  proxy.close();
  mock.closeAllConnections();
  mock.close();
  app.kill();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
app.on("exit", () => {
  proxy.close();
  mock.close();
});
