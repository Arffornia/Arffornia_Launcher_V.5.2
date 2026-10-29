import { describe, expect, it } from 'vitest'
import { authorizationSecrets, createRedactor, REDACTED } from '../../src/main/redact'

const auth = {
  access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJ4dWlkIjoiMjUzNTQ0MjQ2OTc5MjQ3NSJ9.c2lnbmF0dXJlLXZhbHVl',
  client_token: 'client-token-123456',
  uuid: '0123456789abcdef0123456789abcdef',
  name: 'Steve',
  user_properties: '{}',
  meta: { type: 'msa', xuid: '2535442469792475', demo: false }
}

// Shape of MCLC's "[MCLC]: Launching with arguments ..." debug line.
const launchLine =
  '[MCLC]: Launching with arguments -Xmx8G -Xms3G -cp a.jar:b.jar net.minecraft.client.main.Main ' +
  `--username Steve --version 1.21.1 --gameDir ./.Arffornia_V.5.2 --uuid ${auth.uuid} ` +
  `--accessToken ${auth.access_token} --clientId ${auth.access_token} --xuid ${auth.meta.xuid} ` +
  '--userType msa --versionType release --userProperties {}'

describe('createRedactor', () => {
  it('removes every credential from the MCLC launch line', () => {
    const out = createRedactor(authorizationSecrets(auth))(launchLine)
    expect(out).not.toContain(auth.access_token)
    expect(out).not.toContain(auth.uuid)
    expect(out).not.toContain(auth.meta.xuid)
    expect(out).toContain(`--accessToken ${REDACTED}`)
    expect(out).toContain(`--uuid ${REDACTED}`)
    expect(out).toContain(`--xuid ${REDACTED}`)
    // Non-sensitive context is kept for support.
    expect(out).toContain('--username Steve')
    expect(out).toContain('--version 1.21.1')
    expect(out).toContain('-Xmx8G')
  })

  it('redacts flag values even without known secrets', () => {
    const out = createRedactor()('--accessToken abc.def.ghi --uuid=1234 --userType msa')
    expect(out).toBe(`--accessToken ${REDACTED} --uuid=${REDACTED} --userType msa`)
  })

  it('redacts JWT-shaped strings anywhere', () => {
    const out = createRedactor()(`token=${auth.access_token} done`)
    expect(out).toBe(`token=${REDACTED} done`)
  })

  it('redacts known secrets in game output and dashed uuids', () => {
    const redact = createRedactor(authorizationSecrets(auth))
    expect(redact('Setting user: Steve, xuid 2535442469792475')).toBe(`Setting user: Steve, xuid ${REDACTED}`)
    expect(redact('UUID of player Steve is 01234567-89ab-cdef-0123-456789abcdef')).toBe(
      `UUID of player Steve is ${REDACTED}`
    )
  })

  it('accepts non-string input', () => {
    expect(createRedactor()(42)).toBe('42')
    expect(createRedactor()(new Error('--accessToken xyz'))).toBe(`Error: --accessToken ${REDACTED}`)
  })

  it('ignores very short secret values', () => {
    expect(createRedactor(['abc'])('abc def')).toBe('abc def')
  })
})

describe('authorizationSecrets', () => {
  it('handles missing input', () => {
    expect(authorizationSecrets(null)).toEqual([])
    expect(authorizationSecrets(Promise.resolve())).toEqual([])
  })
})
