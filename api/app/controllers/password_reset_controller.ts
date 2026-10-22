import User from '#models/user'
import UserToken from '#models/user_token'
import { inBackground, sendPasswordResetEmail } from '#services/account_emails'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import limiter from '@adonisjs/limiter/services/main'
import { DateTime } from 'luxon'

/** Reset emails sent to one address per hour. */
const RESETS_PER_HOUR = 3

/** The answer to every reset request, whether or not the account exists. */
const REQUESTED_MESSAGE =
  'If an account exists for that email address, we have sent a link to reset its password.'

export default class PasswordResetController {
  /**
   * Starts a reset. It answers the same way, and takes the same time, for an
   * address with an account and one without, so it cannot be used to find out
   * who has an account. Everything that differs happens after the response.
   */
  async forgot({ request, serialize }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)
    const address = email.trim().toLowerCase()

    inBackground(this.sendReset(address), 'password reset email')
    return serialize({ message: REQUESTED_MESSAGE })
  }

  private async sendReset(address: string) {
    // Limited per address (not per IP), so a victim's inbox cannot be flooded.
    // The limit counts requests for unknown addresses too.
    const sends = limiter.use({ requests: RESETS_PER_HOUR, duration: '1 hour' })
    try {
      await sends.consume(`forgot_${address}`)
    } catch {
      return
    }

    const user = await User.query().whereRaw('lower(email) = ?', [address]).first()
    if (!user) return
    await sendPasswordResetEmail(user)
  }

  /**
   * Sets a new password from an emailed link. This signs the user out
   * everywhere: a reset usually means someone else may have had access.
   */
  async reset({ request, response, serialize }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const userId = await UserToken.consume(token, 'reset_password')
    const user = userId ? await User.find(userId) : null
    if (!user) {
      return response.badRequest({
        errors: [{ message: 'This password reset link is invalid or has expired. Request a new one.' }],
      })
    }

    user.password = password
    // They received the link in their inbox, which proves they control it.
    if (!user.emailVerifiedAt) user.emailVerifiedAt = DateTime.now()
    await user.save()

    // Revoke every session and API token for the account, and clear any
    // failed-login lockout so the owner can sign in straight away.
    for (const accessToken of await User.accessTokens.all(user)) {
      await User.accessTokens.delete(user, accessToken.identifier)
    }
    await UserToken.revokeAll(user.id, 'reset_password')
    await limiter
      .use({ requests: 10, duration: '15 minutes' })
      .delete(`login_${user.email.trim().toLowerCase()}`)
      .catch((error) => logger.warn({ err: error }, 'Could not clear the login lockout'))

    return serialize({ reset: true })
  }
}
