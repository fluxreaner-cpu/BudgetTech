import { Request, Response, NextFunction } from 'express';
import { getClientIp, checkMultiTierRateLimit } from './rateLimiter';
import { logSecurityEvent } from './auditLogger';

// Known automated scraper signatures
const BOT_USER_AGENTS = [
  /python-requests/i,
  /scrapy/i,
  /aiohttp/i,
  /httpclient/i,
  /java\//i,
  /libwww-perl/i,
  /mechanize/i,
  /go-http-client/i,
  /urllib/i,
  /phantomjs/i,
  /nightmare/i,
];

/**
 * Anti-Scraping Middleware:
 * 1. Blocks automated scrapers with known bot User-Agent strings
 * 2. Enforces strict rate limits on catalog data crawling (max 60 queries/min per IP)
 * 3. Prevents bulk database dumping
 */
export function antiScrapingMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'] || '';
  const ip = getClientIp(req);

  // 1. Check for blank or bot User-Agent
  if (!userAgent.trim()) {
    logSecurityEvent({
      eventType: 'ANTI_SCRAPING_TRIGGER',
      severity: 'WARN',
      ip,
      details: { reason: 'Empty User-Agent header blocked' },
    });
    return res.status(403).json({
      error: 'Доступ заблокирован: отсутствуют обязательные заголовки клиента',
      code: 'ERR_BOT_DETECTED',
    });
  }

  for (const botRegex of BOT_USER_AGENTS) {
    if (botRegex.test(userAgent)) {
      logSecurityEvent({
        eventType: 'ANTI_SCRAPING_TRIGGER',
        severity: 'WARN',
        ip,
        userAgent,
        details: { signature: botRegex.toString() },
      });
      return res.status(403).json({
        error: 'Автоматический парсинг каталога запрещен правилами сервиса',
        code: 'ERR_SCRAPER_BLOCKED',
      });
    }
  }

  // 2. Rate limit catalog requests: 80 requests per 60 seconds per IP
  const rateResult = checkMultiTierRateLimit(`catalog_scrape:${ip}`, 80, 60000, false);
  if (!rateResult.allowed) {
    logSecurityEvent({
      eventType: 'ANTI_SCRAPING_TRIGGER',
      severity: 'WARN',
      ip,
      userAgent,
      details: { reason: 'Catalog rate limit exceeded', retryAfter: rateResult.retryAfterSec },
    });
    res.setHeader('Retry-After', rateResult.retryAfterSec);
    return res.status(429).json({
      error: `Превышена частота обращений к каталогу. Повторите через ${rateResult.retryAfterSec} сек.`,
      code: 'ERR_TOO_MANY_REQUESTS',
    });
  }

  next();
}
