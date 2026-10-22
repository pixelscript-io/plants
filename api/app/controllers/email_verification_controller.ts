import User from '#models/user'
import UserToken from '#models/user_token'
import { inBackground, sendVerificationEmail } from '#services/account_emails'
import { verifyEmailValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'
import { DateTime } from 'luxon'

/** Verification emails a user may request per hour. */
const RESENDS_PER_HOUR = 3

export default class EmailVerificationController {
  /**
   * Confirms an email address from the emailed link. It works whether or not
   * the visitor is signed in: holding the link is the proof.
   */
  async verify({ request, response, serialize }: HttpContext) {
    const { token } = await request.validateUsing(verifyEmailValidator)

    const userId = await UserToken.consume(token, 'verify_email')
    const user = userId ? await User.find(userId) : null
    if (!user) {
      return response.badRequest({
        errors: [{ message: 'This verification link is invalid or has expired. Request a new one from your account.' }],
      })
    }

    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = DateTime.now()
      await user.save()
    }
    return serialize({ verified: true })
  }

  /** Sends the signed-in user another verification email. */
  async resend({ auth, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.emailVerifiedAt) return serialize({ alreadyVerified: true })

    const sends = limiter.use({ requests: RESENDS_PER_HOUR, duration: '1 hour' })
    const key = `verify_resend_${user.id}`
    try {
      await sends.consume(key)
    } catch {
      const retryAfter = await sends.availableIn(key)
      response.header('Retry-After', String(retryAfter))
      return response.tooManyRequests({
        errors: [
          {
            message: `Verification emails can be sent ${RESENDS_PER_HOUR} times an hour. Try again in ${Math.max(1, Math.ceil(retryAfter / 60))} minutes.`,
            retryAfterSeconds: retryAfter,
          },
        ],
      })
    }

    inBackground(sendVerificationEmail(user), 'verification email')
    return serialize({ sent: true })
  }
}
