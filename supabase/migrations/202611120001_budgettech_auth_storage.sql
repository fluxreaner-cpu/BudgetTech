-- BudgetTech private authentication storage.
-- Run with a privileged migration role; the application connects only from the server.

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to postgres;

create table if not exists app_private.users (
  email text primary key,
  user_id text not null unique,
  name text not null,
  password_hash text not null,
  salt text,
  hash_iterations integer,
  created_at timestamptz not null,
  last_active_at timestamptz,
  is_verified boolean not null default false,
  avatar_seed text not null,
  session_token text,
  token_expires_at bigint,
  refresh_tokens jsonb not null default '[]'::jsonb,
  saved_builds jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint users_email_lowercase check (email = lower(email)),
  constraint users_refresh_tokens_array check (jsonb_typeof(refresh_tokens) = 'array'),
  constraint users_saved_builds_array check (jsonb_typeof(saved_builds) = 'array')
);

create table if not exists app_private.verification_codes (
  email text primary key,
  name text not null,
  password_hash text not null,
  code text not null,
  expires_at bigint not null,
  attempts_left integer not null check (attempts_left between 0 and 3),
  created_at timestamptz not null default now(),
  constraint verification_codes_email_lowercase check (email = lower(email))
);

create index if not exists users_session_token_idx
  on app_private.users (session_token) where session_token is not null;
create index if not exists users_token_expires_at_idx
  on app_private.users (token_expires_at);
create index if not exists verification_codes_expires_at_idx
  on app_private.verification_codes (expires_at);

alter table app_private.users enable row level security;
alter table app_private.verification_codes enable row level security;
