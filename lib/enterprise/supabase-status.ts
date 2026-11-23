import postgres from "postgres";

type Environment = Record<string, string | undefined>;
type Connector = (url: string) => Promise<void>;

async function queryPostgres(url: string) {
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    connect_timeout: 5,
    idle_timeout: 1,
  });
  try {
    await sql`select 1 as connected`;
  } finally {
    await sql.end({ timeout: 1 });
  }
}

export async function checkSupabasePostgres(
  env: Environment = process.env,
  connect: Connector = queryPostgres,
) {
  const databaseUrl = env.POSTGRES_URL || env.POSTGRES_PRISMA_URL;
  const connectionVariable = env.POSTGRES_URL
    ? "POSTGRES_URL"
    : env.POSTGRES_PRISMA_URL
      ? "POSTGRES_PRISMA_URL"
      : null;
  const supabaseApiConfigured = Boolean(
    (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL) &&
    (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY),
  );

  if (!databaseUrl)
    return {
      configured: false,
      connected: false,
      connectionVariable,
      supabaseApiConfigured,
      message:
        "POSTGRES_URL is not available. Connect Supabase to this Vercel project and redeploy.",
    };

  try {
    await connect(databaseUrl);
    return {
      configured: true,
      connected: true,
      connectionVariable,
      supabaseApiConfigured,
      message: "Supabase PostgreSQL responded to a test query.",
    };
  } catch {
    return {
      configured: true,
      connected: false,
      connectionVariable,
      supabaseApiConfigured,
      message:
        "Supabase PostgreSQL could not be reached. Check the Vercel connection URL and database availability.",
    };
  }
}
