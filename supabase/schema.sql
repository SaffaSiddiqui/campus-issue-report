-- Campus Issue Reporter — ISOLATED schema (safe for an existing Supabase project)
--
-- Everything lives in its own Postgres schema `campus_issues`, so it never touches your
-- existing `public` tables, functions, triggers, policies or records.
-- It is idempotent: you can run it more than once.
--
-- AFTER running: Dashboard → Project Settings → Data API → "Exposed schemas" →
-- add `campus_issues` → Save. (Without this the app gets "schema must be one of…" errors.)

create schema if not exists campus_issues;

-- ───────────── Tables ─────────────
create table if not exists campus_issues.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists campus_issues.issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references campus_issues.profiles(id) on delete cascade,
  category text not null check (category in ('computer', 'projector', 'fan', 'light', 'wifi')),
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 5 and 2000),
  location text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  image_urls text[] not null default '{}',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists campus_issues.issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references campus_issues.issues(id) on delete cascade,
  status text not null,
  note text,
  changed_by uuid references campus_issues.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists issues_user_idx on campus_issues.issues(user_id);
create index if not exists issues_status_idx on campus_issues.issues(status);
create index if not exists issues_created_idx on campus_issues.issues(created_at desc);
create index if not exists issue_updates_issue_idx on campus_issues.issue_updates(issue_id);

-- ───────────── Functions & triggers (all inside campus_issues) ─────────────
create or replace function campus_issues.is_admin()
returns boolean language sql security definer stable set search_path = campus_issues, pg_temp as $$
  select exists (select 1 from campus_issues.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a campus profile for each new auth user. Wrapped in an exception handler so that
-- a problem here can NEVER block sign-ups of your other apps.
create or replace function campus_issues.handle_new_user()
returns trigger language plpgsql security definer set search_path = campus_issues, pg_temp as $$
begin
  insert into campus_issues.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists campus_issues_on_auth_user_created on auth.users;
create trigger campus_issues_on_auth_user_created
  after insert on auth.users
  for each row execute function campus_issues.handle_new_user();

-- Backfill: give EXISTING users a campus profile (read-only on auth.users, writes only our table).
insert into campus_issues.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

create or replace function campus_issues.issues_before_change()
returns trigger language plpgsql set search_path = campus_issues, pg_temp as $$
begin
  new.updated_at := now();
  if new.status = 'resolved' and old.status <> 'resolved' then
    new.resolved_at := now();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create or replace function campus_issues.issues_log_insert()
returns trigger language plpgsql security definer set search_path = campus_issues, pg_temp as $$
begin
  insert into campus_issues.issue_updates (issue_id, status, note, changed_by)
  values (new.id, new.status, 'Issue reported', new.user_id);
  return new;
end;
$$;

create or replace function campus_issues.issues_log_update()
returns trigger language plpgsql security definer set search_path = campus_issues, pg_temp as $$
begin
  if new.status is distinct from old.status or new.admin_note is distinct from old.admin_note then
    insert into campus_issues.issue_updates (issue_id, status, note, changed_by)
    values (new.id, new.status, new.admin_note, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists issues_after_insert on campus_issues.issues;
create trigger issues_after_insert after insert on campus_issues.issues
  for each row execute function campus_issues.issues_log_insert();

drop trigger if exists issues_before_update on campus_issues.issues;
create trigger issues_before_update before update on campus_issues.issues
  for each row execute function campus_issues.issues_before_change();

drop trigger if exists issues_after_update on campus_issues.issues;
create trigger issues_after_update after update on campus_issues.issues
  for each row execute function campus_issues.issues_log_update();

-- ───────────── Row Level Security ─────────────
alter table campus_issues.profiles enable row level security;
alter table campus_issues.issues enable row level security;
alter table campus_issues.issue_updates enable row level security;

drop policy if exists "profiles read" on campus_issues.profiles;
create policy "profiles read" on campus_issues.profiles for select to authenticated
  using (id = auth.uid() or campus_issues.is_admin());

-- Users may edit their own row but never change their role.
drop policy if exists "profiles update own" on campus_issues.profiles;
create policy "profiles update own" on campus_issues.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from campus_issues.profiles p where p.id = auth.uid()));

drop policy if exists "issues read" on campus_issues.issues;
create policy "issues read" on campus_issues.issues for select to authenticated
  using (user_id = auth.uid() or campus_issues.is_admin());

drop policy if exists "issues insert own" on campus_issues.issues;
create policy "issues insert own" on campus_issues.issues for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and admin_note is null);

drop policy if exists "issues admin update" on campus_issues.issues;
create policy "issues admin update" on campus_issues.issues for update to authenticated
  using (campus_issues.is_admin()) with check (campus_issues.is_admin());

drop policy if exists "issues admin delete" on campus_issues.issues;
create policy "issues admin delete" on campus_issues.issues for delete to authenticated
  using (campus_issues.is_admin());

drop policy if exists "updates read" on campus_issues.issue_updates;
create policy "updates read" on campus_issues.issue_updates for select to authenticated
  using (exists (
    select 1 from campus_issues.issues i
    where i.id = issue_id and (i.user_id = auth.uid() or campus_issues.is_admin())
  ));

-- ───────────── API access (needed because this is a non-public schema) ─────────────
grant usage on schema campus_issues to authenticated;
grant select, insert, update, delete on all tables in schema campus_issues to authenticated;
grant execute on function campus_issues.is_admin() to authenticated;

-- ───────────── Storage (own bucket + uniquely named policies) ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('campus-issue-images', 'campus-issue-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists "campus_issue_images read" on storage.objects;
create policy "campus_issue_images read" on storage.objects for select
  using (bucket_id = 'campus-issue-images');

drop policy if exists "campus_issue_images upload own folder" on storage.objects;
create policy "campus_issue_images upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'campus-issue-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "campus_issue_images delete own or admin" on storage.objects;
create policy "campus_issue_images delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'campus-issue-images'
         and ((storage.foldername(name))[1] = auth.uid()::text or campus_issues.is_admin()));

notify pgrst, 'reload schema';
