# User stories and scenarios

## Personas

### Event guest

Wants a memorable image quickly, may be using one hand on a phone, and may not understand image-generation terminology.

### Returning user

Wants to recover a balance, history, and receipts from another device.

### Operator

Supports users, adds credits after payment verification, attaches receipts, reviews failures, and removes expired or invalid records.

## US-01 — Explore as a guest

**As an event guest, I want to start without registration so that I can understand the experience before creating an account.**

Preconditions: the app is reachable and the browser permits local storage.

Main flow:

1. The guest opens FOT AI.
2. The welcome dialog explains guest and account options.
3. The guest selects an avatar and colour theme.
4. The guest chooses “Continue as guest”.
5. The home screen shows balance, participant, styles, and upload step.

Expected result: a signed browser session is created and protected state loads without exposing credentials.

Alternative: if persistent identity storage is unavailable in production, the app returns a configuration error instead of silently creating an insecure session.

## US-02 — Change language

**As an international user, I want to change the interface language immediately.**

1. Open the language selector.
2. Choose EN, RU, or VI.
3. Observe the header, workflow labels, buttons, empty states, dialogs, and navigation.
4. Reload the page.

Expected result: visible text changes without losing current selections, the document language changes, and the preference survives reload.

## US-03 — Find a suitable style

**As a guest, I want to compare styles visually so that I can choose confidently.**

1. Select a participant type.
2. Search by style name or model.
3. Apply a model filter.
4. Switch between grid and carousel.
5. Change page size and move between pages.
6. Select one style.

Expected result: one card is selected, a clear confirmation appears near the generation button, and filtering never changes the selected participant.

Recovery scenarios:

- Catalog unavailable: fallback styles remain available and the failure is logged.
- Preview unavailable: the card remains usable with a text fallback.
- Search returns no results: the UI suggests changing the query or filter.

## US-04 — Generate an image

**As a user with enough credits, I want to generate an image from my portrait and selected style.**

1. Select participant and style.
2. Upload one valid portrait.
3. Start generation.
4. Observe upload and processing progress.
5. Wait for the result.

Expected result:

- one external job is created;
- duplicate clicks are blocked;
- the result differs from the source and passes integrity checks;
- 40 credits are debited after validation;
- the result, source, style, job metadata, cost, and timestamp appear in history.

Negative paths:

| Condition                           | Expected behaviour                                             |
| ----------------------------------- | -------------------------------------------------------------- |
| Missing style or photo              | Button remains disabled; API also rejects incomplete input.    |
| Unsupported type                    | `INVALID_IMAGE_TYPE`; no job and no debit.                     |
| File over 10 MB                     | `FILE_TOO_LARGE`; no job and no debit.                         |
| Balance below cost                  | `NOT_ENOUGH_CREDITS`; no job.                                  |
| External timeout                    | Structured timeout response; source file is removed; no debit. |
| Result equals source                | Integrity error; no debit.                                     |
| Result contains a stock/demo marker | Integrity error; no debit.                                     |

## US-05 — Create and recover an account

**As a returning user, I want to use a login and password so that my account can be restored on another device.**

1. Open the account dialog.
2. Enter a valid login and password.
3. Accept the data-processing statement.
4. Create the profile.
5. Sign out and sign in again.

Expected result: the same profile identifier, balance, history, preferences, and receipts are returned. The browser never receives the password hash or database key.

## US-06 — Delete history

**As a user, I want to remove generated images I no longer need.**

1. Open Account.
2. Enter selection mode.
3. Select one or more items.
4. Confirm deletion.

Expected result: only the signed-in user’s records can be selected; both metadata and stored source/result files are removed; the updated list is returned.

## US-07 — Request credits

**As a user, I want to request a credit package and later see a receipt.**

1. Choose a package and currency.
2. Submit contact details.
3. Wait for operator confirmation.
4. Refresh the account after the operator updates balance and attaches a receipt.

Expected result: submission is recorded as feedback; it does not automatically change balance; the receipt is visible only to the intended account.

## US-08 — Support a user as operator

**As an operator, I want one console for user support and diagnostics.**

1. Open Admin and enter the configured PIN.
2. Review users, balance, critical errors, active jobs, feedback, media pairs, and audit sessions.
3. Update a balance or attach a receipt.
4. Mark items read or export audit data.

Expected result: every operation requires operator authorisation, returns structured status, and updates the relevant account.

## US-09 — Clean data safely

**As an operator, I want to remove selected or expired data without affecting unrelated accounts.**

1. Choose a console section.
2. Select records or choose the explicit “all in this section” action.
3. Confirm the destructive action.

Expected result: the API validates scope, removes related files, reports deletion count, and leaves other data intact.

## Behaviour examples

```gherkin
Scenario: Credits are protected when generation fails
  Given a signed-in user has 50 credits
  And participant, style, and photo are valid
  When the image service returns a failed job
  Then the API returns a structured failure
  And the user still has 50 credits
  And no successful history item is created

Scenario: English can be enabled during the same session
  Given the interface is displayed in Russian
  When the user selects EN
  Then navigation, workflow labels, dialogs, and actions are displayed in English
  And the participant and selected style are preserved
```
