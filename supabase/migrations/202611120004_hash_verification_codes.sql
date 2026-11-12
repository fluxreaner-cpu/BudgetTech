-- Replace plaintext email verification codes with keyed HMAC digests.
-- Existing pending codes are intentionally invalidated; they expire after five minutes.
-- The HMAC key is DB_ENCRYPTION_KEY and is never stored in PostgreSQL.

begin;

delete from app_private.verification_codes;
alter table app_private.verification_codes drop column code;
alter table app_private.verification_codes add column code_hash text not null;

commit;
