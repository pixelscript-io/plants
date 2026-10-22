import User from '#models/user'
import { inBackground, sendVerificationEmail } from '#services/account_emails'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'

export default class NewAccountController {
  async store({ request, serialize }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({ fullName, email, password })
    const token = await User.accessTokens.create(user)

    // Ask the new user to confirm their address. Sent in the background so a
    // slow mail server never delays or fails the signup.
    inBackground(sendVerificationEmail(user), 'verification email')

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }
}
