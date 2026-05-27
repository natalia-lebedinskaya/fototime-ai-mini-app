# API Contract

## Overview

This document describes the current API contract for the Fototime AI Telegram Mini App MVP.

The current implementation uses mock event configuration and mock generation result.

## Base URLs

### Local

```text
http://localhost:3000
```

### Production

```text
https://fototime-ai-mini-app.onrender.com
```

---

## GET /api/health

### Description

Checks backend availability.

### Request

No request body required.

### Successful Response

Status code: `200`

```json
{
  "status": "ok",
  "service": "fototime-ai-mini-app"
}
```

---

## GET /api/event-config

### Description

Returns mock event configuration for the current MVP.

Frontend uses this endpoint to render:

- active event data;
- available participants;
- available styles;
- style preview URLs;
- participant-to-style relation.

### Request

No request body required.

### Successful Response

Status code: `200`

```json
{
  "eventId": "test-event-25-05-26",
  "botId": "fototime323-bot",
  "eventName": "Тестовое мероприятие FOTOTIME323",
  "status": "active",
  "language": "ru",
  "resultOrientation": "portrait",
  "participants": [
    {
      "id": "male",
      "name": "Мужчина",
      "isActive": true
    }
  ],
  "styles": [
    {
      "id": "ns-astral",
      "name": "NS Астрал",
      "participantType": "male",
      "previewUrl": "/assets/styles/ns-astral.svg",
      "price": 0.34,
      "isAvailable": true
    }
  ]
}
```

### Error Response

Status code: `404`

```json
{
  "code": "EVENT_NOT_AVAILABLE",
  "message": "Мероприятие недоступно"
}
```

---

## POST /api/generate

### Description

Starts mock image generation based on selected participant, selected style and uploaded photo.

At the current MVP stage, the endpoint returns a mock result image.

### Content-Type

```text
multipart/form-data
```

### Request Fields

| Field | Type | Required | Description |
|---|---|---|---|
| participantId | string | yes | Selected participant ID |
| styleId | string | yes | Selected style ID |
| photo | file | yes | Uploaded user photo |

### Supported File Formats

- JPG;
- JPEG;
- PNG.

### File Size Limit

```text
10 MB
```

### Successful Response

Status code: `200`

```json
{
  "status": "success",
  "message": "Изображение успешно сгенерировано",
  "resultUrl": "/assets/mock-result.svg",
  "request": {
    "eventId": "test-event-25-05-26",
    "participantId": "male",
    "styleId": "ns-astral",
    "originalFileName": "photo.jpg"
  }
}
```

---

## POST /api/generate — Error Responses

### Participant Required

Status code: `400`

```json
{
  "code": "PARTICIPANT_REQUIRED",
  "message": "Не выбран участник"
}
```

### Style Required

Status code: `400`

```json
{
  "code": "STYLE_REQUIRED",
  "message": "Не выбран стиль"
}
```

### Photo Required

Status code: `400`

```json
{
  "code": "PHOTO_REQUIRED",
  "message": "Не загружено фото"
}
```

### Invalid Participant

Status code: `400`

```json
{
  "code": "INVALID_PARTICIPANT",
  "message": "Выбранный участник недоступен"
}
```

### Invalid Style

Status code: `400`

```json
{
  "code": "INVALID_STYLE",
  "message": "Выбранный стиль недоступен"
}
```

### Style and Participant Mismatch

Status code: `400`

```json
{
  "code": "STYLE_PARTICIPANT_MISMATCH",
  "message": "Выбранный стиль недоступен для этого участника"
}
```

### Invalid File Format

Status code: `400`

```json
{
  "code": "INVALID_FILE_FORMAT",
  "message": "Поддерживаются только изображения JPG, JPEG и PNG"
}
```

### File Too Large

Status code: `400`

```json
{
  "code": "FILE_TOO_LARGE",
  "message": "Размер файла не должен превышать 10 MB"
}
```

### Internal Server Error

Status code: `500`

```json
{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Что-то пошло не так. Попробуйте ещё раз"
}
```

---

## QA Notes

Current API checks are stored in:

```text
tests/api/
```

The current MVP API coverage includes:

- backend health-check;
- event configuration response;
- generation validation without uploaded photo.

Full positive generation request with uploaded file is checked manually.
