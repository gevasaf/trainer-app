-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Make sure "Email confirmations" are enabled in Auth → Settings if you want
-- email verification, or disable them for easier local testing.

create table if not exists user_data (
  user_id  uuid references auth.users primary key,
  app_data jsonb,
  entries  jsonb default '[]'::jsonb,
  body_points jsonb default '[]'::jsonb,
  chat_history jsonb default '[]'::jsonb,
  journeys jsonb default '[]'::jsonb,
  lang     text default 'en',
  updated_at timestamptz default now()
);

-- Backwards-compatible migration for existing installs: add the journeys
-- column if the table already exists without it. Safe to run repeatedly.
alter table user_data add column if not exists journeys jsonb default '[]'::jsonb;

alter table user_data enable row level security;

-- Users can only read/write their own row
create policy "own data" on user_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
