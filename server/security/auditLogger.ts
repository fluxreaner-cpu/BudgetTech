import fs from 'fs';
import path from 'path';

// --- Audit Logging Engine (OWASP ASVS Security Logging) ---

const LOGS_DIR = path.resolve(process.cwd(), 'data', 'logs');
const AUDIT_LOG_FILE = path.join(LOGS_DIR, 'audit.log');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export type SecurityEventType = 
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILURE'
  | 'AUTH_REGISTER_INIT'
  | 'AUTH_REGISTER_CONFIRMED'
  | 'AUTH_LOGOUT'
  | 'AUTH_TOKEN_ROTATED'
  | 'AUTH_TOKEN_REPLAY_DETECTED'
  | 'AUTH_BRUTE_FORCE_BLOCKED'
  | 'AUTH_PASSWORD_COMPROMISED'
  | 'AUTH_OTP_REQUEST'
  | 'AUTH_OTP_FAILURE'
  | 'AUTH_OTP_EXHAUSTED'
  | 'CSRF_BLOCKED'
  | 'CORS_VIOLATION'
  | 'SSRF_BLOCKED'
  | 'PATH_TRAVERSAL_BLOCKED'
  | 'IDOR_ACCESS_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ANTI_SCRAPING_TRIGGER'
  | 'E2EE_PAYLOAD_DECRYPTED'
  | 'E2EE_DECRYPT_FAILURE';

export interface AuditLogEntry {
  timestamp: string;
  eventType: SecurityEventType;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  ip: string;
  userAgent?: string;
  identifier?: string; // email or userId (sanitized)
  details: Record<string, unknown>;
}

export function logSecurityEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const logLine = JSON.stringify(fullEntry);

  // Write to console with structured tag
  if (entry.severity === 'CRITICAL') {
    console.error(`[AUDIT_ALERT][CRITICAL] ${entry.eventType} | IP: ${entry.ip} | User: ${entry.identifier || 'anon'}`, entry.details);
  } else if (entry.severity === 'WARN') {
    console.warn(`[AUDIT_WARN] ${entry.eventType} | IP: ${entry.ip} | User: ${entry.identifier || 'anon'}`, entry.details);
  } else {
    console.log(`[AUDIT_INFO] ${entry.eventType} | IP: ${entry.ip}`);
  }

  // Persistent append to audit.log
  try {
    fs.appendFileSync(AUDIT_LOG_FILE, logLine + '\n', 'utf-8');
  } catch (err) {
    console.error('[Audit Logger Error] Failed writing to audit.log:', err);
  }
}
