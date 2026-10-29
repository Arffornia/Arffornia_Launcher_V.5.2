// Redaction of sensitive values before they reach the log file.
// Players share launcher_log.txt for support, so session credentials and account ids must never be in it.

export const REDACTED = '[REDACTED]'

/** Launch arguments whose value is sensitive (case-insensitive). */
const SENSITIVE_FLAGS = ['accessToken', 'uuid', 'xuid', 'clientId', 'userProperties', 'session']

const FLAG_PATTERN = new RegExp(`(--(?:${SENSITIVE_FLAGS.join('|')}))(\\s+|=)("[^"]*"|\\S+)`, 'gi')

// JWT-shaped strings (Minecraft access tokens are JWTs).
const JWT_PATTERN = /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]{5,}\b/g

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a redact function. Known secret values are replaced wherever they appear, in addition to the
 * values of sensitive command-line flags and anything that looks like a JWT.
 * @param {Array<unknown>} [secrets] - exact values to hide (short values under 6 chars are ignored)
 * @returns {(message: unknown) => string}
 */
export function createRedactor(secrets = []) {
  const values = [...new Set(secrets.filter((s) => typeof s === 'string' && s.length >= 6))]
    // Longest first so a value containing another one is replaced whole.
    .sort((a, b) => b.length - a.length)
  const secretPattern = values.length
    ? new RegExp(values.map(escapeRegExp).join('|'), 'g')
    : null

  return (message) => {
    let text = typeof message === 'string' ? message : String(message)
    if (secretPattern) text = text.replace(secretPattern, REDACTED)
    text = text.replace(FLAG_PATTERN, (_m, flag, sep) => `${flag}${sep}${REDACTED}`)
    text = text.replace(JWT_PATTERN, REDACTED)
    return text
  }
}

/**
 * Collect the sensitive values of an MCLC authorization object.
 * @param {any} authorization - result of msmc `token.mclc()`
 * @returns {string[]}
 */
export function authorizationSecrets(authorization) {
  if (!authorization || typeof authorization !== 'object') return []
  const uuid = authorization.uuid
  return [
    authorization.access_token,
    authorization.client_token,
    uuid,
    // Minecraft sometimes prints the uuid with dashes.
    typeof uuid === 'string' && /^[0-9a-f]{32}$/i.test(uuid)
      ? uuid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
      : undefined,
    authorization.meta?.xuid,
    authorization.meta?.clientId,
    authorization.meta?.refresh
  ].filter((v) => typeof v === 'string')
}
