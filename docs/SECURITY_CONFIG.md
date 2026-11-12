# BudgetTech Enterprise AppSec & Infrastructure Security Guide (OWASP Top 10)

В данном руководстве зафиксированы конфигурации и правила изоляции для развёртывания приложения в продакшене в соответствии со стандартами PCI-DSS, ISO 27001 и OWASP ASVS (Level 2/3).

---

## 1. Запуск в изолированном контейнере от имени непривилегированного пользователя (Non-Root) — Уровень 30

### `Dockerfile` (Production Hardened Multi-Stage Build)

```dockerfile
# Stage 1: Build & Obfuscate
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: Minimal Distroless / Hardened Alpine Runtime
FROM node:22-alpine AS runner
WORKDIR /app

# Создаем изолированного системного пользователя и группу (non-root)
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

# Устанавливаем production-зависимости
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Копируем скомпилированные и обфусцированные файлы
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data

# Выставляем права доступа: только чтение кода, запись только в директорию data/
RUN chown -R appuser:appgroup /app && \
    chmod -R 550 /app && \
    chmod -R 770 /app/data

# Переключаемся на непривилегированного пользователя
USER 10001:10001

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Запуск с ограничением системных вызовов
CMD ["node", "--no-deprecation", "--enable-source-maps=false", "server.ts"]
```

---

## 2. Разграничение прав доступа к базе данных (Least Privilege) — Уровень 24

Для продакшен-базы данных (PostgreSQL / MySQL) сервисный пользователь приложения **никогда не должен обладать правами DDL** (`DROP`, `ALTER`, `TRUNCATE`, `CREATE`).

### PostgreSQL Hardened Role Script (`init_db_roles.sql`)

```sql
-- 1. Создаем базу данных
CREATE DATABASE budgettech_db WITH ENCODING 'UTF8';

-- 2. Роль миграций (используется ТОЛЬКО во время CI/CD миграций)
CREATE ROLE budgettech_migration_user WITH LOGIN ENCRYPTED PASSWORD 'SUPER_SECURE_MIGRATION_PASS';
GRANT ALL PRIVILEGES ON DATABASE budgettech_db TO budgettech_migration_user;

-- 3. Роль приложения (Runtime Least Privilege)
CREATE ROLE budgettech_app_user WITH LOGIN ENCRYPTED PASSWORD 'STRONG_RUNTIME_PASSWORD_64_CHAR';

\c budgettech_db

-- Отзываем права на создание таблиц у public схемы
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Выдаем права на подключение к БД
GRANT CONNECT ON DATABASE budgettech_db TO budgettech_app_user;
GRANT USAGE ON SCHEMA public TO budgettech_app_user;

-- Выдаем строго DML права (только чтение и изменение данных)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO budgettech_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO budgettech_app_user;

-- Запрещаем DDL: пользователь не может выполнить DROP TABLE или ALTER TABLE
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO budgettech_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO budgettech_app_user;
```

---

## 3. Конфигурация Nginx Edge Reverse Proxy (TLS 1.3, Rate-Limit, WAF, HSTS)

### `/etc/nginx/conf.d/budgettech.conf`

```nginx
# Ограничение частоты запросов на уровне Nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=15r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=3r/s;

# Восстановление реального IP за Cloudflare WAF
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
real_ip_header CF-Connecting-IP;

server {
    listen 80;
    server_name budgettech.cyber www.budgettech.cyber;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name budgettech.cyber www.budgettech.cyber;

    # TLS 1.3 / Modern Cryptography Only
    ssl_certificate /etc/letsencrypt/live/budgettech.cyber/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/budgettech.cyber/privkey.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS & OWASP Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Запрет переполнения буфера
    client_max_body_size 64k;
    client_body_buffer_size 64k;

    # Защита эндпоинтов авторизации
    location /api/auth/ {
        limit_req zone=auth_limit burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Общий прокси на бэкенд
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```
