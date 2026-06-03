import { allowedEmailDomain } from '../config/env.js'

export function isAllowedEmail(email) {
  if (!email || typeof email !== 'string') return false
  return email.trim().toLowerCase().endsWith(`@${allowedEmailDomain}`)
}
