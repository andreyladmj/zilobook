# Деплой Zilobook на VPS (Hetzner, Ubuntu 24.04)

Стек на одном сервере: Caddy (авто-HTTPS) → Next.js + Go API → Postgres. Всё в Docker Compose.
API и фронт живут на одном домене: Caddy шлёт `/api/*` в Go, остальное в Next.js — CORS-проблем нет.

## 0. Что уже должно быть
- VPS создан (Ubuntu 24.04, SSH-ключ добавлен, firewall Hetzner: 22/80/443)
- Домен zilobook.com в Cloudflare

## 1. DNS в Cloudflare
Создай A-записи на IP сервера. **На время первого запуска поставь серое облачко (DNS only)** —
Caddy должен сам выпустить сертификаты Let's Encrypt, прокси Cloudflare этому мешает:

| Имя | Тип | Значение | Proxy |
|---|---|---|---|
| `@` (zilobook.com) | A | IP сервера | DNS only |
| `www`, `nails`, `beauty`, `fit`, `trainer`, `auto`, `app` | A | IP сервера | DNS only |

Оранжевое облачко (proxy + CDN/DDoS-защита) можно включить позже, когда сертификаты выпущены
(тогда в Cloudflare SSL/TLS поставь режим **Full (strict)**).

## 2. Первичная настройка сервера (один раз)
```bash
ssh root@<IP>
# скопируй deploy/setup-server.sh на сервер (или склонируй репозиторий) и запусти:
bash setup-server.sh
```
Скрипт ставит Docker, ufw, fail2ban, автообновления безопасности и отключает вход по паролю.

## 3. Код на сервер
Вариант с GitHub (рекомендуется — нужен для автодеплоя):
```bash
git clone https://github.com/<you>/zilobook.git /opt/zilobook/app
```

## 4. Секреты
```bash
cd /opt/zilobook/app
cp deploy/.env.example .env
nano .env   # POSTGRES_PASSWORD и JWT_SECRET сгенерируй: openssl rand -hex 32
```

## 5. Запуск
```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps        # все сервисы должны быть healthy/running
docker compose -f docker-compose.prod.yml logs -f caddy   # смотри выпуск сертификатов
```
Проверка: открой https://zilobook.com и https://nails.zilobook.com — лендинги должны
отличаться (ниша по домену), регистрация/логин должны работать (это проверит и API, и БД).

## 6. Бэкапы (обязательно)
```bash
chmod +x deploy/backup-db.sh
(crontab -l 2>/dev/null; echo "30 3 * * * /opt/zilobook/app/deploy/backup-db.sh >> /var/log/zilobook-backup.log 2>&1") | crontab -
```
Дампы складываются в `/opt/zilobook/backups` (хранится 14 последних).
До публичного запуска настрой выгрузку дампов с сервера (rclone → Backblaze B2) и **проверь восстановление** одного дампа.

## 7. Автодеплой (GitHub Actions)
В настройках репозитория → Secrets and variables → Actions добавь:
- `DEPLOY_HOST` — IP сервера
- `DEPLOY_SSH_KEY` — приватный SSH-ключ (можно сгенерировать отдельный деплой-ключ:
  `ssh-keygen -t ed25519 -f deploy_key`, публичную часть добавь в `/root/.ssh/authorized_keys` на сервере)

После этого каждый push в `main` автоматически обновляет прод (`.github/workflows/deploy.yml`).

## Обновление вручную
```bash
cd /opt/zilobook/app && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

## Полезное
```bash
docker compose -f docker-compose.prod.yml logs -f backend   # логи API
docker compose -f docker-compose.prod.yml exec db psql -U zilobook zilobook   # консоль БД
docker compose -f docker-compose.prod.yml restart frontend  # рестарт одного сервиса
```

## Заметки по архитектуре
- `NEXT_PUBLIC_API_URL` зашивается в фронт на этапе сборки. В Docker-образе он равен `""`
  (same-origin). Для локальной разработки ничего не меняется (дефолт `http://localhost:8080`).
- Новый нишевый домен = правка в трёх местах: `frontend/src/lib/niches.ts`, `deploy/Caddyfile`,
  `CORS_ORIGIN` в `.env` (+ A-запись в Cloudflare).
- Бэкенд при `GIN_MODE=release` откажется стартовать с дефолтным `JWT_SECRET`.
- Postgres наружу не торчит (нет ports), доступен только контейнерам.
