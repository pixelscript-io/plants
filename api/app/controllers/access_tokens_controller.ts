import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'
import UserTransformer from '#transformers/user_transformer'

/** Failed logins allowed per email address before it is locked out for a while. */
const MAX_FAILED_LOGINS = 10
const LOCKOUT = '15 minutes'

export default class AccessTokensController {
  async store({ request, response, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    // Limit by email, not IP address: the dashboard's server makes every login
    // request from one address, and this also stops slow guessing from many IPs.
    // It applies to unknown emails too, so it reveals nothing about which exist.
    const attempts = limiter.use({ requests: MAX_FAILED_LOGINS, duration: LOCKOUT })
    const key = `login_${email.trim().toLowerCase()}`
    if ((await attempts.remaining(key)) <= 0) {
      const retryAfter = await attempts.availableIn(key)
      response.header('Retry-After', String(retryAfter))
      return response.tooManyRequests({
        errors: [
          {
            message: `Too many failed login attempts. Try again in ${Math.max(1, Math.ceil(retryAfter / 60))} minutes.`,
            retryAfterSeconds: retryAfter,
          },
        ],
      })
    }

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch (error) {
      await attempts.consume(key).catch(() => undefined)
      throw error
    }
    await attempts.delete(key)

    const token = await User.accessTokens.create(user)

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }
}
