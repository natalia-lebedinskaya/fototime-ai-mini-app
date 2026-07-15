# Product requirements

## 1. Document purpose

This document defines the business and product requirements for FOT AI `1.1.0`. It describes implemented behaviour, measurable acceptance criteria, and the boundary between the public mini-app, operator workflows, identity database, and external image-generation service.

## 2. Product statement

FOT AI is a mobile-first event photo studio that lets a guest discover a curated visual style, upload a portrait, and receive a generated result without navigating a long bot conversation or asking an operator to configure each request manually.

The operator receives a compact support surface for balances, receipts, feedback, audit events, active jobs, and data cleanup. The product is designed for event guests, small photo-service teams, and demonstrations where a clear, reliable path matters more than a complex editor.

## 3. Business problem

The original workflow required multiple sequential choices, limited visual context, and manual support when a request failed. Users could not easily compare styles or understand why generation was unavailable. Operators lacked a single view of balances, feedback, active jobs, and failure evidence.

FOT AI addresses these gaps by:

- presenting the workflow as three visible steps: participant, style, photo;
- loading the style catalog dynamically and providing search and filters;
- validating inputs before creating a paid generation job;
- retaining personal history and receipts for registered users;
- recording actionable audit events for support;
- preventing a credit debit when a result is missing, duplicated, or invalid.

## 4. Business goals

| ID    | Goal                                     | Success signal                                                                                 |
| ----- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- |
| BG-01 | Reduce friction from entry to generation | A first-time user can identify the next required action without instructions from an operator. |
| BG-02 | Improve style discovery                  | Users can search, filter, paginate, and switch catalog layout on mobile.                       |
| BG-03 | Protect paid value                       | Credits are debited only after a valid result is stored.                                       |
| BG-04 | Make support evidence actionable         | Operator view shows the user, job, timestamps, failure type, and relevant state.               |
| BG-05 | Support repeat use                       | Registered users can recover their profile, balance, history, notifications, and receipts.     |
| BG-06 | Limit privacy exposure                   | Secrets stay server-side and user media is automatically removed after 14 days.                |
| BG-07 | Support an international demo            | The same flow is available in RU, EN, and VI without reloading the application.                |

## 5. Stakeholders and users

| Role               | Need                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| Event guest        | Create a styled image quickly with clear feedback and minimal setup.                   |
| Returning customer | Recover account data and previous results across devices.                              |
| Operator           | Review balances, receipts, feedback, active jobs, failures, and cleanup actions.       |
| Product owner      | Understand conversion blockers and release risks from structured audit data.           |
| QA engineer        | Trace behaviour to requirements, verify negative paths, and reproduce failures safely. |

## 6. Scope

### In scope for 1.1.0

- browser guest identity and login/password identity;
- optional signed Telegram identity support on the backend;
- database-backed profiles, identities, credentials, and device records;
- participant selection;
- dynamic style catalog with fallback data;
- catalog search, model filter, grid/carousel layout, and pagination;
- JPG, PNG, and WebP upload up to 10 MB;
- asynchronous generation submit/poll flow;
- generation integrity validation and credit debit after success;
- balance, history, receipts, feedback, notifications, and profile preferences;
- operator authentication and console;
- English, Russian, and Vietnamese interface;
- automatic 14-day operational retention.

### Out of scope

- card acquiring or automated payment settlement;
- collaborative event administration;
- advanced image editing after generation;
- native iOS or Android binaries;
- public social feed;
- direct browser access to database tables or image-service credentials.

## 7. Functional requirements

### FR-01 — Identity bootstrap

The application shall create a signed session for a valid browser device identity. The backend may also create a session from verified Telegram launch data.

Acceptance criteria:

- a new browser receives a stable, device-specific profile;
- an existing identity resolves to the same profile;
- an invalid or expired session cannot read protected state;
- a production deployment without persistent identity configuration is rejected;
- no server secret is returned to the browser.

### FR-02 — Account registration and login

The application shall allow a user to register and sign in with a unique login and password.

Acceptance criteria:

- login format is 3–48 allowed characters;
- password length is at least 10 characters;
- passwords are stored only as salted `scrypt` hashes;
- duplicate logins are rejected;
- invalid credentials return the same generic response;
- a successful login issues a signed 14-day session.

### FR-03 — Language and visual preferences

The application shall support RU, EN, and VI interface languages plus light, dark, retro, and design themes.

Acceptance criteria:

- a language change updates visible text without a full page reload;
- the document language matches the selected value;
- theme and language persist on the current device;
- motion is reduced when the operating system requests reduced motion.

### FR-04 — Participant selection

The user shall select one participant type before generation.

Acceptance criteria:

- one option is visibly active;
- changing the option updates request state;
- supported types are man, woman, couple, boy, girl, and family;
- generation cannot start with an empty participant value.

### FR-05 — Style catalog

The backend shall load the current style catalog through a server-side adapter. When the external catalog is unavailable, a small fallback catalog shall keep the browsing experience testable.

Acceptance criteria:

- supplier credentials and supplier identity are not exposed in the public client;
- the UI supports search by style or model;
- filters are derived from returned data rather than hard-coded UI tabs;
- users can switch grid/carousel view and choose 6, 9, or 12 items per page;
- missing previews fall back to a text-based style card;
- an empty result explains how to recover.

### FR-06 — Photo upload

The application shall accept one JPG, PNG, or WebP image no larger than 10 MB.

Acceptance criteria:

- client and server both validate the selection;
- unsupported content returns `INVALID_IMAGE_TYPE`;
- an oversized image returns `FILE_TOO_LARGE`;
- the selected file name and preview are visible;
- generation remains disabled until participant, style, and photo are present.

### FR-07 — Generation orchestration

The backend shall submit a generation request, poll its status, and download the completed image through a vendor-neutral adapter.

Acceptance criteria:

- adapter URL, key, polling interval, attempt limit, and request timeout are environment settings;
- the browser never sends requests directly to the external generation API;
- the UI displays a busy state and prevents duplicate submission;
- timeout and failed-job states return structured errors;
- temporary source files are removed when generation fails.

### FR-08 — Result integrity and credit debit

The backend shall validate the result before recording a successful generation or changing the balance.

Acceptance criteria:

- source and result hashes must differ;
- obvious demo, stock, and watermark markers are rejected;
- a failed integrity check does not debit credits;
- a valid result records cost, balance before/after, job identifier, and processing time;
- the completed result is visible in personal history.

### FR-09 — Personal account

The account shall expose balance, generation history, notifications, receipts, avatar preferences, feedback, and sign-out.

Acceptance criteria:

- data is scoped to the signed-in identity;
- users can delete one or multiple history items;
- deleted history media is removed from storage;
- attached receipts are visible only to their intended account;
- changing account clears the current browser session without deleting the profile.

### FR-10 — Operator console

An authorised operator shall view and maintain user balances, receipts, feedback, active jobs, media pairs, and audit sessions.

Acceptance criteria:

- no default PIN or operator identity exists in source code;
- PIN comparison is constant-time and failed attempts are throttled;
- operator API calls require a configured PIN or allowed identity;
- destructive bulk actions require an explicit UI confirmation;
- cleanup actions return the number of deleted records.

### FR-11 — Retention

Generated media, feedback attachments, receipt files, notifications containing receipts, and audit sessions shall expire after 14 days.

Acceptance criteria:

- expiration is evaluated when operational state is read;
- expired database records and related files are removed together;
- profile and credential deletion is handled separately as an account action;
- retention behaviour is disclosed in the account consent text and privacy documentation.

## 8. Non-functional requirements

| ID     | Area            | Requirement                                                                                                                             |
| ------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Security        | Secrets remain server-side; passwords are hashed; sessions are signed; database browser access is denied by RLS.                        |
| NFR-02 | Reliability     | Credit debit occurs after successful result validation and durable record update.                                                       |
| NFR-03 | Performance     | Initial UI remains usable while the remote catalog is unavailable; style previews use lazy loading.                                     |
| NFR-04 | Accessibility   | Interactive elements have accessible names, visible focus, sufficient target size, and reduced-motion support.                          |
| NFR-05 | Compatibility   | Support current Chromium, Safari, and Telegram WebView on common mobile widths from 360 px.                                             |
| NFR-06 | Observability   | Important state changes and errors create structured audit entries without logging secrets or full image payloads.                      |
| NFR-07 | Maintainability | Provider-specific behaviour is isolated behind one adapter; routes use structured error codes; formatting and tests run in one command. |
| NFR-08 | Privacy         | User media and operational records follow the documented 14-day retention period.                                                       |

## 9. Business rules

- A new profile starts with 50 demonstration credits.
- One successful generation costs 40 credits.
- Insufficient balance blocks generation before an external job is created.
- Credits are not charged for provider failure, timeout, download failure, or integrity failure.
- Operator balance changes are manual and auditable.
- Payment request submission does not itself confirm payment.
- The public repository contains no production user data or production credentials.

## 10. Release acceptance

The release is acceptable when:

1. `npm run verify` passes.
2. All P0/P1 test cases pass and no open critical/high defect remains.
3. RU, EN, and VI smoke paths complete at 390 px and desktop widths.
4. The repository contains no local database, generated user media, secrets, supplier attribution, or development-assistant attribution.
5. Screenshots match the released UI and the feature GIF demonstrates the English flow plus language switching.
