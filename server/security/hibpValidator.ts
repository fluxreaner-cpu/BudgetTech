import crypto from 'crypto';

// Top common leaked/weak passwords list (OWASP Top Weak Passwords sample)
const COMMON_WEAK_PASSWORDS = new Set([
  '123456', '12345678', '123456789', '12345', '1234', '111111', '000000',
  'password', 'password1', 'password123', 'qwerty', 'qwerty123', 'admin',
  'admin123', 'welcome', 'welcome1', 'letmein', 'monkey', 'dragon', 'football',
  'master', 'iloveyou', 'sunshine', 'princess', 'solo', 'starwars', 'killer',
  'trustno1', 'shadow', 'superman', 'michael', 'jordan', 'harley', 'rangers',
  'computer', 'security', 'cyberpunk', 'budgettech', '123123', '654321',
  'qazwsx', 'wsxedc', 'asdfgh', 'zxcvbn', 'root', 'guest', 'pass1234'
]);

export interface PasswordCheckResult {
  isCompromised: boolean;
  reason?: string;
}

/**
 * Checks if a password has been compromised in data breaches.
 * Uses k-Anonymity via Have I Been Pwned API with graceful local fallback.
 */
export async function checkPasswordBreached(password: string): Promise<PasswordCheckResult> {
  const cleanPass = password.trim();

  // 1. Length and complexity baseline
  if (cleanPass.length < 8) {
    return {
      isCompromised: true,
      reason: 'Пароль должен содержать не менее 8 символов',
    };
  }

  // 2. Check local common weak passwords blacklist
  if (COMMON_WEAK_PASSWORDS.has(cleanPass.toLowerCase())) {
    return {
      isCompromised: true,
      reason: 'Этот пароль входит в топ самых частых уязвимых паролей. Пожалуйста, используйте более сложную комбинацию.',
    };
  }

  // 3. Simple repeating character check (e.g. aaaaaaaa, 11111111)
  if (/^(.)\1+$/.test(cleanPass)) {
    return {
      isCompromised: true,
      reason: 'Пароль не должен состоять из повторяющегося одного символа',
    };
  }

  // 4. Have I Been Pwned k-Anonymity Query
  try {
    const sha1Hash = crypto.createHash('sha1').update(cleanPass).digest('hex').toUpperCase();
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800); // 1.8s timeout

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'BudgetTech-AppSec-Validator/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const [hashSuffix, countStr] = line.split(':');
        if (hashSuffix && hashSuffix.trim() === suffix) {
          const count = parseInt(countStr || '0', 10);
          if (count > 0) {
            return {
              isCompromised: true,
              reason: `Этот пароль обнаружен в глобальных утечках данных (${count.toLocaleString()} раз). В целях безопасности аккаунта выберите другой пароль.`,
            };
          }
        }
      }
    }
  } catch {
    // If HIBP is blocked, offline, or times out, local checks passed successfully
  }

  return { isCompromised: false };
}
