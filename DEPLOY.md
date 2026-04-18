# Deployment Guide

## 1) Prepare environment files

- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env`
- Fill in real values (especially secrets and domain URLs)

Important:
- `FRONTEND_URL` must be your real frontend URL, e.g. `https://app.example.com`
- `API_BASE_URL` must be your real backend URL, e.g. `https://api.example.com`
- `CORS_ORIGINS` is comma-separated allowed origins
- For organization production OAuth, use `backend/.env.production.organization.example` as template and set values on the server (not in local `.env`)

## 2) Docker deployment

From project root:

```bash
docker compose build
docker compose up -d
```

## 3) Verify

- Backend health check: `GET /health`
- Frontend opens without CORS errors
- Login works
- Upload image works and image URL loads
- Run OAuth go-live checks in `OAUTH_PRODUCTION_CHECKLIST.md`

## 4) Production recommendations

- Put Nginx/Traefik in front of frontend and backend
- Enable HTTPS with valid TLS certificates
- Mount persistent volume for `/app/uploads`
- Rotate all credentials currently present in old `.env` files before public deployment

## 5) Backup uploads folder (recommended)

This project now includes backup scripts for local upload storage.

Run backup manually:

```bash
cd backend
npm run backup:uploads
```

Restore from a backup folder:

```bash
cd backend
npm run restore:uploads -- uploads-2026-04-18T08-00-00-000Z --clean
```

Notes:
- Backups are stored at `BACKUP_DIR` (default `/app/backups`)
- Old backups are auto-pruned by `BACKUP_RETENTION_DAYS`
- In Docker Compose, backups are bind-mounted to `./backups/backend`

Suggested automation:
- Linux cron (daily 02:00): `0 2 * * * cd /path/to/canteen-project/backend && npm run backup:uploads >> /var/log/canteen-backup.log 2>&1`
- Windows Task Scheduler: run `npm run backup:uploads` daily in `backend` folder
