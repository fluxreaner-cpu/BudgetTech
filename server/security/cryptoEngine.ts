import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { hash, verify } from '@node-rs/argon2';

// --- Master Key Management for DB Field-Level Encryption (AES-256-GCM) ---
const KEYS_DIR = path.resolve(process.cwd(), 'data', 'keys');
const MASTER_KEY_FILE = path.join(KEYS_DIR, 'db_master.key');

if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

function getMasterEncryptionKey(): Buffer {
  const configuredKey = process.env.DB_ENCRYPTION_KEY;
  if (configuredKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(configuredKey)) {
      throw new Error('DB_ENCRYPTION_KEY must be exactly 64 hexadecimal characters.');
    }
    return Buffer.from(configuredKey, 'hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DB_ENCRYPTION_KEY must be configured in production.');
  }

  if (fs.existsSync(MASTER_KEY_FILE)) {
    const keyHex = fs.readFileSync(MASTER_KEY_FILE, 'utf-8').trim();
    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error('Stored development encryption key is invalid.');
    }
    return Buffer.from(keyHex, 'hex');
  }

  const generatedKey = crypto.randomBytes(32);
  fs.writeFileSync(MASTER_KEY_FILE, generatedKey.toString('hex'), { mode: 0o600, flag: 'wx' });
  return generatedKey;
}

const masterKey = getMasterEncryptionKey();

// Pre-computed dummy Argon2id hash for constant-time User Enumeration defense
let precomputedDummyHash: string = '';
(async () => {
  try {
    precomputedDummyHash = await hash('dummy_security_entropy_probe_string_7718', {
      memoryCost: 19456, // 19 MB (OWASP recommended standard)
      timeCost: 2,
      parallelism: 1,
    });
  } catch (err) {
    console.error('[Crypto Engine] Error generating dummy hash:', err);
  }
})();

/**
 * 1. Argon2id Password Hashing (OWASP ASVS Standard)
 */
export async function hashPasswordArgon2(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 19456, // 19 MB
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPasswordArgon2(hashString: string, password: string): Promise<boolean> {
  try {
    return await verify(hashString, password);
  } catch {
    return false;
  }
}

/**
 * 2. Constant-time dummy verification for User Enumeration Defense
 * Runs identical Argon2id calculation when user does not exist so timing is indistinguishable
 */
export async function dummyArgon2Verification(): Promise<void> {
  try {
    if (precomputedDummyHash) {
      await verify(precomputedDummyHash, 'dummy_mismatched_password_for_timing_defense');
    }
  } catch {
    // Ignore timing dummy result
  }
}

/**
 * 3. Legacy PBKDF2 verification for backward compatibility & automatic upgrading
 */
export function verifyLegacyPBKDF2(password: string, salt: string, iterations: number, targetHash: string): boolean {
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    const bufA = Buffer.from(testHash);
    const bufB = Buffer.from(targetHash);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * 4. AES-256-GCM Field-Level Encryption at Rest
 */
export function encryptField(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: v1$base64(iv)$base64(tag)$base64(ciphertext)
  return `v1$${iv.toString('base64')}$${authTag.toString('base64')}$${encrypted.toString('base64')}`;
}

export function decryptField(encryptedText: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith('v1$')) {
    // Legacy unencrypted string fallback
    return encryptedText;
  }

  try {
    const parts = encryptedText.split('$');
    if (parts.length !== 4) return encryptedText;

    const iv = Buffer.from(parts[1], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');
    const ciphertext = Buffer.from(parts[3], 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[Crypto Engine] Failed decrypting field:', err);
    return '';
  }
}

/**
 * 5. Constant-time string equality check
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a.trim());
    const bufB = Buffer.from(b.trim());
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}


/** Keyed OTP digest; the database alone cannot enumerate the six-digit code space. */
export function hashVerificationCode(email: string, code: string): string {
  return crypto.createHmac('sha256', masterKey)
    .update('budgettech:email-verification:v1\0', 'utf8')
    .update(email.trim().toLowerCase(), 'utf8')
    .update('\0', 'utf8')
    .update(code, 'utf8')
    .digest('hex');
}
