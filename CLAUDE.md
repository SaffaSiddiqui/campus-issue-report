# CLAUDE.md — Electronic Issue Reporting System (Campus)

## Project goal
Build a campus issue reporting system. Students/staff report faulty facilities and track
the complaint; admins manage complaints and view statistics.

## Requirements
- Report issues for: **computers, projectors, fans, lights, Wi-Fi**.
- Submit complaints with a **description and pictures** (max 3 images, 5 MB each).
- Track complaint status: **Pending → In Progress → Resolved**, with a history timeline.
- **Admin dashboard** to manage complaints: search, filter by status/category, change status/priority, add notes, delete.
- **Statistics and reports**: totals per status, per category, reports per day (last 14 days),
  resolution rate, average resolution time, open high-priority count, CSV export.
- **Responsive, user-friendly UI**: mobile-first (test at 360px), clear empty/loading/error states.

## Stack
- Next.js 14 (App Router, TypeScript, Server Components + Server Actions)
- Supabase: Postgres, Auth (email/password), Storage (`campus-issue-images` bucket)
- `@supabase/ssr` for cookie-based sessions
- Tailwind CSS 3 (no UI library; charts built with plain CSS)

## Commands
- `npm install`
- `npm run dev` — http://localhost:3000
- `npm run build`, `npm run typecheck`, `npm run lint` — must all pass before a task is finished

## Environment (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
Never use the service-role key in client code or commit secrets.

## Data model (supabase/schema.sql — isolated Postgres schema `campus_issues`; never touches `public`)
- `profiles(id → auth.users, full_name, role 'student'|'admin')` — created by a trigger on signup; role defaults to `student`
- `issues(id, user_id, category, title, description, location, priority low|medium|high, status pending|in_progress|resolved, image_urls text[], admin_note, created_at, updated_at, resolved_at)`
- `issue_updates(id, issue_id, status, note, changed_by, created_at)` — status history, written by DB triggers only
- Storage bucket `campus-issue-images` (public read; users upload only into their own `<user_id>/` folder)

## Authorization (enforced with RLS, not just UI)
- Users: insert and read their own issues only; cannot set status or admin_note on insert.
- Admins (`is_admin()` security-definer function): read all, update, delete.
- Users must never be able to change their own `role`.
- Admin routes also check the role server-side and redirect non-admins.
- Promote an admin manually:
  `update campus_issues.profiles set role='admin' where id=(select id from auth.users where email='you@campus.edu');`

## Planned structure
```
src/lib/supabase/{client,server,middleware}.ts   browser / server clients, session refresh
src/middleware.ts                                protect /report /my-issues /issues /admin
src/lib/{constants,types,format,stats}.ts        categories & statuses (single source of truth), types, helpers, stats
src/components/                                  Navbar, StatusBadge, IssueCard, StatCard, BarChart
src/app/page.tsx                                 landing
src/app/{login,register}/                        auth
src/app/report/                                  report form with image upload
src/app/my-issues/                               user's complaints + status tabs
src/app/issues/[id]/                             detail, timeline, admin controls (server actions)
src/app/admin/                                   dashboard; admin/export = CSV route
supabase/schema.sql                              tables, triggers, RLS, storage policies
```

## Conventions
- Prefer Server Components for data fetching; `"use client"` only for forms/interactivity.
- Add a new category/status in `constants.ts` AND the `check` constraints in `schema.sql`.
- Validate input on both client and DB (check constraints).
- Escape CSV cells and neutralise leading `= + - @` to prevent formula injection.
- Keep components small; no unused dependencies.

## Definition of done
Build, typecheck and lint pass; a student can register → report with photos → see status;
an admin can log in → see stats → change status → the student sees the update.

## Isolated schema notes
- Supabase clients use `db: { schema: DB_SCHEMA }` (`constants.ts`). Add `campus_issues` under Dashboard → Settings → API → Exposed schemas.
- Never create/alter/drop objects in `public`; all DDL goes in `supabase/schema.sql` (idempotent).
