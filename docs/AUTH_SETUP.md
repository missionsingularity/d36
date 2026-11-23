# BrahmaGPT login and first administrator

## Required Vercel environment variables

Keep these variables server-side. Do not use a `NEXT_PUBLIC_` prefix for the secret or database URL.

- `POSTGRES_URL` (already confirmed connected in the deployed project)
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (used only by the server to create the first Auth user)
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` (used server-side for password login, refresh, and user verification)
- `BRAHMA_FIRST_ADMIN_SETUP_TOKEN` (a unique random value, at least 32 characters)
- `BRAHMA_SESSION_ENCRYPTION_KEY` (32 random bytes encoded as Base64; encrypts Auth tokens in PostgreSQL)

Generate the setup token with `openssl rand -base64 48` and the encryption key with `openssl rand -base64 32`. Add both to the Vercel project, then redeploy. Keep both server-only; do not commit or paste them into chat.

## Create the first Admin

1. Open the deployment and choose **Set up the first administrator**.
2. Enter the one-time setup code, a name, email, and a strong password of at least 12 characters.
3. Sign in with that email and password.
4. The setup form closes after the first administrator is created. A database lock and unique setup row prevent a second first-admin account.

The account is a demo administrator for the sample workspace. It can use **Switch Demo Role** in the profile menu to test Admin, Manager, and Employee permissions. Each selection is stored per browser session; a separate browser session stays independent.

## Session and role storage

Supabase Auth verifies passwords. The browser receives only an opaque, HttpOnly, Secure-in-production session cookie. Its hash, encrypted Auth access/refresh tokens, effective demo role, and profile are stored in PostgreSQL. Access tokens refresh through Supabase Auth; logout deletes the server-side session. Auth tables have row-level security enabled and direct `anon`/`authenticated` table grants revoked.

The first-admin account currently signs into the isolated demo profile (`demo-default`), which maps the three roles to sample users/records already present in this project. This does not provision real organization employees. Workspace business records still use the existing SQLite service layer; on Vercel that layer is temporary `/tmp` storage. Login profiles/sessions persist in Supabase, but task/document/approval writes do not yet have durable cross-instance PostgreSQL storage. Do not use this demo login for live organizational data until the business-data migration and tenant-level authorization are completed.

## Troubleshooting

- If the login page says the publishable key is missing, add `SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_ANON_KEY`) to Vercel and redeploy.
- If the first-admin link is missing, check `BRAHMA_FIRST_ADMIN_SETUP_TOKEN` and that the setup has not already completed.
- If the setup code has been exposed, replace it in Vercel before using the setup page.
- The app never prints passwords, setup codes, API keys, or tokens in responses or logs.
