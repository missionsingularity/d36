# Supabase connection check

The app currently uses SQLite for workspace records. This connection check verifies whether a Supabase PostgreSQL URL is present and can answer `SELECT 1`; it does not migrate application records or switch the app's storage to PostgreSQL.

## Check the Vercel connection

1. In Vercel, open the `d36` project and go to **Settings → Environment Variables**.
2. Confirm `POSTGRES_URL` is present for Production (the Supabase Vercel integration may also provide `POSTGRES_PRISMA_URL`).
3. If REST API access is part of the selected integration, confirm `SUPABASE_URL` and a server-side key such as `SUPABASE_SECRET_KEY` are present. Never add a secret key with a `NEXT_PUBLIC_` prefix.
4. Redeploy after changing environment variables.
5. Open `/api/supabase/status`. A 200 response means the PostgreSQL `SELECT 1` check passed. The response contains booleans and safe status text only; it never returns credentials.

Supabase's Vercel Marketplace integration lists the PostgreSQL URL and Supabase API variables it synchronizes: [Supabase on Vercel](https://supabase.com/docs/guides/integrations/vercel-marketplace).

## Local check

Copy the Vercel variables into `.env.local` locally without committing that file, then start the app and request `http://localhost:3000/api/supabase/status`. Do not paste connection strings or keys into chat or source files.

## Remaining database migration

A passing connection check is not the same as the application using Supabase. The current backend calls synchronous `better-sqlite3` queries throughout its services and API routes. A safe PostgreSQL migration must replace those operations with a PostgreSQL-compatible data layer, add versioned migrations for the current SQLite schema, preserve existing IDs/approvals/audit history, and run the existing behavior/security tests against the new store. Until that work is completed and verified, Vercel's SQLite data remains temporary and must not be treated as durable shared storage.
