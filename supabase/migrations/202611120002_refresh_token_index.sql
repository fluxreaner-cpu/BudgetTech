-- Improve indexed lookup for hashed refresh-token rotation.
create index if not exists users_refresh_tokens_gin_idx
  on app_private.users using gin (refresh_tokens jsonb_path_ops);
