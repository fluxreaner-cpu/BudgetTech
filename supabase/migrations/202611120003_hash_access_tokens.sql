-- Store only SHA-256 hashes of access/session tokens, never bearer secrets.
create extension if not exists pgcrypto with schema extensions;
alter table app_private.users add column if not exists session_token_hash text;
update app_private.users
set session_token_hash = encode(extensions.digest(convert_to(session_token, 'UTF8'), 'sha256'), 'hex')
where session_token is not null and session_token_hash is null;
alter table app_private.users drop column if exists session_token;
create unique index if not exists users_session_token_hash_idx
  on app_private.users (session_token_hash) where session_token_hash is not null;
