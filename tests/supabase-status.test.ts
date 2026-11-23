import assert from "node:assert/strict";
import { test } from "node:test";
import { checkSupabasePostgres } from "../lib/enterprise/supabase-status";

test("reports missing Supabase PostgreSQL configuration without exposing secrets", async () => {
  let connected = false;
  const result = await checkSupabasePostgres(
    { SUPABASE_URL: "https://project.supabase.co" },
    async () => {
      connected = true;
    },
  );

  assert.equal(result.configured, false);
  assert.equal(result.connected, false);
  assert.equal(connected, false);
  assert.equal(JSON.stringify(result).includes("project.supabase.co"), false);
});

test("runs a PostgreSQL probe and returns only safe connection metadata", async () => {
  const secret =
    "postgresql://private-user:private-password@db.invalid/postgres";
  let receivedUrl = "";
  const result = await checkSupabasePostgres(
    {
      POSTGRES_URL: secret,
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_private",
    },
    async (url) => {
      receivedUrl = url;
    },
  );

  assert.equal(receivedUrl, secret);
  assert.equal(result.configured, true);
  assert.equal(result.connected, true);
  assert.equal(result.connectionVariable, "POSTGRES_URL");
  assert.equal(result.supabaseApiConfigured, true);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(JSON.stringify(result).includes("sb_secret_private"), false);
});

test("sanitizes provider connection failures", async () => {
  const result = await checkSupabasePostgres(
    { POSTGRES_PRISMA_URL: "postgresql://secret-value" },
    async () => {
      throw new Error("failed to connect postgresql://secret-value");
    },
  );

  assert.equal(result.configured, true);
  assert.equal(result.connected, false);
  assert.equal(result.connectionVariable, "POSTGRES_PRISMA_URL");
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});
