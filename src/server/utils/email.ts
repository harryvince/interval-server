import env from 'env'

export const isEmailEnabled = () => {
  if (env.POSTMARK_API_KEY || (env.SMTP_HOST && env.SMTP_PORT)) return true
  return false
}
