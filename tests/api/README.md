# API Checks

This folder contains API checks for the Fototime AI MVP.

The collection is prepared for Bruno and covers the current backend endpoints.

## Environments

Available environments:

- `local` — `http://localhost:3000`
- `production` — Render deployment URL

## Covered Endpoints

- `GET /api/health`
- `GET /api/event-config`
- `POST /api/generate`

## Current Checks

- backend availability;
- event configuration structure;
- generation validation without uploaded photo.

## How to Run

1. Open Bruno.
2. Open collection from `tests/api/fototime-ai`.
3. Select environment:
   - `local` for local testing;
   - `production` for deployed Render service.
4. Run requests manually.

## Notes

The current generation endpoint requires multipart form data with an uploaded image.
Full positive generation request with file upload should be checked manually until automated file fixtures are added.
