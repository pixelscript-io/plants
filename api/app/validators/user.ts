import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

/**
 * Validators for email verification and password reset. Tokens are the raw
 * values from emailed links: long random strings, so only the length is checked.
 */
const token = () => vine.string().trim().minLength(20).maxLength(100)

export const verifyEmailValidator = vine.create({ token: token() })

export const forgotPasswordValidator = vine.create({ email: email() })

export const resetPasswordValidator = vine.create({
  token: token(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
})
