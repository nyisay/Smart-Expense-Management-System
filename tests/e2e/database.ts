import "dotenv/config";
import { Pool } from "pg";

export function assertLocalTestDatabase() {
  let url: URL;
  try {
    url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid");
  } catch {
    throw new Error(
      "Missing or invalid test DATABASE_URL; values are not displayed.",
    );
  }
  if (
    !/^(?:postgres|postgresql):$/.test(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/^\/(?:smart_expense_db|[a-z0-9_]+_test)$/.test(url.pathname)
  ) {
    throw new Error(
      "Playwright requires a local development/test PostgreSQL database. Connection values are not displayed.",
    );
  }
}

export async function removeTestAccount(email: string) {
  assertLocalTestDatabase();
  if (!/^e2e-[a-f0-9-]+@example\.invalid$/.test(email))
    throw new Error("Refusing non-fixture account cleanup.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await db.query<{ id: string }>(
      'SELECT "id" FROM "User" WHERE email = $1',
      [email],
    );
    const id = result.rows[0]?.id;
    if (id) {
      await db.query(
        'DELETE FROM "Settlement" WHERE "groupId" IN (SELECT id FROM "Group" WHERE "ownerId" = $1)',
        [id],
      );
      await db.query(
        'DELETE FROM "GroupExpense" WHERE "groupId" IN (SELECT id FROM "Group" WHERE "ownerId" = $1)',
        [id],
      );
      await db.query(
        'DELETE FROM "GroupMember" WHERE "groupId" IN (SELECT id FROM "Group" WHERE "ownerId" = $1)',
        [id],
      );
      await db.query('DELETE FROM "Group" WHERE "ownerId" = $1', [id]);
      await db.query('DELETE FROM "Transaction" WHERE "ownerId" = $1', [id]);
      await db.query('DELETE FROM "Receipt" WHERE "ownerId" = $1', [id]);
      await db.query('DELETE FROM "User" WHERE id = $1', [id]);
    }
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
    await pool.end();
  }
}
