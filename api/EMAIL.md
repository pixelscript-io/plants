# Email: verification and password reset

## What it does

| Flow | Endpoints | Behaviour |
|---|---|---|
| Verify email | `POST /auth/verify-email`, `POST /account/resend-verification` | Signup emails a link (valid 24 h, single use). Confirmed accounts have `emailVerified: true`. **Unconfirmed accounts can sign in but cannot create API keys** (`403`, code `EMAIL_NOT_VERIFIED`); existing keys keep working. Resend is limited to 3 per hour per user. |
| Forgot password | `POST /auth/forgot-password` | Always answers `200` with the same message and does its work after responding, so it cannot reveal which addresses have accounts. At most 3 emails per address per hour (unknown addresses count too). |
| Reset password | `POST /auth/reset-password` | Link valid 1 h, single use. Sets the password, **revokes every session and token on the account**, clears any failed-login lockout, and marks the address confirmed. A validation error (short password, mismatch) does not use up the link. |

Accounts that existed before this feature were marked confirmed, so nobody was locked out.

## Tokens

Links carry a 256-bit random token. Only its SHA-256 hash is stored (`user_tokens`), so a copy of the database
cannot be used to take over accounts. Requesting a new link of the same kind invalidates the older one, and using
a token is a single conditional update, so the same link cannot succeed twice even if sent twice at once.

## Configuring email

| Variable | Purpose |
|---|---|
| `MAIL_TRANSPORT` | `file` (default) or `smtp`. |
| `MAIL_FROM` | Sender, for example `Plants API <no-reply@yourdomain.com>`. Use a domain you control and set up SPF/DKIM for it, or messages land in spam. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` | Your SMTP provider. `SMTP_SECURE=true` for port 465; STARTTLS is used on 587 automatically. |
| `WEB_URL` | The dashboard's public address. Links in emails point here. |

- **Development (`file`)**: nothing is sent. Each email is written as JSON to `tmp/mail/`, and the server logs the
  file name. Open the file and use the link in `text`.
- **Production**: the server **refuses to start** unless `MAIL_TRANSPORT=smtp` and `SMTP_HOST` is set, so
  verification and reset emails can never be silently dropped.
- Emails are sent in the background. A slow or failing mail server never delays or fails a signup or reset
  request; the failure is logged (`Could not send ...`) and the user can ask again.

## Known limits

- **Signup still reveals taken addresses** (`email has already been taken`). Hiding that would need a different
  signup flow (always answer "check your email").
- Email addresses are compared case-insensitively for reset, but signup does not lowercase them, so two accounts
  differing only by case could exist.
- No password change while signed in, and no two-factor authentication yet.
- Sending is fire-and-forget: there is no queue, retry or bounce handling. For volume, move sending to a job queue.
