-- Store only SHA-256 hashes of access/session tokens, never bearer secrets.
alter table app_private.users add column if not exists session_token_hash text;
-- Invalidate any legacy plaintext access tokens before removing the old column.
update app_private.users set session_token = null where session_token is not null;
alter table app_private.users drop column if exists session_token;
create unique index if not exists users_session_token_hash_idx
  on app_private.users (session_token_hash) where session_token_hash is not null;
