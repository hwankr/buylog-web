# buylog-web

Next.js App Router web dashboard for the existing buylog Supabase database.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` point to the shared buylog Supabase project. `BUYLOG_ENABLE_DEV_FALLBACK=true` enables the graduation-demo viewer backed by the existing dev user id.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Database

The web MVP adds read-only reporting RPCs in `supabase/migrations/20260530125500_add_buylog_web_reporting_rpcs.sql`. The migration does not modify existing tables. It keeps personal/group scope filtering inside SQL so dashboard components only receive already-shaped report data.
