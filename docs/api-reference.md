# API reference

## Conventions

Base URL: same origin as the client.

Protected personal routes require:

```http
X-FOT-Session: <signed-session-token>
```

Operator routes additionally accept the configured PIN in `X-Admin-Pin`, request body `pin`, or query parameter `pin`. Headers are preferred.

Success responses include `ok: true` for product routes. Errors use an HTTP status, stable `code` where applicable, and a user-safe `message`.

## Platform endpoints

### `GET /api/health`

```json
{ "status": "ok", "service": "fot-ai", "version": "1.1.0" }
```

### `GET /api/version`

Returns version, short deployment commit, and environment. No secret or provider details are exposed.

### `POST /api/admin-pin/verify`

Request:

```json
{ "pin": "configured-value" }
```

Responses: `200` valid, `403` invalid, `429` throttled, `503` not configured.

## Identity

### `POST /api/fototime/identity/session`

Creates or resumes a browser identity. When verified Telegram `initData` is supplied, the backend may create a Telegram-linked session.

```json
{
  "id": "web_device_identifier",
  "username": "guest-name",
  "name": "Guest name",
  "deviceName": "Safari on iPhone"
}
```

Response:

```json
{
  "ok": true,
  "profile": {
    "id": "web_device_identifier",
    "username": "guest-name",
    "authProvider": "web",
    "linkedProviders": ["browser"]
  },
  "sessionToken": "signed-token"
}
```

### `POST /api/fototime/identity/register`

```json
{ "login": "natalia", "password": "at-least-10-characters", "displayName": "Natalia" }
```

Returns `201` with public profile and session. Duplicate/invalid input returns `400`.

### `POST /api/fototime/identity/login`

Same login/password body. Returns `200` or generic `401`.

## Product state

### `GET /api/fototime/state`

Protected. Returns public profile, balance, generation cost, styles, history, active generations, and notifications for the resolved identity.

### `GET /api/fototime/styles`

Returns normalized catalog items:

```json
{
  "ok": true,
  "styles": [
    {
      "id": "1001",
      "title": "Atlantis",
      "provider": "SDXL",
      "preview": "https://cdn.example.test/style.jpg",
      "mode": "sdxl"
    }
  ]
}
```

`provider` is a model/category label retained for UI filtering, not a commercial supplier identifier.

## Generation

### `POST /api/fototime/generate`

Protected, `multipart/form-data`.

| Field         | Required | Description                                             |
| ------------- | -------- | ------------------------------------------------------- |
| `photo`       | yes      | One JPG, PNG, or WebP image, maximum 10 MB.             |
| `participant` | yes      | `male`, `female`, `couple`, `boy`, `girl`, or `family`. |
| `styleId`     | yes      | Selected catalog identifier.                            |
| `styleTitle`  | yes      | Display title used for audit/history.                   |
| `provider`    | yes      | Model/category label used for mode resolution.          |
| `styleMode`   | no       | Explicit mode override.                                 |

Success:

```json
{
  "ok": true,
  "generation": {
    "id": "generation_...",
    "styleId": "1001",
    "styleTitle": "Atlantis",
    "participant": "female",
    "sourceUrl": "/api/fototime/file/uploads/...",
    "resultUrl": "/api/fototime/file/results/...",
    "cost": 40,
    "balanceBefore": 50,
    "balanceAfter": 10,
    "status": "success",
    "providerJobId": "external-job-id",
    "processingTimeMs": 12345
  },
  "balance": 10
}
```

Common errors:

| Status | Code                            | Meaning                               |
| ------ | ------------------------------- | ------------------------------------- |
| 400    | `NO_FILE` / `NO_STYLE`          | Required selection is missing.        |
| 400    | `INVALID_IMAGE_TYPE`            | Unsupported upload type.              |
| 402    | `NOT_ENOUGH_CREDITS`            | Balance is below the generation cost. |
| 413    | `FILE_TOO_LARGE`                | Upload exceeds 10 MB.                 |
| 502    | `IMAGE_PROVIDER_REQUEST_FAILED` | External job/request failed.          |
| 502    | `INVALID_GENERATION_RESULT`     | Result failed integrity checks.       |
| 503    | `IMAGE_PROVIDER_NOT_CONFIGURED` | Server adapter settings are absent.   |
| 504    | `IMAGE_PROVIDER_TIMEOUT`        | Request or polling deadline expired.  |

Credits remain unchanged for every error above.

## History, profile, and feedback

- `POST /api/fototime/generations/delete` — delete one or multiple owned history items and files.
- `POST /api/fototime/profile/update` — update allowed avatar/profile preferences.
- `POST /api/fototime/balance/refresh` — return current balance and notifications.
- `POST /api/fototime/notifications/read` — mark account notifications read.
- `POST /api/fototime/feedback` — submit feedback or payment request with optional screenshot.
- `GET /api/fototime/file/:bucket/:name` — serve a stored upload/result using normalized file names.

## Operator routes

- `GET /api/fototime/admin` — consolidated users, feedback, generations, active jobs, sessions, and stability.
- `POST /api/fototime/balance/set` — set a user balance and create a notification.
- `POST /api/fototime/receipt/send` — attach a receipt to a user notification.
- `POST /api/fototime/admin/read-all` — mark operator items read.
- `POST /api/fototime/admin/audit-clear` — clear audit and active-job data only.
- `POST /api/fototime/admin/bulk-delete` — scoped cleanup for users, generations, feedback, audit, receipts, or active jobs.
- `GET /api/fototime/admin/audit-download` — export audit information.

Operator responses never include password hashes or database credentials.
