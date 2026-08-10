# Deploy to Vercel + Supabase

This repo is a monorepo with three deployable apps:

- Portfolio website: repository root, Vite build output `dist`
- CMS admin: `cms-admin`, Next.js
- API: `backend-api`, NestJS on Vercel Serverless Functions

## 1. Create Supabase database

1. Create a Supabase project.
2. Open SQL Editor and create a dedicated Prisma role:

```sql
create user "prisma" with password 'replace_with_a_strong_password' bypassrls createdb;
grant "prisma" to "postgres";
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

3. In Supabase Dashboard, open **Connect** and copy these Postgres connection strings:
   - Supavisor transaction pooler URL on port `6543` for serverless runtime.
   - Supavisor session pooler URL on port `5432` for Prisma migrations, or the direct URL if your network can reach the direct database host.
4. For Vercel/serverless runtime, use the transaction pooler URL as `DATABASE_URL`.
5. For Prisma migrations, use the session pooler or direct URL as `DIRECT_URL`.

Example:

```env
DATABASE_URL=postgres://prisma.PROJECT_REF:PRISMA_PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgres://prisma.PROJECT_REF:PRISMA_PASSWORD@REGION.pooler.supabase.com:5432/postgres
```

## 2. Apply Prisma migrations and seed

Run this locally after setting `backend-api/.env` to your Supabase `DATABASE_URL` and `DIRECT_URL`:

```bash
pnpm --filter @portfoliov2/backend-api prisma:migrate:deploy
pnpm --filter @portfoliov2/backend-api prisma:seed
```

Use a strong `SEED_ADMIN_PASSWORD` before seeding.

## 3. Create Supabase Storage

1. In Supabase Dashboard, open **Storage**.
2. Create a public bucket named `portfolio-media`, or use another bucket name and set `SUPABASE_STORAGE_BUCKET` to match.
3. Copy the project URL and service role key from **Project Settings > API**.

The API uses the service role key only on the server to upload CMS media and store the returned public URL in Prisma.

## 4. Create Vercel projects

Import the same GitHub repo three times in Vercel.

### API project

- Root Directory: `backend-api`
- Framework Preset: Other
- Build Command: `pnpm prisma:generate && pnpm build`

Environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgres://prisma.PROJECT_REF:PRISMA_PASSWORD@REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgres://prisma.PROJECT_REF:PRISMA_PASSWORD@REGION.pooler.supabase.com:5432/postgres
PORTFOLIO_URL=https://your-portfolio-domain.vercel.app
CMS_URL=https://your-cms-domain.vercel.app
CORS_ORIGINS=https://your-portfolio-domain.vercel.app,https://your-cms-domain.vercel.app
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-service-role-key
SUPABASE_STORAGE_BUCKET=portfolio-media
JWT_ACCESS_SECRET=replace-with-a-long-random-value
JWT_REFRESH_SECRET=replace-with-a-different-long-random-value
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

Only set `COOKIE_DOMAIN` if the API and CMS share a custom parent domain, for example `.yourdomain.com`.

### Portfolio project

- Root Directory: repository root
- Framework Preset: Vite
- Build Command: `pnpm build`
- Output Directory: `dist`

Environment variables:

```env
VITE_API_URL=https://your-api-domain.vercel.app
```

### CMS project

- Root Directory: `cms-admin`
- Framework Preset: Next.js

Environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.vercel.app
API_INTERNAL_URL=https://your-api-domain.vercel.app
```

## 5. Optional legacy data migration

If you still have the old local Postgres database available, set `LEGACY_DATABASE_URL` in `backend-api/.env` and import legacy CMS records into Supabase after migrations are applied:

```bash
LEGACY_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/portfolio_v2 pnpm db:import-legacy
```

This script reads from the old local database and writes to the Supabase database configured by `DIRECT_URL`.
