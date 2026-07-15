# Deployment

## Prerequisites

- Node.js 20 or newer;
- an HTTPS hosting environment with persistent disk for operational media/JSON;
- a Supabase project for persistent identities;
- an external image-generation API compatible with the adapter contract;
- long, unique session and operator secrets.

## 1. Install and verify

```bash
npm ci
npm run verify
```

## 2. Configure the identity database

1. Create a Supabase project.
2. Run `supabase/migrations/20260714_001_identity_profiles.sql` in the SQL editor or migration pipeline.
3. Confirm that `fot_profiles`, `fot_identities`, `fot_credentials`, and `fot_devices` exist.
4. Confirm RLS is enabled and browser roles have no table grants.
5. Set `SUPABASE_URL` and the server secret key in the hosting environment.
6. Set `FOTOTIME_SESSION_SECRET` to a random value of at least 32 characters.

Never expose the Supabase secret key as a public/publishable browser variable.

## 3. Configure the image adapter

Set:

- `IMAGE_PROVIDER_BASE_URL` — API base without a trailing slash;
- `IMAGE_PROVIDER_API_KEY` — server credential;
- `IMAGE_PROVIDER_POLL_INTERVAL_MS` — default `3000`;
- `IMAGE_PROVIDER_MAX_ATTEMPTS` — default `40`;
- `IMAGE_PROVIDER_REQUEST_TIMEOUT_MS` — default `30000`;
- `IMAGE_PROVIDER_DRY_RUN` — `false` in production.

The adapter expects public catalog at `/public/styles`, job submission at `/async/submit`, and job status at `/async/status/:jobId`. If the upstream contract changes, update only `imageProviderService.js` and its tests.

## 4. Configure operator access

Set at least one control:

- `ADMIN_PIN` (one or more comma-separated long values);
- `ADMIN_USER_IDS`;
- `ADMIN_USERNAMES`;
- `ADMIN_USER_EMAILS`.

Optional operator notifications use `ADMIN_NOTIFICATION_BOT_TOKEN` and `ADMIN_NOTIFICATION_CHAT_ID`.

## 5. Configure runtime

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=<provided by hosting platform>
CORS_ORIGINS=https://your-public-origin.example
ALLOW_LOCAL_AUTH=false
```

Mount persistent storage for `data/` and `public/uploads|results/`. Without persistent disk, identity remains in Supabase but balances, operational history, and generated media may be lost on a container restart.

## 6. Release checks

1. `GET /api/health` returns `1.1.0`.
2. Guest/browser session and password login work.
3. Style catalog loads through the backend; browser network logs show no direct external catalog request.
4. Complete one valid generation and verify result/history/balance.
5. Force one failed generation and verify balance is unchanged.
6. Verify operator PIN, feedback, receipt, audit download, and scoped cleanup.
7. Verify RU, EN, and VI at mobile width.
8. Confirm no production secret appears in page source, API responses, logs, repository tree, or Git history.

## Rollback

Keep the prior application artifact and database migration record. Application rollback is safe because the `1.1.0` migration is additive. Do not roll back by deleting identity tables. If the adapter fails after deploy, restore the previous application artifact or disable generation while keeping account/state routes available.
