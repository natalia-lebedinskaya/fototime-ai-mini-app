# Security policy

## Reporting a vulnerability

Please report security concerns privately to the repository owner through the contact options listed in the application. Do not open a public issue containing credentials, personal data, exploitable payloads, or private screenshots.

Include the affected version, reproduction steps, expected and actual behaviour, impact, and the smallest safe proof of concept. Reports are acknowledged as soon as practical and are prioritised by user impact and exploitability.

## Security baseline

- Credentials and database keys are server-side environment variables.
- Passwords are salted and hashed with `scrypt`; raw passwords are never stored.
- Sessions are signed, expire after 14 days, and require a production secret.
- Database tables use row-level security and deny direct browser access.
- Uploaded files are limited by MIME type, count, and size.
- Generated results must pass integrity checks before a credit debit is recorded.
- Operator access has no code-level default credentials.
- Runtime data, media, `.env` files, and local databases are excluded from Git.

## Supported version

Security fixes target the latest release on the default branch.
