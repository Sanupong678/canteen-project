# OAuth Production Checklist

Use this checklist before enabling Google OAuth on production.

## A) Environment values (must be exact)

- [ ] `backend` has production env from `backend/.env.production.organization.example`
- [ ] `frontend` has production env from `frontend/.env.production.organization.example`
- [ ] `FRONTEND_URL=https://fms-asset.mfu.ac.th`
- [ ] `API_BASE_URL=https://fms-asset.mfu.ac.th`
- [ ] `GOOGLE_REDIRECT_URI=https://fms-asset.mfu.ac.th/api/auth/google/callback`
- [ ] `GOOGLE_CLIENT_ID` in backend and frontend are from the same Google OAuth app
- [ ] `CORS_ORIGINS` includes `https://fms-asset.mfu.ac.th`

## B) Google Cloud Console config

- [ ] OAuth consent screen is published/allowed for real users
- [ ] Authorized JavaScript origins includes:
  - [ ] `https://fms-asset.mfu.ac.th`
- [ ] Authorized redirect URIs includes:
  - [ ] `https://fms-asset.mfu.ac.th/api/auth/google/callback`
- [ ] If domain restrictions are required by organization policy, verify user account is allowed

## C) Server + reverse proxy

- [ ] HTTPS certificate is valid (no browser warning)
- [ ] Reverse proxy forwards `/api/*` to backend correctly
- [ ] Backend health check works: `GET https://fms-asset.mfu.ac.th/health`
- [ ] Frontend opens normally at `https://fms-asset.mfu.ac.th`
- [ ] Server clock/timezone is correct (OAuth/JWT can fail with wrong server time)

## D) Pre-login technical tests

- [ ] Open browser devtools network tab
- [ ] Open `https://fms-asset.mfu.ac.th/login`
- [ ] Click Google login button
- [ ] Confirm request redirects to `accounts.google.com` (no immediate 4xx from your server)
- [ ] After Google sign-in, callback hits:
  - [ ] `https://fms-asset.mfu.ac.th/api/auth/google/callback?code=...`

## E) Callback and session tests

- [ ] Callback does not return `error=config_missing`
- [ ] Callback does not return `error=missing_code`
- [ ] Callback does not return `redirect_uri_mismatch`
- [ ] User is redirected back to app and logged in
- [ ] Protected endpoint works with returned token/session

## F) Negative tests (must fail safely)

- [ ] Remove/alter `GOOGLE_REDIRECT_URI` on test env => login fails with clear error
- [ ] Use disallowed origin => request blocked by CORS
- [ ] Expired/invalid token => user is redirected to login without server crash

## G) Post-go-live checks

- [ ] Try login from at least 2 real user accounts
- [ ] Check backend logs for OAuth errors for 15-30 minutes
- [ ] Confirm no CORS errors in browser console
- [ ] Create rollback note: previous env and deploy version

## Common failure mapping

- `redirect_uri_mismatch` => Google Console redirect URI does not exactly match `GOOGLE_REDIRECT_URI`
- `config_missing` => one of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL` is missing on server
- CORS error in callback flow => `CORS_ORIGINS` or proxy route is wrong
