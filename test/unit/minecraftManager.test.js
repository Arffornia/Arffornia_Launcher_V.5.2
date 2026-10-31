import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  launchMSAuth: vi.fn(),
  launchResult: null,
  clients: [],
  downloadNeoforge: vi.fn(async () => '/tmp/neoforge-installer.jar'),
  nexusJavaInstalled: true,
  downloadAndExtract: vi.fn(),
  updateMods: vi.fn(),
  sent: [],
  notifications: [],
  allocatedRam: '',
  totalGb: 16
}))

vi.mock('../../src/main/index.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  addNotification: (message, type) => m.notifications.push({ message, type }),
  getMainWindow: () => ({ webContents: { send: (channel, data) => m.sent.push({ channel, data }) } })
}))
vi.mock('../../src/main/ipc', () => ({ handle: vi.fn() }))
vi.mock('../../src/main/ipcHandlers/nexusSaverHandler', () => ({
  saver: { load: vi.fn(async (key) => (key === 'allocatedRam' ? m.allocatedRam : '')) }
}))
vi.mock('os', async (importOriginal) => {
  const real = await importOriginal()
  const totalmem = () => m.totalGb * 1024 ** 3
  return { ...real, totalmem, default: { ...real, totalmem } }
})
vi.mock('../../src/main/msAuthManager', () => ({ launchMSAuth: m.launchMSAuth }))
vi.mock('../../src/main/neoforgeDownloader', () => ({ downloadNeoforge: m.downloadNeoforge }))
vi.mock('../../src/main/utils', () => ({ getArchType: () => 'x64', getOsType: () => 'linux' }))
vi.mock('@arffornia/nexus_java', () => ({
  NexusJava: class {
    isJavaInstalled() {
      return m.nexusJavaInstalled
    }
    downloadAndExtract() {
      return m.downloadAndExtract()
    }
    getJavaPath() {
      return '/java/bin/java'
    }
  },
  JavaType: { JRE: 'jre' },
  JavaVersionInfo: class {}
}))
vi.mock('@arffornia/nexus_mods', () => ({
  NexusMods: class {
    loadModsFromJsonUrl() {}
    loadExternalFilesFromJsonUrl() {}
    updateMods(...args) {
      return m.updateMods(...args)
    }
  }
}))
vi.mock('minecraft-launcher-core', async () => {
  const { EventEmitter } = await import('events')
  return {
    Client: class extends EventEmitter {
      constructor() {
        super()
        m.clients.push(this)
      }
      async launch(opts) {
        this.opts = opts
        return m.launchResult
      }
    }
  }
})

const auth = { access_token: 'token-value-123', uuid: 'abcdef0123456789', name: 'Steve', meta: { xuid: '1234567' } }

let launchMC
beforeEach(async () => {
  vi.resetModules()
  m.clients.length = 0
  m.sent.length = 0
  m.notifications.length = 0
  m.launchResult = null
  m.allocatedRam = ''
  m.totalGb = 16
  m.launchMSAuth.mockReset()
  m.downloadNeoforge.mockClear()
  m.updateMods.mockClear()
  ;({ launchMC } = await import('../../src/main/minecraftManager'))
})

const runningStates = () => m.sent.filter((s) => s.channel === 'gameRunningState').map((s) => s.data.isRunning)

describe('launchMC', () => {
  it('aborts before any download when login fails', async () => {
    m.launchMSAuth.mockResolvedValue(null)
    await launchMC()
    expect(m.downloadNeoforge).not.toHaveBeenCalled()
    expect(m.updateMods).not.toHaveBeenCalled()
    expect(m.clients).toHaveLength(0)
    expect(runningStates()).toEqual([true, false])
  })

  it('aborts when login resolves undefined (auth error path)', async () => {
    m.launchMSAuth.mockResolvedValue(undefined)
    await launchMC()
    expect(m.downloadNeoforge).not.toHaveBeenCalled()
    expect(runningStates()).toEqual([true, false])
  })

  it('passes the resolved authorization to MCLC', async () => {
    m.launchMSAuth.mockResolvedValue(auth)
    m.launchResult = { pid: 42 }
    await launchMC()
    expect(m.clients[0].opts.authorization).toBe(auth)
    expect(runningStates()).toEqual([true])
  })

  it('resets the running state when MCLC returns null', async () => {
    m.launchMSAuth.mockResolvedValue(auth)
    m.launchResult = null
    await launchMC()
    expect(runningStates()).toEqual([true, false])
    expect(m.notifications.some((n) => n.type === 'error')).toBe(true)
  })

  it('allows a new launch after a failed one', async () => {
    m.launchMSAuth.mockResolvedValue(auth)
    await launchMC()
    m.launchResult = { pid: 1 }
    await launchMC()
    expect(m.clients).toHaveLength(2)
  })

  it('resets the running state when the game closes', async () => {
    m.launchMSAuth.mockResolvedValue(auth)
    m.launchResult = { pid: 42 }
    await launchMC()
    m.clients[0].emit('close', 0)
    expect(runningStates()).toEqual([true, false])
  })

  it('redacts credentials from MCLC debug output', async () => {
    const { logger } = await import('../../src/main/index.js')
    m.launchMSAuth.mockResolvedValue(auth)
    m.launchResult = { pid: 42 }
    await launchMC()
    m.clients[0].emit('debug', `[MCLC]: Launching with arguments --accessToken ${auth.access_token} --xuid 1234567`)
    const line = logger.debug.mock.calls.at(-1)[0]
    expect(line).not.toContain(auth.access_token)
    expect(line).not.toContain('1234567')
  })

  it('uses the saved RAM setting', async () => {
    m.launchMSAuth.mockResolvedValue(auth)
    m.launchResult = { pid: 1 }
    m.allocatedRam = '6'
    await launchMC()
    expect(m.clients[0].opts.memory).toEqual({ max: '6G', min: '2G' })
  })

  it('caps the RAM setting below total memory', async () => {
    m.launchMSAuth.mockResolvedValue(auth)
    m.launchResult = { pid: 1 }
    m.allocatedRam = 8
    m.totalGb = 8
    await launchMC()
    expect(m.clients[0].opts.memory).toEqual({ max: '6G', min: '2G' })
  })
})
