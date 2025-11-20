import env from 'env'
import { createTransport } from 'nodemailer'
import { ServerClient as PostmarkClient } from 'postmark'
import { isEmailEnabled } from '~/server/utils/email'
import { logger } from '~/server/utils/logger'

const postmark =
  env.POSTMARK_API_KEY !== undefined
    ? new PostmarkClient(env.POSTMARK_API_KEY)
    : null

const alternativeEmailClient =
  env.SMTP_HOST !== undefined && env.SMTP_PORT !== undefined
    ? createTransport({
        host: env.SMTP_HOST,
        port: +env.SMTP_PORT,
        secure: env.SMTP_SECURE === 'true',
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
        connectionTimeout: 5000, // 5 seconds
        greetingTimeout: 5000,
        socketTimeout: 10000 // 10 seconds
      })
    : null

export async function sendEmail(input: {
  from: string
  to: string
  subject: string
  html: string
}) {
  if (!isEmailEnabled()) return { accepted: true }

  if (postmark) {
    try {
      const response = await postmark.sendEmail({
        From: input.from,
        To: input.to,
        Subject: input.subject,
        HtmlBody: input.html
      })
      if (response.Message === 'OK') {
        return { ...response, accepted: true }
      } else {
        return { ...response, accepted: false }
      }
    } catch (error) {
      logger.error('Failed to send email via Postmark', { error })
      throw error
    }
  }

  if (alternativeEmailClient) {
    try {
      const response = await alternativeEmailClient.sendMail({
        from: input.from,
        to: input.to,
        subject: input.subject,
        html: input.html
      })
      if (response.accepted.length > 1) {
        return { ...response, accepted: true }
      } else {
        return { ...response, accepted: false }
      }
    } catch (error) {
      logger.error('Failed to send email via SMTP', {
        error,
        host: env.SMTP_HOST,
        port: env.SMTP_PORT
      })
      throw error
    }
  }

  const error = new Error('No email client configured')
  logger.warn('No email client configured')
  throw error
}
