# Changelog

All notable changes are documented here. The project follows semantic versioning.

## 1.1.0 — 2026-07-15

### Added

- Supabase schema for profiles, linked identities, password credentials, and devices.
- Login/password accounts with signed, expiring server sessions.
- English and Vietnamese interface support alongside Russian.
- Operator bulk cleanup, receipt handling, notifications, and generation audit data.
- Four visual themes, catalog search, model filters, grid/carousel views, and responsive polish.
- Automated unit and API checks plus a documented release gate.
- Fourteen-day retention for generated media, feedback attachments, receipts, and audit sessions.

### Changed

- Consolidated the backend under a single `/api/fototime` product API.
- Replaced supplier-specific integration code with a vendor-neutral image adapter.
- Updated generation to validate the returned image before recording success or charging credits.
- Rewrote all public documentation to match the implemented product and database layer.
- Removed legacy routes, duplicate clients, rescue copies, local data, and generated user media.

### Security

- Removed hard-coded operator identifiers and default PIN values.
- Added constant-time PIN comparison, attempt throttling, server-only configuration, and safer response headers.
- Added a production requirement for a dedicated session secret.

## 1.0.0

- Initial mini-app prototype with participant selection, style discovery, upload, generation, and QA artefacts.
