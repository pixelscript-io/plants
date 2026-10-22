import env from '#start/env'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { mkdir, writeFile } from 'node:fs/promises'
import nodemailer, { type Transporter } from 'nodemailer'

export interface Mail {
  to: string
  subject: string
  text: string
  html: string
}

const transportKind = () => env.get('MAIL_TRANSPORT', 'file')

/**
 * Throws if email cannot work in this environment. Called when the server
 * starts, so a misconfigured production deployment fails loudly instead of
 * silently never sending a verification or reset email.
 */
export function assertMailConfigured() {
  if (transportKind() === 'smtp') {
    if (!env.get('SMTP_HOST')) throw new Error('MAIL_TRANSPORT is "smtp" but SMTP_HOST is not set.')
    return
  }
  if (app.inProduction) {
    throw new Error(
      'MAIL_TRANSPORT must be "smtp" in production. The "file" transport only writes messages to disk for development.'
    )
  }
}

let transporter: Transporter | null = null

function createTransporter() {
  if (transportKind() === 'smtp') {
    const user = env.get('SMTP_USER')
    return nodemailer.createTransport({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT', 587),
      secure: env.get('SMTP_SECURE', false),
      auth: user ? { user, pass: env.get('SMTP_PASSWORD') } : undefined,
    })
  }
  // Builds the message without sending it; we write the result to a file below.
  return nodemailer.createTransport({ jsonTransport: true })
}

export async function sendMail(mail: Mail) {
  transporter ??= createTransporter()
  const from = env.get('MAIL_FROM', 'Plants API <no-reply@localhost>')
  const info = await transporter.sendMail({ from, ...mail })

  if (transportKind() === 'file') {
    const directory = app.tmpPath('mail')
    await mkdir(directory, { recursive: true })
    const name = `${Date.now()}-${mail.to.replace(/[^a-z0-9@.]/gi, '_')}.json`
    await writeFile(`${directory}/${name}`, info.message as string)
    logger.info({ to: mail.to, subject: mail.subject, file: `tmp/mail/${name}` }, 'Email written to file (development)')
  }
}
