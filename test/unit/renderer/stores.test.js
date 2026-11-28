// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const modrinth = vi.hoisted(() => ({
  getLatestReleaseFile: vi.fn(),
  getProjectDetails: vi.fn(),
  searchShaders: vi.fn(),
  fetchFeaturedConfig: vi.fn(),
  fetchProjectsBatch: vi.fn()
}))
vi.mock('../../../src/renderer/src/js/modrinthApi', () => ({ modrinthApi: modrinth }))

const { useUserStore } = await import('../../../src/renderer/src/stores/userStore')
const { useNotificationStore } = await import('../../../src/renderer/src/stores/notificationStore')
const { useShaderStore } = await import('../../../src/renderer/src/stores/shaderStore')

let api

beforeEach(() => {
  setActivePinia(createPinia())
  api = {
    logger: vi.fn(),
    loginMS: vi.fn(),
    loginMSNoReAsk: vi.fn(),
    getUserName: vi.fn(async () => 'Steve'),
    saverLoad: vi.fn(),
    saverSave: vi.fn(),
    setLang: vi.fn(),
    getSystemLang: vi.fn(async () => 'fr-FR'),
    getInstalledShaders: vi.fn(async () => []),
    getActiveShader: vi.fn(async () => 'OFF'),
    getShaderMetadata: vi.fn(async () => ({})),
    saveShaderMetadata: vi.fn(),
    downloadShader: vi.fn(),
    deleteShader: vi.fn(async () => true),
    setActiveShader: vi.fn()
  }
  globalThis.window.api = api
  Object.values(modrinth).forEach((fn) => fn.mockReset())
})

describe('userStore', () => {
  it('is logged in with the Minecraft username after a successful login', async () => {
    api.loginMS.mockResolvedValue(true)
    const store = useUserStore()

    await store.login()

    expect(store.isAuth).toBe(true)
    expect(store.profileImg).toContain('Steve')
  })

  it('stays logged out when the main process refuses the login', async () => {
    api.loginMS.mockResolvedValue(false)
    const store = useUserStore()

    await store.login()

    expect(store.isAuth).toBe(false)
  })

  it('does not call the main process again when already logged in', async () => {
    const store = useUserStore()
    store.isAuth = true

    await store.login()

    expect(api.loginMS).not.toHaveBeenCalled()
  })

  it('stays logged out silently when login throws', async () => {
    api.loginMS.mockRejectedValue(new Error('boom'))
    const store = useUserStore()

    await store.login()

    expect(store.isAuth).toBe(false)
    expect(api.logger).toHaveBeenCalledWith('error', expect.stringContaining('boom'))
  })

  it('clears the identity on logout', () => {
    const store = useUserStore()
    store.isAuth = true
    store.username = 'Steve'

    store.logout()

    expect(store.isAuth).toBe(false)
    expect(store.username).toBeNull()
  })

  it('uses the saved language when it is supported', async () => {
    api.saverLoad.mockResolvedValue('fr')
    const locale = ref('en')

    await useUserStore().initLang(locale)

    expect(locale.value).toBe('fr')
    expect(api.setLang).toHaveBeenCalledWith('fr')
  })

  it('falls back to the system language when nothing is saved', async () => {
    api.saverLoad.mockResolvedValue(null)
    const locale = ref('en')

    await useUserStore().initLang(locale)

    expect(locale.value).toBe('fr')
    expect(api.saverSave).toHaveBeenCalledWith('lang', 'fr')
  })

  it('rejects an unsupported language', () => {
    const locale = ref('en')

    useUserStore().setLang(locale, 'xx')

    expect(locale.value).toBe('en')
    expect(api.saverSave).not.toHaveBeenCalled()
  })
})

describe('notificationStore', () => {
  it('removes only the targeted notification', () => {
    const store = useNotificationStore()
    store.addNotification('a')
    store.addNotification('b', 'error')

    store.removeNotification(store.notifications[0].id)

    expect(store.notifications.map((n) => n.messageKey)).toEqual(['b'])
  })

  it('ignores the removal of an unknown id', () => {
    const store = useNotificationStore()
    store.addNotification('a')

    store.removeNotification('missing')

    expect(store.notifications).toHaveLength(1)
  })
})

describe('shaderStore', () => {
  it('loads installed shaders, the active one and metadata', async () => {
    api.getInstalledShaders.mockResolvedValue(['BSL.zip'])
    api.getActiveShader.mockResolvedValue('BSL.zip')
    const store = useShaderStore()

    await store.refreshLocalState()

    expect(store.installedShaders).toEqual(['BSL.zip'])
    expect(store.activeShader).toBe('BSL.zip')
  })

  it('computes at least one page when the catalog is empty', () => {
    expect(useShaderStore().totalPages).toBe(1)
  })

  it('stores catalog results and the page count', async () => {
    modrinth.searchShaders.mockResolvedValue({ hits: [{ slug: 'bsl' }], total_hits: 45 })
    const store = useShaderStore()

    await store.searchCatalog('bsl', 2)

    expect(store.catalogShaders).toEqual([{ slug: 'bsl' }])
    expect(store.totalPages).toBe(3)
    expect(store.isSearching).toBe(false)
  })

  it('keeps the previous catalog and stops the spinner when the search fails', async () => {
    modrinth.searchShaders.mockRejectedValue(new Error('offline'))
    const store = useShaderStore()

    await store.searchCatalog('x')

    expect(store.isSearching).toBe(false)
    expect(api.logger).toHaveBeenCalledWith('error', expect.stringContaining('offline'))
  })

  it('installs a shader once even when requested twice at the same time', async () => {
    modrinth.getLatestReleaseFile.mockResolvedValue({ downloadUrl: 'u', fileName: 'BSL.zip' })
    modrinth.getProjectDetails.mockResolvedValue({ description: 'd' })
    const store = useShaderStore()

    await Promise.all([store.installShader('bsl'), store.installShader('bsl')])

    expect(api.downloadShader).toHaveBeenCalledTimes(1)
  })

  it('reports an error notification when the install fails', async () => {
    modrinth.getLatestReleaseFile.mockRejectedValue(new Error('no release'))
    const store = useShaderStore()

    await store.installShader('bsl')

    const notifications = useNotificationStore().notifications
    expect(notifications.at(-1).messageKey).toBe('notifications.shader_install_failed')
    expect(store.downloadingProjectIds).toEqual([])
  })

  it('moves the active selection to the new file when updating the active shader', async () => {
    const store = useShaderStore()
    store.activeShader = 'old.zip'
    store.availableUpdates['old.zip'] = {
      downloadUrl: 'u',
      newFileName: 'new.zip',
      project: { id: 'p' }
    }

    await store.updateShader('old.zip')

    expect(api.deleteShader).toHaveBeenCalledWith('old.zip')
    expect(api.setActiveShader).toHaveBeenCalledWith('new.zip')
  })

  it('does nothing when no update is known for the shader', async () => {
    await useShaderStore().updateShader('old.zip')

    expect(api.downloadShader).not.toHaveBeenCalled()
  })

  it('notifies when disabling shaders', async () => {
    await useShaderStore().setActiveShader('OFF')

    expect(useNotificationStore().notifications.at(-1).messageKey).toBe(
      'notifications.shaders_disabled'
    )
  })

  it('notifies a failure when activating a shader throws', async () => {
    api.setActiveShader.mockRejectedValue(new Error('x'))

    await useShaderStore().setActiveShader('a.zip')

    expect(useNotificationStore().notifications.at(-1).messageKey).toBe(
      'notifications.shader_activate_failed'
    )
  })

  it('resolves metadata from the already known title without a network call', async () => {
    const store = useShaderStore()
    store.installedMetadata['BSL.zip'] = { title: 'BSL' }

    const result = await store.resolveShaderMetadata('BSL.zip')

    expect(result.title).toBe('BSL')
    expect(modrinth.searchShaders).not.toHaveBeenCalled()
  })

  it('matches an installed file name to a featured shader and persists the metadata', async () => {
    const store = useShaderStore()
    store.featuredShaders = [{ slug: 'bsl-shaders', title: 'BSL Shaders' }]

    const result = await store.resolveShaderMetadata('BSL_Shaders_v8.zip')

    expect(result.slug).toBe('bsl-shaders')
    expect(api.saveShaderMetadata).toHaveBeenCalled()
  })

  it('returns null when Modrinth has nothing for the file', async () => {
    modrinth.searchShaders.mockResolvedValue({ hits: [] })

    expect(await useShaderStore().resolveShaderMetadata('unknown.zip')).toBeNull()
  })

  it('records an update when Modrinth has a different latest file', async () => {
    modrinth.getLatestReleaseFile.mockResolvedValue({ fileName: 'new.zip', downloadUrl: 'u' })
    const store = useShaderStore()
    store.installedShaders = ['old.zip']
    store.installedMetadata = { 'old.zip': { id: 'p' } }

    await store.checkShaderUpdates()

    expect(store.availableUpdates['old.zip'].newFileName).toBe('new.zip')
  })
})
