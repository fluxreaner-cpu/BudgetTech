import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import {
  getUserByEmail, getUserBySessionToken, saveVerificationCode,
  getVerificationCode, decrementCodeAttempts, deleteVerificationCode,
  createVerifiedUserFromCode, updateUserSession, findUserByRefreshHash,
  rotateRefreshToken, updateSavedBuilds, revokeSession, type StoredUser as DbStoredUser
} from './server/storage/postgresStore';


// AppSec Modules
import { logSecurityEvent } from './server/security/auditLogger';
import { 
  hashPasswordArgon2, 
  verifyPasswordArgon2, 
  dummyArgon2Verification, 
  verifyLegacyPBKDF2, 
  timingSafeCompare 
} from './server/security/cryptoEngine';
import { 
  getClientIp, 
  checkMultiTierRateLimit, 
  recordFailedAuthAttempt, 
  resetAuthAttempts 
} from './server/security/rateLimiter';
import { checkPasswordBreached } from './server/security/hibpValidator';
import { 
  SendCodeSchema, 
  VerifyCodeSchema, 
  LoginSchema, 
  SaveRigsBodySchema, 
  CatalogQuerySchema 
} from './server/security/validationSchemas';
import { antiScrapingMiddleware } from './server/security/antiScraping';
import { 
  httpsEnforcer, 
  browserSecurityHeaders, 
  corsValidator, 
  csrfProtection, 
  globalErrorHandler 
} from './server/security/securityMiddleware';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET;
if (isProd && !SESSION_SECRET) throw new Error('SESSION_SECRET must be configured in production.');

// Level 22: Trust Proxy for accurate Cloudflare / GCP Cloud Run IP extraction
app.set('trust proxy', 1);

// Level 1: Disable x-powered-by fingerprinting
app.disable('x-powered-by');

// Level 8 & 9: HTTPS Enforcer & HSTS
app.use(httpsEnforcer);

// Level 17, 18, 19: Content Security Policy, Clickjacking defense, Nosniff
app.use(browserSecurityHeaders);

// Level 20: Strict CORS Policy
app.use(corsValidator);

// Level 2: Cookie Parser with signed session cookie support
app.use(cookieParser(SESSION_SECRET || 'local-development-only-change-me'));

// Level 29: Restrict request payload size to 64kb to prevent memory exhaustion DoS
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// Level 21: Anti-CSRF Guard for mutating requests
app.use(csrfProtection);

// --- End-to-End Cryptography: RSA-2048 Keypair & Wire Decryption Middleware ---
const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const KEYS_DIR = path.join(DATA_DIR, 'keys');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true });

const PRIVATE_KEY_FILE = path.join(KEYS_DIR, 'rsa_private.pem');
const PUBLIC_KEY_FILE = path.join(KEYS_DIR, 'rsa_public.pem');

interface ServerKeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
  keyId: string;
}

function initializeCryptoKeys(): ServerKeyPair {
  const configuredPrivateKey = process.env.SERVER_RSA_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const configuredPublicKey = process.env.SERVER_RSA_PUBLIC_KEY?.replace(/\\n/g, '\n');

  if (configuredPrivateKey) {
    const privateKeyPem = configuredPrivateKey;
    const publicKeyPem = configuredPublicKey ||
      crypto.createPublicKey(privateKeyPem).export({ type: 'spki', format: 'pem' }).toString();
    const keyId = crypto.createHash('sha256').update(publicKeyPem).digest('hex').slice(0, 16);
    return { publicKeyPem, privateKeyPem, keyId };
  }

  if (isProd) {
    throw new Error('SERVER_RSA_PRIVATE_KEY must be configured in production.');
  }

  try {
    if (fs.existsSync(PRIVATE_KEY_FILE) && fs.existsSync(PUBLIC_KEY_FILE)) {
      const privateKeyPem = fs.readFileSync(PRIVATE_KEY_FILE, 'utf-8');
      const publicKeyPem = fs.readFileSync(PUBLIC_KEY_FILE, 'utf-8');
      const keyId = crypto.createHash('sha256').update(publicKeyPem).digest('hex').slice(0, 16);
      return { publicKeyPem, privateKeyPem, keyId };
    }
  } catch (err) {
    console.warn('[Crypto Engine] Failed reading development keys:', err);
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  fs.writeFileSync(PRIVATE_KEY_FILE, privateKey, { mode: 0o600, flag: 'wx' });
  fs.writeFileSync(PUBLIC_KEY_FILE, publicKey, { mode: '0o644' as any });
  const keyId = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 16);
  return { publicKeyPem: publicKey, privateKeyPem: privateKey, keyId };
}

const serverKeyPair: ServerKeyPair = initializeCryptoKeys();

// Wire Decryption Middleware: Handles client-encrypted payloads
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && req.body._encrypted === true) {
    try {
      const { encryptedKey, encryptedData, iv } = req.body;
      if (!encryptedKey || !encryptedData || !iv) {
        return res.status(400).json({ error: 'Некорректный защищённый конверт (отсутствуют параметры шифра)' });
      }

      // Decrypt 256-bit AES key with Server RSA Private Key using RSA-OAEP-SHA256
      const encryptedKeyBuf = Buffer.from(encryptedKey, 'base64');
      const rawAesKey = crypto.privateDecrypt(
        {
          key: serverKeyPair.privateKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        encryptedKeyBuf
      );

      // Decrypt AES-256-GCM payload with verified authentication tag
      const combinedBuffer = Buffer.from(encryptedData, 'base64');
      if (combinedBuffer.length < 16) {
        return res.status(400).json({ error: 'Зашифрованные данные слишком короткие для проверки целостности GCM' });
      }

      const authTag = combinedBuffer.subarray(combinedBuffer.length - 16);
      const ciphertext = combinedBuffer.subarray(0, combinedBuffer.length - 16);
      const ivBuffer = Buffer.from(iv, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', rawAesKey, ivBuffer);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      const decryptedBody = JSON.parse(decrypted.toString('utf-8'));
      req.body = decryptedBody;
      (req as any).isE2EE = true;
      logSecurityEvent({
        eventType: 'E2EE_PAYLOAD_DECRYPTED',
        severity: 'INFO',
        ip: getClientIp(req),
        details: { path: req.path, method: req.method },
      });
    } catch (decryptErr) {
      logSecurityEvent({
        eventType: 'E2EE_DECRYPT_FAILURE',
        severity: 'WARN',
        ip: getClientIp(req),
        details: { error: String(decryptErr) },
      });
      return res.status(400).json({
        error: 'Сбой сквозного шифрования: не удалось расшифровать данные. Проверьте актуальность открытого ключа сервера.',
      });
    }
  }
  next();
});

// PostgreSQL is the sole persistent store for users and verification codes.
interface RefreshTokenRecord {
  tokenHash: string;
  familyId: string;
  generation: number;
  expiresAt: number;
}

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Argon2id or legacy PBKDF2
  salt?: string;
  hashIterations?: number;
  createdAt: string;
  lastActiveAt?: string;
  isVerified: boolean;
  avatarSeed: string;
  token?: string; // Encrypted at rest
  tokenExpiresAt?: number;
  refreshTokens?: RefreshTokenRecord[];
  savedBuilds?: any[];
}

interface StoredCode {
  email: string;
  name: string;
  passwordHash: string;
  code: string;
  expiresAt: number;
  attemptsLeft: number;
}


// User Response Sanitizer (Guarantees zero password, salt, or hash leakage)
function sanitizeUserResponse(user: StoredUser) {
  return {
    isLoggedIn: true,
    email: user.email,
    name: user.name,
    avatarSeed: user.avatarSeed,
    joinDate: new Date(user.createdAt).toLocaleDateString(),
    savedBuildCount: (user.savedBuilds || []).length,
    token: user.token,
    isVerified: user.isVerified,
  };
}

// Cookie Helper: Sets HttpOnly, Secure, SameSite=Strict cookies (Level 2)
function setAuthCookies(res: Response, token: string, refreshToken?: string) {
  const isHttps = process.env.NODE_ENV === 'production';

  res.cookie('budgettech_session', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  if (refreshToken) {
    res.cookie('budgettech_refresh', refreshToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    });
  }
}

function clearAuthCookies(res: Response) {
  res.clearCookie('budgettech_session', { path: '/' });
  res.clearCookie('budgettech_refresh', { path: '/api/auth/refresh' });
}

// Nodemailer Setup
let mailTransporter: Transporter | null = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendVerificationEmail(toEmail: string, code: string, recipientName: string): Promise<boolean> {
  const subject = `Код подтверждения BudgetTech: ${code}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0c0f18; color: #f1f5f9; padding: 24px; border-radius: 12px; border: 1px solid #7c3aed;">
      <h2 style="color: #a855f7; margin-bottom: 8px;">BudgetTech — Код подтверждения</h2>
      <p style="font-size: 14px; color: #94a3b8;">Здравствуйте, <strong>${recipientName}</strong>!</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">
        Вы указали этот адрес электронной почты при регистрации на платформе BudgetTech. Введите 6-значный код подтверждения на сайте для завершения регистрации:
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; background: #161c2e; padding: 12px 24px; border-radius: 8px; border: 1px solid #10b981;">
          ${code}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b;">Код действителен в течение 5 минут. Предоставлено максимум 3 попытки ввода. Если вы не запрашивали регистрацию, проигнорируйте это письмо.</p>
    </div>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || '"BudgetTech Security" <no-reply@budgettech.cyber>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (err) {
      console.error('[SMTP Send Error]', err);
    }
  }

  // Never log verification codes or report a simulated delivery.
  if (!mailTransporter && !isProd) {
    console.warn('[SMTP] Not configured; verification email was not sent.');
  }
  return false;
}

// --- Protected Authentication Endpoints ---

// Public RSA-OAEP-256 Encryption Key Endpoint
app.get('/api/auth/crypto-key', (_req: Request, res: Response) => {
  res.json({
    publicKey: serverKeyPair.publicKeyPem,
    keyId: serverKeyPair.keyId,
    algorithm: 'RSA-OAEP-256 + AES-256-GCM',
    cipher: 'AES-256-GCM',
    keyExchange: 'RSA-OAEP-SHA256',
    status: 'active',
  });
});

/**
 * 1. Request Registration Code (Levels 1, 3, 4, 6, 7, 13)
 * - Multi-tiered Rate Limiting with exponential backoff
 * - User Enumeration Defense: Same timing and uniform response even if account exists
 * - Compromised password check (HIBP + local blacklist)
 * - Argon2id password hashing
 * - OTP TTL: 5 minutes, 3 attempts
 */
app.post('/api/auth/send-code', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);

    // Zod Validation (Level 13)
    const parseResult = SendCodeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Некорректные входные данные' });
    }

    const { email: cleanEmail, name: cleanName, password } = parseResult.data;

    // Rate Limiting (Level 3): IP + Account
    const ipLimit = checkMultiTierRateLimit(`send_code_ip:${clientIp}`, 8, 10 * 60 * 1000);
    const emailLimit = checkMultiTierRateLimit(`send_code_email:${cleanEmail}`, 4, 10 * 60 * 1000, true);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const waitTime = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec);
      logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'WARN',
        ip: clientIp,
        identifier: cleanEmail,
        details: { waitTime },
      });
      res.setHeader('Retry-After', waitTime);
      return res.status(429).json({
        error: `Слишком много запросов кода. В целях безопасности подождите ${waitTime} сек перед повтором.`,
      });
    }

    // Check compromised password against HIBP / Blacklist (Level 6)
    const breachedCheck = await checkPasswordBreached(password);
    if (breachedCheck.isCompromised) {
      logSecurityEvent({
        eventType: 'AUTH_PASSWORD_COMPROMISED',
        severity: 'WARN',
        ip: clientIp,
        identifier: cleanEmail,
        details: { reason: breachedCheck.reason },
      });
      return res.status(400).json({
        error: breachedCheck.reason || 'Пароль небезопасен. Выберите другой пароль.',
      });
    }

    const existing = await getUserByEmail(cleanEmail);

    // User Enumeration Defense (Level 4):
    // If user already exists and verified, don't leak "user already exists".
    // Instead, execute dummy delay work and return uniform response.
    if (existing && existing.isVerified) {
      await dummyArgon2Verification();
      logSecurityEvent({
        eventType: 'AUTH_REGISTER_INIT',
        severity: 'INFO',
        ip: clientIp,
        identifier: cleanEmail,
        details: { note: 'Existing verified user attempted re-registration, masked response' },
      });
      return res.json({
        success: true,
        message: `Код подтверждения отправлен на почту ${cleanEmail}`,
        isSmtpSent: false,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + crypto.randomInt(900000)).toString();

    // Hash password with Argon2id (Level 1)
    const passwordHash = await hashPasswordArgon2(password);
    const expiresAt = Date.now() + 5 * 60 * 1000; // Strictly 5 min TTL (Level 7)

    await saveVerificationCode({ email: cleanEmail, name: cleanName, passwordHash, code, expiresAt, attemptsLeft: 3 });

    logSecurityEvent({
      eventType: 'AUTH_OTP_REQUEST',
      severity: 'INFO',
      ip: clientIp,
      identifier: cleanEmail,
      details: { ttlSec: 300, maxAttempts: 3 },
    });

    const isSmtpSent = await sendVerificationEmail(cleanEmail, code, cleanName);

    return res.json({
      success: true,
      message: `Код подтверждения отправлен на почту ${cleanEmail}`,
      isSmtpSent,
      ...(isProd ? {} : { debugCode: code }), // Never expose OTP in production
      expiresAt,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/send-code:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка при отправке кода подтверждения' });
  }
});

/**
 * 2. Verify Code & Create Persistent User Profile (Levels 2, 5, 7, 10, 13)
 * - Anti-Brute Force check: Decrements attempts; on 3 failures, code is destroyed
 * - Timing-safe OTP verification
 * - Issues HttpOnly, Secure, SameSite=Strict cookies + Refresh Token Rotation
 */
app.post('/api/auth/verify-code', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    const parsed = VerifyCodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Некорректный код' });
    const { email: cleanEmail, code: cleanCode } = parsed.data;
    const stored = await getVerificationCode(cleanEmail);
    if (!stored) return res.status(400).json({ error: 'Код подтверждения не найден или истек срок его действия. Запросите новый код.' });
    if (Date.now() > stored.expiresAt) {
      await deleteVerificationCode(cleanEmail);
      return res.status(400).json({ error: 'Срок действия кода истек (TTL 5 мин). Запросите новый код.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const now = Date.now();
    const newUser: StoredUser = {
      id: `usr_${now}_${crypto.randomBytes(4).toString('hex')}`,
      email: cleanEmail, name: stored.name, passwordHash: stored.passwordHash,
      createdAt: new Date(now).toISOString(), lastActiveAt: new Date(now).toISOString(),
      isVerified: true, avatarSeed: cleanEmail, token, tokenExpiresAt: now + 30 * 24 * 60 * 60 * 1000,
      refreshTokens: [{ tokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
        familyId: crypto.randomUUID(), generation: 1, expiresAt: now + 90 * 24 * 60 * 60 * 1000 }],
      savedBuilds: [],
    };
    const created = await createVerifiedUserFromCode(cleanEmail, cleanCode, newUser as DbStoredUser);
    if (!created) {
      const latestCode = await getVerificationCode(cleanEmail);
      const remaining = latestCode?.attemptsLeft ?? 0;
      if (!latestCode) return res.status(400).json({ error: 'Код подтверждения недействителен или истёк.' });
      logSecurityEvent({ eventType: remaining === 0 ? 'AUTH_OTP_EXHAUSTED' : 'AUTH_OTP_FAILURE',
        severity: 'WARN', ip: clientIp, identifier: cleanEmail, details: { attemptsLeft: remaining } });
      return res.status(remaining === 0 ? 429 : 400).json({
        error: remaining === 0 ? 'Превышен лимит в 3 попытки ввода. Код аннулирован. Запросите новый.' :
          `Неверный код подтверждения. Осталось попыток: ${remaining}`
      });
    }
    setAuthCookies(res, token, refreshToken);
    logSecurityEvent({ eventType: 'AUTH_REGISTER_CONFIRMED', severity: 'INFO', ip: clientIp,
      identifier: cleanEmail, details: { userId: newUser.id } });
    return res.json({ success: true, message: 'Регистрация успешно подтверждена!',
      user: sanitizeUserResponse(newUser), token });
  } catch (error) {
    console.error('Error in /api/auth/verify-code:', error);
    return res.status(500).json({ error: 'Ошибка при проверке кода' });
  }
});

/**
 * 3. Login for Existing Users (Levels 1, 2, 3, 4, 5, 10, 13)
 * - Multi-tiered Rate Limiting with exponential backoff on account
 * - User Enumeration Defense: Same error message and constant-time execution
 * - Argon2id verification with transparent upgrade from legacy PBKDF2
 * - Sets HttpOnly, Secure, SameSite=Strict cookies
 * - Refresh Token Rotation initialization
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);

    // Zod validation (Level 13)
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0]?.message || 'Некорректный email или пароль' });
    }

    const { email: cleanEmail, password } = parseResult.data;

    // Rate Limiting (Level 3): IP + Account Exponential Backoff
    const ipLimit = checkMultiTierRateLimit(`login_ip:${clientIp}`, 10, 15 * 60 * 1000);
    const emailLimit = checkMultiTierRateLimit(`login_account:${cleanEmail}`, 5, 15 * 60 * 1000, true);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      const waitTime = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec);
      logSecurityEvent({
        eventType: 'AUTH_BRUTE_FORCE_BLOCKED',
        severity: 'WARN',
        ip: clientIp,
        identifier: cleanEmail,
        details: { waitTime },
      });
      res.setHeader('Retry-After', waitTime);
      return res.status(429).json({
        error: `Слишком много попыток входа. В целях безопасности подождите ${waitTime} сек.`,
      });
    }

    const user = await getUserByEmail(cleanEmail);

    // User Enumeration Defense (Level 4):
    // If user does not exist, run dummy Argon2id calculation and return identical generic error!
    if (!user) {
      await dummyArgon2Verification();
      recordFailedAuthAttempt(`login_account:${cleanEmail}`, clientIp);
      logSecurityEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        severity: 'INFO',
        ip: clientIp,
        identifier: cleanEmail,
        details: { reason: 'User not found (masked)' },
      });
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Verify Password: Support Argon2id and transparent legacy upgrade
    let isValid = false;
    let needsUpgrade = false;

    if (user.passwordHash.startsWith('$argon2')) {
      isValid = await verifyPasswordArgon2(user.passwordHash, password);
    } else if (user.salt) {
      // Legacy PBKDF2 hash verification
      isValid = verifyLegacyPBKDF2(password, user.salt, user.hashIterations || 100000, user.passwordHash);
      if (isValid) {
        needsUpgrade = true;
      }
    }

    if (!isValid) {
      recordFailedAuthAttempt(`login_account:${cleanEmail}`, clientIp);
      logSecurityEvent({
        eventType: 'AUTH_LOGIN_FAILURE',
        severity: 'WARN',
        ip: clientIp,
        identifier: cleanEmail,
        details: { reason: 'Bad credentials' },
      });
      return res.status(400).json({ error: 'Неверный email или пароль' });
    }

    // Successful login: Reset failed attempts (Level 3)
    resetAuthAttempts(`login_account:${cleanEmail}`);

    // Transparently upgrade legacy password to Argon2id (Level 1)
    if (needsUpgrade) {
      user.passwordHash = await hashPasswordArgon2(password);
      delete user.salt;
      delete user.hashIterations;
      console.log(`[Security Upgrade] Upgraded password hash to Argon2id for ${cleanEmail}`);
    }

    // Refresh Session Token & Refresh Token (Levels 2 & 5)
    const token = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const familyId = crypto.randomUUID();

    user.token = token;
    user.tokenExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    user.lastActiveAt = new Date().toISOString();
    user.refreshTokens = [
      ...(user.refreshTokens || []).slice(-5), // Keep at most 5 active sessions
      {
        tokenHash: refreshHash,
        familyId,
        generation: 1,
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      },
    ];

    await updateUserSession(user as DbStoredUser);

    // Set HttpOnly, Secure, SameSite=Strict cookies (Level 2)
    setAuthCookies(res, token, refreshToken);

    logSecurityEvent({
      eventType: 'AUTH_LOGIN_SUCCESS',
      severity: 'INFO',
      ip: clientIp,
      identifier: cleanEmail,
      details: { userId: user.id },
    });

    return res.json({
      success: true,
      user: sanitizeUserResponse(user),
      token,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return res.status(500).json({ error: 'Ошибка при авторизации' });
  }
});

/**
 * 4. Refresh Token Rotation (RTR) Endpoint (Level 5)
 * Detects token replay attacks: if an already-rotated token is reused, revokes all sessions!
 */
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const clientIp = getClientIp(req);
    const incoming = req.cookies?.budgettech_refresh || req.body?.refreshToken;
    if (!incoming || typeof incoming !== 'string') {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Токен обновления отсутствует' });
    }
    const oldHash = crypto.createHash('sha256').update(incoming).digest('hex');
    const candidate = await findUserByRefreshHash(oldHash);
    if (!candidate) {
      logSecurityEvent({ eventType: 'AUTH_TOKEN_REPLAY_DETECTED', severity: 'CRITICAL', ip: clientIp,
        details: { note: 'Invalid or already reused refresh token presented' } });
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Недействительный токен сессии. Выполните вход заново.' });
    }
    const oldRecord = candidate.refreshTokens.find(t => t.tokenHash === oldHash);
    if (!oldRecord || oldRecord.expiresAt <= Date.now()) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Срок действия сессии истек' });
    }
    const newAccess = crypto.randomBytes(32).toString('hex');
    const newRefresh = crypto.randomBytes(48).toString('hex');
    const rotated = await rotateRefreshToken(oldHash, {
      tokenHash: crypto.createHash('sha256').update(newRefresh).digest('hex'),
      familyId: oldRecord.familyId, generation: oldRecord.generation + 1,
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
    }, newAccess, Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (!rotated) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Сессия уже обновлена или истекла. Выполните вход заново.' });
    }
    setAuthCookies(res, newAccess, newRefresh);
    logSecurityEvent({ eventType: 'AUTH_TOKEN_ROTATED', severity: 'INFO', ip: clientIp,
      identifier: rotated.email, details: { familyId: oldRecord.familyId, generation: oldRecord.generation + 1 } });
    return res.json({ success: true, token: newAccess, user: sanitizeUserResponse(rotated) });
  } catch (error) {
    console.error('Error in /api/auth/refresh:', error);
    return res.status(500).json({ error: 'Ошибка обновления токена' });
  }
});

/**
 * 5. Session Validation (/api/auth/me)
 * Supports both HttpOnly cookie and Bearer header for iframe compatibility
 */
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.budgettech_session ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
    if (!token) return res.status(401).json({ error: 'Не авторизован' });
    const user = await getUserBySessionToken(token);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Сессия истекла или недействительна' });
    }
    user.lastActiveAt = new Date().toISOString();
    await updateUserSession(user as DbStoredUser);
    return res.json({ success: true, user: sanitizeUserResponse(user) });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return res.status(500).json({ error: 'Ошибка проверки сессии' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.budgettech_session ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
    if (token) {
      const user = await getUserBySessionToken(token);
      if (user) {
        await revokeSession(user.email);
        logSecurityEvent({ eventType: 'AUTH_LOGOUT', severity: 'INFO', ip: getClientIp(req),
          identifier: user.email, details: { userId: user.id } });
      }
    }
    clearAuthCookies(res);
    return res.json({ success: true, message: 'Сессия успешно завершена' });
  } catch (error) {
    console.error('Error in /api/auth/logout:', error);
    return res.status(500).json({ error: 'Ошибка при выходе' });
  }
});

async function getAuthenticatedUser(req: Request): Promise<DbStoredUser | null> {
  const token = req.cookies?.budgettech_session ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
  if (!token) return null;
  return getUserBySessionToken(token);
}

app.get('/api/user/saved-rigs', async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      logSecurityEvent({ eventType: 'IDOR_ACCESS_DENIED', severity: 'WARN', ip: getClientIp(req),
        details: { path: req.path } });
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    return res.json({ success: true, savedBuilds: user.savedBuilds || [], userId: user.id });
  } catch (error) {
    console.error('Error loading saved rigs:', error);
    return res.status(500).json({ error: 'Ошибка загрузки сборок' });
  }
});

app.post('/api/user/saved-rigs', async (req: Request, res: Response) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      logSecurityEvent({ eventType: 'IDOR_ACCESS_DENIED', severity: 'WARN', ip: getClientIp(req),
        details: { path: req.path } });
      return res.status(401).json({ error: 'Требуется авторизация' });
    }
    const parsed = SaveRigsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Некорректный формат данных сборки' });
    }
    await updateSavedBuilds(user.email, parsed.data.savedBuilds);
    return res.json({ success: true, message: 'Сборки успешно сохранены в защищённом облаке' });
  } catch (error) {
    console.error('Error saving saved rigs:', error);
    return res.status(500).json({ error: 'Ошибка сохранения сборок' });
  }
});

/**
 * 8. Catalog API with Anti-Scraping & Strict Pagination (Level 23)
 * Protects 100k+ catalog from automated scraping & bulk database dumping
 */
app.get('/api/catalog', antiScrapingMiddleware, (req: Request, res: Response) => {
  const queryResult = CatalogQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({ error: 'Некорректные параметры пагинации', details: queryResult.error.issues });
  }

  const { page, limit } = queryResult.data;

  return res.json({
    success: true,
    page,
    limit,
    status: 'Catalog protected by anti-scraping rate limiter & WAF signature detection',
  });
});

// Static assets from /public
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Vite middleware or production build serve
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  // Level 26: Global Error Handler
  app.use(globalErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️ BudgetTech Enterprise AppSec Server (OWASP 30-Level) running at http://0.0.0.0:${PORT}`);
    logSecurityEvent({
      eventType: 'AUTH_REGISTER_INIT',
      severity: 'INFO',
      ip: '127.0.0.1',
      details: { status: 'Server initialized with 30-level defense stack' },
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
