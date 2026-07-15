# QA strategy

## Objective

The strategy protects three product promises: a user always understands the next action, credits are never charged for a false success, and private data is not exposed across identities or through the public repository.

## Quality risks

| Risk                                                | Probability | Impact   | Priority | Primary controls                                                                  |
| --------------------------------------------------- | ----------- | -------- | -------- | --------------------------------------------------------------------------------- |
| Credit debit without valid result                   | Medium      | Critical | P0       | API integration, forced provider failures, hash-equality test, balance assertions |
| Cross-account history or receipt access             | Low         | Critical | P0       | Session substitution, direct object reference checks, deletion ownership checks   |
| Secret or user media committed to Git               | Medium      | Critical | P0       | Ignore rules, history scan, release checklist                                     |
| Invalid image reaches external API                  | Medium      | High     | P1       | Client/server MIME, size, and count validation                                    |
| Duplicate generation from repeated tap              | Medium      | High     | P1       | Disabled busy state, concurrency checks, active-job audit                         |
| Catalog/API unavailable                             | Medium      | Medium   | P1       | Fallback catalog, structured errors, recovery messaging                           |
| Translation leaves mixed-language UI                | High        | Medium   | P1       | Page/dialog/navigation language matrix                                            |
| Mobile layout hides primary action                  | Medium      | High     | P1       | 360/390/430 px visual regression and keyboard checks                              |
| Destructive operator action affects wrong scope     | Low         | Critical | P0       | Confirmation, scope validation, seeded multi-user data                            |
| Retention deletes recent data or keeps expired data | Medium      | High     | P1       | Boundary tests at 14 days ±1 second and file/record pairing                       |

## Test levels

### Static and repository checks

- parse all production JavaScript;
- formatting check;
- dependency audit;
- forbidden-name and secret-pattern scan;
- verify no runtime database, upload, result, receipt, log, or rescue file is tracked;
- verify README links and media paths.

### Unit tests

- provider configuration parsing and validation;
- catalog envelope extraction;
- identity hashing/session boundaries;
- retention boundary helpers;
- URL and filename normalization;
- result integrity helpers.

### API tests

- health/version and structured 404;
- browser session, registration, login, invalid/expired session;
- state scoping by identity;
- upload type/size/count validation;
- insufficient balance;
- provider timeout/failure/invalid result with unchanged balance;
- successful generation with correct balance/history metadata;
- operator PIN valid/invalid/throttled/unconfigured;
- bulk cleanup by scope and user ownership.

### UI and exploratory testing

- first-run comprehension with no product explanation;
- RU/EN/VI switching in home, account, dialogs, errors, and admin;
- light/dark/retro/design themes;
- search, model filter, grid/carousel, pagination, empty result;
- file picker cancellation and repeated replacement;
- offline/slow catalog and slow generation;
- mobile keyboard, safe area, sticky controls, and long translated strings;
- reduced motion and keyboard-only navigation.

## Core test matrix

| Area                       | Chrome desktop | Safari desktop | Mobile 390 px | Telegram WebView |
| -------------------------- | -------------- | -------------- | ------------- | ---------------- |
| Guest bootstrap            | P0             | P1             | P0            | P1               |
| Account registration/login | P0             | P1             | P0            | P1               |
| Catalog/search/filter      | P0             | P1             | P0            | P1               |
| Upload/generation/result   | P0             | P0             | P0            | P0               |
| History/delete/share       | P1             | P1             | P1            | P1               |
| Operator console           | P0             | P1             | P1            | N/A              |
| Language/theme             | P1             | P1             | P1            | P1               |

## Requirement traceability

| Requirement   | Main scenarios      | Automated evidence                       | Manual evidence               |
| ------------- | ------------------- | ---------------------------------------- | ----------------------------- |
| FR-01 / FR-02 | US-01, US-05        | Browser identity, registration/login API | Cross-device recovery charter |
| FR-03         | US-02               | State preference checks (planned)        | RU/EN/VI visual matrix        |
| FR-04 / FR-05 | US-03               | Catalog normalization                    | Search/filter/layout charter  |
| FR-06         | US-04               | Negative generation request              | File matrix                   |
| FR-07 / FR-08 | US-04               | Provider unit tests; failure contract    | End-to-end generation run     |
| FR-09         | US-05, US-06, US-07 | Ownership API checks (planned)           | Account regression            |
| FR-10         | US-08, US-09        | PIN API checks                           | Seeded operator dataset       |
| FR-11         | US-09               | Retention unit checks (planned)          | 14-day boundary review        |

## Exploratory charters

### Charter A — “Can I get lost?”

Explore first use on a 390 px screen with no prior context. Look for unclear terms, invisible disabled-state reasons, unexpected scroll jumps, and dead ends after closing dialogs.

### Charter B — “Never charge a failure”

Interrupt every generation phase: before upload completes, after submit, during poll, during result download, during integrity validation, and during storage write. Compare balance and history before/after.

### Charter C — “Wrong user, wrong data”

Create two accounts and attempt to read/delete the other user’s generations, notifications, receipt URL, and profile by changing request fields while retaining the first session.

### Charter D — “Operator blast radius”

Seed multiple users, generations, feedback items, receipts, sessions, and active jobs. Exercise selected and all-record cleanup in each section and verify unrelated scopes remain unchanged.

## Defect severity

- **Critical:** data exposure, secret exposure, unauthorised operator access, incorrect debit, irreversible multi-user deletion.
- **High:** generation unavailable for valid input, account cannot be recovered, result/history mismatch, primary mobile action inaccessible.
- **Medium:** filter/pagination/translation error with a workaround, incorrect audit detail, visual regression affecting comprehension.
- **Low:** cosmetic alignment, non-blocking wording, minor animation inconsistency.

## Release gate

- automated verification passes;
- no open Critical or High defect;
- P0 scenarios pass in current Chrome and Safari plus a 390 px viewport;
- one successful real generation is verified in the release environment;
- failure, timeout, and invalid-result paths preserve balance;
- repository and complete reachable Git history pass forbidden-name, secret, and user-media scans;
- README screenshots and GIF are regenerated from the release build.

## Current automated result

Run `npm test` for the executable test report and `npm run verify` for the full local gate. Remaining planned automation is explicitly marked in the traceability table rather than presented as completed coverage.
