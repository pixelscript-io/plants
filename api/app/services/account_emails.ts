import UserToken, { TOKEN_TTL_HOURS } from '#models/user_token'
import type User from '#models/user'
import { sendMail } from '#services/mailer'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

const webUrl = () => env.get('WEB_URL', 'http://localhost:3000').replace(/\/$/, '')

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** A plain, accessible message with a single button and the link in full. */
function layout(heading: string, intro: string, buttonText: string, url: string, outro: string) {
  const html = `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f4f4f5;margin:0;padding:24px">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
    <tr><td>
      <h1 style="font-size:20px;margin:0 0 16px">${escape(heading)}</h1>
      <p style="font-size:15px;line-height:1.5;margin:0 0 24px">${escape(intro)}</p>
      <p style="margin:0 0 24px"><a href="${escape(url)}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:15px">${escape(buttonText)}</a></p>
      <p style="font-size:13px;color:#52525b;line-height:1.5;margin:0 0 8px">Or copy this link into your browser:</p>
      <p style="font-size:13px;word-break:break-all;margin:0 0 24px"><a href="${escape(url)}">${escape(url)}</a></p>
      <p style="font-size:13px;color:#52525b;line-height:1.5;margin:0">${escape(outro)}</p>
    </td></tr>
  </table>
</body></html>`
  const text = `${heading}\n\n${intro}\n\n${buttonText}: ${url}\n\n${outro}\n`
  return { html, text }
}

export async function sendVerificationEmail(user: User) {
  const token = await UserToken.issue(user, 'verify_email')
  const url = `${webUrl()}/verify-email?token=${token}`
  const hours = TOKEN_TTL_HOURS.verify_email
  const { html, text } = layout(
    'Confirm your email address',
    'Welcome to Plants API. Confirm your email address to start creating API keys.',
    'Confirm email address',
    url,
    `This link works for ${hours} hours. If you did not create an account, you can ignore this email.`
  )
  await sendMail({ to: user.email, subject: 'Confirm your email address', text, html })
}

export async function sendPasswordResetEmail(user: User) {
  const token = await UserToken.issue(user, 'reset_password')
  const url = `${webUrl()}/reset-password?token=${token}`
  const hours = TOKEN_TTL_HOURS.reset_password
  const { html, text } = layout(
    'Reset your password',
    'We received a request to reset the password for your Plants API account.',
    'Choose a new password',
    url,
    `This link works once and expires in ${hours} hour. If you did not ask for this, ignore this email: your password has not changed.`
  )
  await sendMail({ to: user.email, subject: 'Reset your password', text, html })
}

/**
 * Sends an email in the background so a request never waits on the mail server,
 * and never fails because of it. A failure is logged for the operator; the
 * user can ask for the email again.
 */
export function inBackground(task: Promise<unknown>, what: string) {
  task.catch((error) => logger.error({ err: error }, `Could not send ${what}`))
}
