import 'dotenv/config';
import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

export interface RefreshTokenRecord {
  tokenHash: string;
  familyId: string;
  generation: number;
  expiresAt: number;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt?: string;
  hashIterations?: number;
  createdAt: string;
  lastActiveAt?: string;
  isVerified: boolean;
  avatarSeed: string;
  token?: string;
  tokenExpiresAt?: number;
  refreshTokens: RefreshTokenRecord[];
  savedBuilds: unknown[];
}

export interface StoredCode {
  email: string;
  name: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
  attemptsLeft: number;
}

type UserRow = {
  user_id: string; email: string; name: string; password_hash: string;
  salt: string | null; hash_iterations: number | null; created_at: Date;
  last_active_at: Date | null; is_verified: boolean; avatar_seed: string;
  session_token_hash: string | null; token_expires_at: string | number | null;
  refresh_tokens: RefreshTokenRecord[]; saved_builds: unknown[];
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for PostgreSQL storage.');
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: true },
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: 'budgettech-api',
});

pool.on('error', (error) => {
  console.error('[PostgreSQL] Unexpected idle client error:', error.message);
});

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    ...(row.salt ? { salt: row.salt } : {}),
    ...(row.hash_iterations ? { hashIterations: row.hash_iterations } : {}),
    createdAt: new Date(row.created_at).toISOString(),
    ...(row.last_active_at ? { lastActiveAt: new Date(row.last_active_at).toISOString() } : {}),
    isVerified: row.is_verified,
    avatarSeed: row.avatar_seed,

    ...(row.token_expires_at != null ? { tokenExpiresAt: Number(row.token_expires_at) } : {}),
    refreshTokens: Array.isArray(row.refresh_tokens) ? row.refresh_tokens : [],
    savedBuilds: Array.isArray(row.saved_builds) ? row.saved_builds : [],
  };
}

const USER_COLUMNS = `user_id,email,name,password_hash,salt,hash_iterations,created_at,last_active_at,
  is_verified,avatar_seed,session_token_hash,token_expires_at,refresh_tokens,saved_builds`;

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const result = await pool.query<UserRow>(
    `select ${USER_COLUMNS} from app_private.users where email = $1 limit 1`, [email.toLowerCase()]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function getUserBySessionToken(token: string): Promise<StoredUser | null> {
  const result = await pool.query<UserRow>(
    `select ${USER_COLUMNS} from app_private.users where session_token_hash = $1 and token_expires_at > $2 limit 1`,
    [crypto.createHash('sha256').update(token).digest('hex'), Date.now()]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function saveUser(user: StoredUser): Promise<void> {
  await pool.query(
    `insert into app_private.users
      (email,user_id,name,password_hash,salt,hash_iterations,created_at,last_active_at,is_verified,
       avatar_seed,session_token_hash,token_expires_at,refresh_tokens,saved_builds,updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,now())
     on conflict (email) do update set
       user_id=excluded.user_id,name=excluded.name,password_hash=excluded.password_hash,
       salt=excluded.salt,hash_iterations=excluded.hash_iterations,last_active_at=excluded.last_active_at,
       is_verified=excluded.is_verified,avatar_seed=excluded.avatar_seed,session_token_hash=excluded.session_token_hash,
       token_expires_at=excluded.token_expires_at,refresh_tokens=excluded.refresh_tokens,
       saved_builds=excluded.saved_builds,updated_at=now()`,
    [user.email.toLowerCase(),user.id,user.name,user.passwordHash,user.salt ?? null,user.hashIterations ?? null,
     user.createdAt,user.lastActiveAt ?? null,user.isVerified,user.avatarSeed,user.token ? crypto.createHash('sha256').update(user.token).digest('hex') : null,
     user.tokenExpiresAt ?? null,JSON.stringify(user.refreshTokens ?? []),JSON.stringify(user.savedBuilds ?? [])]
  );
}

export async function saveVerificationCode(code: StoredCode): Promise<void> {
  await pool.query(
    `insert into app_private.verification_codes(email,name,password_hash,code,expires_at,attempts_left,created_at)
     values($1,$2,$3,$4,$5,$6,now())
     on conflict(email) do update set name=excluded.name,password_hash=excluded.password_hash,
       code=excluded.code,expires_at=excluded.expires_at,attempts_left=excluded.attempts_left,created_at=now()`,
    [code.email.toLowerCase(),code.name,code.passwordHash,code.code,code.expiresAt,code.attemptsLeft]
  );
}

export async function getVerificationCode(email: string): Promise<StoredCode | null> {
  const result = await pool.query(
    `select email,name,password_hash,code,expires_at,attempts_left
     from app_private.verification_codes where email=$1 and expires_at>$2 limit 1`,
    [email.toLowerCase(),Date.now()]
  );
  const row = result.rows[0];
  return row ? { email: row.email, name: row.name, passwordHash: row.password_hash,
    code: row.code, expiresAt: Number(row.expires_at), attemptsLeft: row.attempts_left } : null;
}

export async function decrementCodeAttempts(email: string): Promise<number | null> {
  const result = await pool.query(
    `update app_private.verification_codes set attempts_left=attempts_left-1
     where email=$1 and expires_at>$2 and attempts_left>0 returning attempts_left`,
    [email.toLowerCase(),Date.now()]
  );
  const remaining = result.rows[0]?.attempts_left ?? null;
  if (remaining === 0) await deleteVerificationCode(email);
  return remaining;
}

export async function deleteVerificationCode(email: string): Promise<void> {
  await pool.query('delete from app_private.verification_codes where email=$1',[email.toLowerCase()]);
}

export async function createVerifiedUserFromCode(email: string, expectedCode: string, user: StoredUser): Promise<boolean> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('begin');
    const codeResult = await client.query(
      `select code,expires_at,attempts_left from app_private.verification_codes
       where email=$1 for update`, [email.toLowerCase()]
    );
    const code = codeResult.rows[0];
    if (!code || Number(code.expires_at) <= Date.now() || code.attempts_left <= 0) {
      await client.query('rollback');
      return false;
    }
    const supplied = Buffer.from(String(expectedCode));
    const actual = Buffer.from(String(code.code));
    const valid = supplied.length === actual.length && crypto.timingSafeEqual(supplied, actual);
    if (!valid) {
      const remaining = Number(code.attempts_left) - 1;
      if (remaining <= 0) {
        await client.query('delete from app_private.verification_codes where email=$1',[email.toLowerCase()]);
      } else {
        await client.query('update app_private.verification_codes set attempts_left=$2 where email=$1',[email.toLowerCase(),remaining]);
      }
      await client.query('commit');
      return false;
    }
    await client.query(
      `insert into app_private.users
       (email,user_id,name,password_hash,created_at,last_active_at,is_verified,avatar_seed,session_token_hash,
        token_expires_at,refresh_tokens,saved_builds,updated_at)
       select $1,$2,$3,$4,$5,$6,true,$7,$8,$9,$10::jsonb,'[]'::jsonb,now()
       where not exists(select 1 from app_private.users where email=$1)
       on conflict(email) do nothing`,
      [user.email.toLowerCase(),user.id,user.name,user.passwordHash,user.createdAt,user.lastActiveAt,
       user.avatarSeed,user.token ? crypto.createHash('sha256').update(user.token).digest('hex') : null,user.tokenExpiresAt ?? null,JSON.stringify(user.refreshTokens ?? [])]
    );
    const inserted = await client.query('select 1 from app_private.users where email=$1',[email.toLowerCase()]);
    if (!inserted.rowCount) {
      await client.query('rollback');
      return false;
    }
    await client.query('delete from app_private.verification_codes where email=$1',[email.toLowerCase()]);
    await client.query('commit');
    return true;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserByRefreshHash(hash: string): Promise<StoredUser | null> {
  const result = await pool.query<UserRow>(
    `select ${USER_COLUMNS} from app_private.users
     where refresh_tokens @> $1::jsonb limit 1`,
    [JSON.stringify([{tokenHash:hash}])]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateSavedBuilds(email: string, builds: unknown[]): Promise<void> {
  await pool.query(
    'update app_private.users set saved_builds=$2::jsonb,updated_at=now() where email=$1',
    [email.toLowerCase(),JSON.stringify(builds)]
  );
}

export async function touchUserSession(email: string): Promise<void> {\n  await pool.query('update app_private.users set last_active_at=now(),updated_at=now() where email=$1',[email.toLowerCase()]);\n}\n\nexport async function revokeSession(email: string): Promise<void> {
  await pool.query(
    'update app_private.users set session_token_hash=null,token_expires_at=null,updated_at=now() where email=$1',
    [email.toLowerCase()]
  );
}


export async function updateUserSession(user: StoredUser): Promise<void> {
  await pool.query(
    `update app_private.users set password_hash=$2,salt=$3,hash_iterations=$4,
      last_active_at=$5,session_token_hash=coalesce($6,session_token_hash),token_expires_at=$7,refresh_tokens=$8::jsonb,updated_at=now()
     where email=$1`,
    [user.email.toLowerCase(),user.passwordHash,user.salt ?? null,user.hashIterations ?? null,
     user.lastActiveAt ?? null,user.token ? crypto.createHash('sha256').update(user.token).digest('hex') : null,user.tokenExpiresAt ?? null,
     JSON.stringify(user.refreshTokens ?? [])]
  );
}

export async function rotateRefreshToken(oldHash: string, newRecord: RefreshTokenRecord,
  newAccessToken: string, accessExpiresAt: number): Promise<StoredUser | null> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await client.query<UserRow>(
      `select ${USER_COLUMNS} from app_private.users
       where refresh_tokens @> $1::jsonb for update`,
      [JSON.stringify([{tokenHash:oldHash}])]
    );
    if (!result.rows[0]) { await client.query('rollback'); return null; }
    const user = mapUser(result.rows[0]);
    const index = user.refreshTokens.findIndex(t => t.tokenHash === oldHash);
    if (index < 0 || user.refreshTokens[index].expiresAt <= Date.now()) {
      await client.query('rollback'); return null;
    }
    user.refreshTokens[index] = newRecord;
    user.token = newAccessToken;
    user.tokenExpiresAt = accessExpiresAt;
    user.lastActiveAt = new Date().toISOString();
    await client.query(
      `update app_private.users set session_token_hash=$2,token_expires_at=$3,
       last_active_at=$4,refresh_tokens=$5::jsonb,updated_at=now() where email=$1`,
      [user.email,crypto.createHash('sha256').update(newAccessToken).digest('hex'),accessExpiresAt,user.lastActiveAt,JSON.stringify(user.refreshTokens)]
    );
    await client.query('commit');
    return user;
  } catch (error) {
    await client.query('rollback'); throw error;
  } finally { client.release(); }
}
