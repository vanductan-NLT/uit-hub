# CLAUDE.md — UIT Hub (SE104)

Instructions for Claude Code when working on this project.

## Stack

- Next.js 15 App Router · TypeScript · Tailwind CSS v4
- Supabase (PostgreSQL + Auth) — project ref `xugdxmxjgsqodjlwdmzi`
- Deployed on Vercel

## Database Migrations

**MANDATORY: Every migration MUST have a matching rollback file.**

When creating a migration, always create BOTH files in `supabase/migrations/`:

```
supabase/migrations/
  YYYYMMDD_<slug>.sql           ← forward migration
  YYYYMMDD_<slug>_rollback.sql  ← rollback (DROP/ALTER to undo)
```

Rollback must exactly undo the forward migration — `DROP TABLE IF EXISTS ... CASCADE` for new tables, `ALTER TABLE ... DROP COLUMN IF EXISTS` for new columns. Always use `IF EXISTS` so the rollback is safe to run multiple times.

Never commit a migration without its rollback counterpart.

## CSS Conventions

- Class prefix: `es-{component}` (BEM-like)
- CSS variables: `var(--ink)`, `var(--es-muted)`, `var(--blue)`, `var(--white)`, `var(--bg)`, `var(--es-border)`
- Shadows: `var(--shadow-clay)`, `var(--shadow-clay-hover)`
- Radius: `var(--r)`, `var(--r-sm)`, `var(--r-lg)`, `var(--r-xl)`, `var(--r-2xl)`, `var(--r-full)`
- Modal overlay: `es-logout-overlay` + inline card div
- Animation: `duo-bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1)`

## Code Conventions

- File size limit: 200 lines — split into modules when exceeded
- File naming: kebab-case for all TS/TSX files
- Empty states → `<EmptyState>` component (`src/components/ui/empty-state.tsx`)
- Error states → `<ErrorState>` component (`src/components/ui/error-state.tsx`)
- All panels must handle: loading · empty (with import CTA) · error states
- Server actions: `"use server"` at top, use `createAdminClient()` from `@/lib/supabase/admin`
- Client data fetching: `createClient()` from `@/lib/supabase/client`

## Commit Convention

Commit after every completed task/phase. Format: `feat|fix|refactor: <description>`.
No AI references in commit messages.
