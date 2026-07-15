# Data and privacy

## Principles

FOT AI collects only the data needed to create an account, operate image generation, provide support, and show personal history. Production credentials never enter browser code. Public source control contains no user database or user media.

## Data inventory

| Data                                        | Purpose                          | Storage                             | Default retention                                         |
| ------------------------------------------- | -------------------------------- | ----------------------------------- | --------------------------------------------------------- |
| Profile name, login, avatar preferences     | Account and personalisation      | Supabase profile table              | Until account deletion                                    |
| Linked identity subject and device metadata | Sign-in and session recovery     | Supabase identity/device tables     | Until account deletion                                    |
| Salted password hash                        | Password authentication          | Supabase credentials table          | Until reset/deletion                                      |
| Signed session token                        | Authorised API access            | Browser session storage             | Up to 14 days                                             |
| Source and generated images                 | Generation and personal history  | Server media storage                | 14 days                                                   |
| Balance and generation metadata             | Product operation and support    | Server operational store            | Active account; media-linked records expire after 14 days |
| Feedback attachment                         | Support evidence                 | Server media storage                | 14 days                                                   |
| Receipt file and notification               | Payment evidence                 | Server storage/account notification | 14 days in the current mini-app store                     |
| Audit event                                 | Diagnostics and operator support | Server operational store            | 14 days                                                   |

## Access controls

- Browser database roles have no direct table access.
- The server uses the Supabase service role; its key is never returned to clients.
- Personal routes resolve the signed session and override user identifiers supplied in the request.
- Operator routes require configured authorisation.
- Stored media names are normalised before file access.

## Passwords and sessions

Passwords are processed with `scrypt`, a random 16-byte salt, and a 64-byte derived value. Sessions contain only a profile identifier and expiry, are signed with HMAC-SHA256, and are rejected when the signature or expiry is invalid.

## Retention and deletion

The operational store purges expired generations, feedback attachments, receipt notifications, and audit sessions when state is read. Related files are deleted with their records. Users can also delete selected history manually; operators can perform scoped cleanup.

Account/profile deletion is a separate administrative operation because identity records may be required to prevent accidental re-linking. A production privacy process should verify identity before permanent account deletion.

## Repository hygiene

`.env`, `data/`, `storage/`, uploads, results, logs, local databases, and rescue copies are ignored. Release verification must scan both the current tree and reachable Git history before publication.

## Production responsibilities

The deployer remains responsible for a lawful privacy notice, consent language, storage-region selection, backup retention, access review, incident response, and handling data-subject requests. The application’s technical controls support these obligations but do not replace them.
