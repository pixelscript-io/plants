import { UserTokenSchema } from '#database/schema'
import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import type User from '#models/user'

export type TokenPurpose = 'verify_email' | 'reset_password'

/** How long each kind of link works. Reset links are short because they grant account access. */
export const TOKEN_TTL_HOURS: Record<TokenPurpose, number> = {
  verify_email: 24,
  reset_password: 1,
}

const sqlTime = (at: DateTime) => at.toUTC().toFormat('yyyy-MM-dd HH:mm:ss')

/**
 * Single-use links emailed to a user. The raw token exists only in the email;
 * the database keeps a SHA-256 hash, so a leaked copy of it grants nothing.
 */
export default class UserToken extends UserTokenSchema {
  static hash(raw: string) {
    return createHash('sha256').update(raw).digest('hex')
  }

  /**
   * Creates a token for a user and returns the raw value to put in the email.
   * Any earlier unused token of the same kind is removed, so only the newest
   * link works.
   */
  static async issue(user: User, purpose: TokenPurpose) {
    await UserToken.query().where('userId', user.id).where('purpose', purpose).delete()

    const raw = randomBytes(32).toString('base64url')
    await UserToken.create({
      userId: user.id,
      purpose,
      tokenHash: UserToken.hash(raw),
      expiresAt: DateTime.now().plus({ hours: TOKEN_TTL_HOURS[purpose] }),
    })
    return raw
  }

  /**
   * Uses up a token and returns the id of the user it belongs to, or null if it
   * is unknown, expired, already used or of another kind. Marking it used is a
   * single conditional update, so two requests with the same token cannot both
   * succeed.
   */
  static async consume(raw: string, purpose: TokenPurpose) {
    const token = await UserToken.query()
      .where('tokenHash', UserToken.hash(raw))
      .where('purpose', purpose)
      .whereNull('usedAt')
      .where('expiresAt', '>', sqlTime(DateTime.now()))
      .first()
    if (!token) return null

    const result = await UserToken.query()
      .where('id', token.id)
      .whereNull('usedAt')
      .update({ usedAt: sqlTime(DateTime.now()) })
    const changed = Array.isArray(result) ? result[0] : result
    return changed ? token.userId : null
  }

  /** Removes every unused token of a kind for a user (for example after a reset). */
  static async revokeAll(userId: number, purpose: TokenPurpose) {
    await UserToken.query().where('userId', userId).where('purpose', purpose).delete()
  }
}
