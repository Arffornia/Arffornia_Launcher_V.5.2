import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sent = vi.hoisted(() => [])

vi.mock('../../src/main/index.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  getMainWindow: () => ({
    webContents: { send: (channel, payload) => sent.push({ channel, payload }) }
  })
}))

const { progressManager, StepName, handleMCLCEvent, handleNexusModsCallback, handleJavaCallback } =
  await import('../../src/main/progressManager')

beforeEach(() => {
  vi.useFakeTimers()
  progressManager.reset()
  sent.length = 0
})

afterEach(() => {
  vi.useRealTimers()
})

const lastValue = () => sent.at(-1).payload.value

describe('progressManager', () => {
  it('reports zero progress right after a reset', () => {
    expect(progressManager.getGlobalProgress()).toBe(0)
  })

  it('completes every earlier step when a later step starts', () => {
    progressManager.updateStep(StepName.UPDATING_MODS, 0)

    const earlierWeight = 3 + 3 + 24 + 2 + 6 + 2
    expect(progressManager.getGlobalProgress()).toBeCloseTo(earlierWeight / 100, 5)
  })

  it('never lets a step go backwards', () => {
    progressManager.updateStep(StepName.UPDATING_MODS, 0.8)
    const before = progressManager.getGlobalProgress()

    progressManager.updateStep(StepName.UPDATING_MODS, 0.2)

    expect(progressManager.getGlobalProgress()).toBe(before)
  })

  it('clamps out-of-range progress to the 0..1 interval', () => {
    progressManager.updateStep(StepName.LAUNCHING, 5)

    expect(progressManager.getGlobalProgress()).toBeCloseTo(1, 5)
  })

  it('ignores unknown step names', () => {
    progressManager.updateStep('NOPE', 1)

    expect(progressManager.getGlobalProgress()).toBe(0)
  })

  it('sends the step name and mod info to the renderer on globalProgress', () => {
    progressManager.setCurrentModInfo('jei.jar', 3, 10)

    progressManager.updateStep(StepName.UPDATING_MODS, 0.3)

    expect(sent.at(-1)).toMatchObject({
      channel: 'globalProgress',
      payload: { stepName: StepName.UPDATING_MODS, modName: 'jei.jar', modIndex: 3, totalMods: 10 }
    })
  })
})

describe('progress event mapping', () => {
  it('maps Nexus_Mods progress to the mod update step', () => {
    handleNexusModsCallback.onProgress(5, 10, 'a.jar')

    expect(sent.at(-1).payload.stepName).toBe(StepName.UPDATING_MODS)
  })

  it('treats a zero-mod update as no progress instead of dividing by zero', () => {
    handleNexusModsCallback.onProgress(0, 0, '')

    expect(Number.isFinite(lastValue())).toBe(true)
  })

  it('maps Java extraction to the install step', () => {
    handleJavaCallback.onStep('EXTRACTING')

    expect(sent.at(-1).payload.stepName).toBe(StepName.INSTALL_JAVA)
  })

  it('maps MCLC asset progress to the asset step', () => {
    handleMCLCEvent({ type: 'assets', task: 50, total: 100 })

    expect(sent.at(-1).payload.stepName).toBe(StepName.DOWNLOAD_ASSETS)
  })

  it('resets the progress bar five seconds after the assets finish', () => {
    handleMCLCEvent({ type: 'assets', task: 10, total: 10 })
    expect(progressManager.getGlobalProgress()).toBeCloseTo(1, 5)

    vi.advanceTimersByTime(5000)

    expect(progressManager.getGlobalProgress()).toBe(0)
  })
})
