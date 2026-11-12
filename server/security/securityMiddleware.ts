import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logSecurityEvent } from './auditLogger';
import { getClientIp } from './rateLimiter';

/**
 * 1. HTTPS / HSTS Enforcer
 */
export function httpsEnforcer(req: Request, res: Response, next: NextFunction) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  
  // Set HSTS header only for verified secure connections to avoid breaking localhost or dev proxies
  if (isHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}

/** Parse an exact origin allowlist; never trust broad provider-domain suffixes. */
function getAllowedOrigins(): Set<string> {
  const configured = [
    process.env.APP_URL || '',
    ...(process.env.ALLOWED_ORIGINS || '').split(','),
  ];
  const allowed = new Set<string>();
  for (const value of configured) {
    const candidate = value.trim();
    if (!candidate) continue;
    try {
      const parsed = new URL(candidate);
      if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
          parsed.origin === candidate.replace(/\\/$/, '')) {
        allowed.add(parsed.origin);
      }
    } catch {
      // Ignore malformed configuration rather than broadening the allowlist.
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:3000');
    allowed.add('http://127.0.0.1:5173');
  }
  return allowed;
}

/**
 * 2. Content Security Policy & Browser Defense Headers
 */
export function browserSecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  const frameOrigins = [...getAllowedOrigins()].filter(origin => origin !== process.env.APP_URL);
  const frameAncestors = ["'self'", ...frameOrigins].join(' ');
  const cspDirectives = [
    "default-src 'self' 'unsafe-inline' data: blob: https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:",
    "style-src 'self' 'unsafe-inline' https: fonts.googleapis.com",
    "font-src 'self' https: data: fonts.gstatic.com",
    "img-src 'self' data: https: http: blob:",
    "connect-src 'self' data: blob: https: http: wss: ws:",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  next();
}

/**
 * 3. Exact CORS origin validation
 */
export function corsValidator(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (!origin) return next();

  let normalizedOrigin: string;
  try {
    normalizedOrigin = new URL(origin).origin;
    if (normalizedOrigin !== origin) throw new Error('Non-canonical origin');
  } catch {
    return res.status(403).json({ error: 'CORS Policy: Invalid origin', code: 'ERR_CORS_DENIED' });
  }

  if (!getAllowedOrigins().has(normalizedOrigin)) {
    logSecurityEvent({
      eventType: 'CORS_VIOLATION',
      severity: 'WARN',
      ip: getClientIp(req),
      details: { rejectedOrigin: normalizedOrigin, method: req.method, path: req.path },
    });
    return res.status(403).json({ error: 'CORS Policy: Origin not allowed', code: 'ERR_CORS_DENIED' });
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

/**
 * 4. Anti-CSRF Guard for Mutating Requests
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method)) return next();

  const origin = req.headers.origin;
  if (origin) {
    let normalizedOrigin: string;
    try {
      normalizedOrigin = new URL(origin).origin;
      if (normalizedOrigin !== origin || !getAllowedOrigins().has(normalizedOrigin)) {
        throw new Error('Origin not allowed');
      }
    } catch {
      logSecurityEvent({
        eventType: 'CSRF_BLOCKED',
        severity: 'WARN',
        ip: getClientIp(req),
        details: { rejectedOrigin: origin, path: req.path },
      });
      return res.status(403).json({ error: 'CSRF validation failed: Origin not allowed', code: 'ERR_CSRF_FAILED' });
    }
  } else if (req.headers['sec-fetch-site'] === 'cross-site') {
    return res.status(403).json({ error: 'CSRF validation failed: Cross-site request', code: 'ERR_CSRF_FAILED' });
  }

  next();
}

/**
 * 5. Anti-SSRF (Server-Side Request Forgery) IP Validator (Level 15)
 */
export function isPrivateOrLoopbackIp(ipOrHost: string): boolean {
  const clean = ipOrHost.toLowerCase().trim();

  // Localhost names
  if (clean === 'localhost' || clean === '127.0.0.1' || clean === '::1' || clean === '0.0.0.0') {
    return true;
  }

  // Cloud metadata endpoint (AWS / GCP / Azure: 169.254.169.254)
  if (clean.startsWith('169.254.')) {
    return true;
  }

  // Private IPv4 ranges:
  // 10.0.0.0/8
  if (/^10\./.test(clean)) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  // 192.168.0.0/16
  if (/^192\.168\./.test(clean)) return true;
  // 0.0.0.0/8
  if (/^0\./.test(clean)) return true;

  // Private IPv6 ranges (fc00::/7, fe80::/10)
  if (/^(fc|fd|fe8|fe9|fea|feb)/.test(clean)) return true;

  return false;
}

/**
 * 6. Anti-Path Traversal File Resolver (Level 16)
 */
export function safeResolvePath(baseDir: string, userPath: string): string | null {
  // Reject null bytes
  if (userPath.includes('\0')) {
    return null;
  }

  // Reject explicit traversal tokens
  if (userPath.includes('..')) {
    return null;
  }

  const resolved = path.resolve(baseDir, userPath);
  const normalizedBase = path.resolve(baseDir);

  // Must strictly be a child of baseDir
  if (!resolved.startsWith(normalizedBase)) {
    return null;
  }

  return resolved;
}

/**
 * 7. Production Global Error Handler (Level 26)
 * Prevents Stack Trace and Database detail leaks to the client
 */
export function globalErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const ip = getClientIp(req);
  console.error('[Unhandled Internal Error]', err);

  logSecurityEvent({
    eventType: 'IDOR_ACCESS_DENIED', // generic security log
    severity: 'CRITICAL',
    ip,
    details: { message: err?.message, path: req.path, method: req.method },
  });

  return res.status(500).json({
    error: 'Внутренняя ошибка сервиса безопасности. Информация сохранена в журнале аудита.',
    code: 'SEC_ERR_INTERNAL',
  });
}
