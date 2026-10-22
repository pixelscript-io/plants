import { assertMailConfigured } from '#services/mailer'

// Fail at startup, not on the first signup, if email is misconfigured.
assertMailConfigured()
