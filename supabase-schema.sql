-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Make sure "Email confirmations" are enabled in Auth → Settings if you want
-- email verification, or disable them for easier local testing.

-- Note: past "journeys" (archived plans) are stored inside the existing
-- app_data column as a small versioned wrapper, so no schema change is needed
-- to enable the journey-history feature.
create table if not exists user_data (
  user_id  uuid references auth.users primary key,
  app_data jsonb,
  entries  jsonb default '[]'::jsonb,
  body_points jsonb default '[]'::jsonb,
  chat_history jsonb default '[]'::jsonb,
  lang     text default 'en',
  updated_at timestamptz default now()
);

alter table user_data enable row level security;

-- Users can only read/write their own row
create policy "own data" on user_data
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
