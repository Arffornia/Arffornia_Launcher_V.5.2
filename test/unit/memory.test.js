import { describe, expect, it } from 'vitest'
import { computeMemoryOptions, DEFAULT_RAM_GB, maxAllocatableRamGb } from '../../src/main/memory'

describe('maxAllocatableRamGb', () => {
  it.each([
    [16, 14],
    [8, 6],
    [4, 2],
    [3, 1],
    [2, 1],
    [1, 1],
    [0, 1],
    [NaN, 1],
    [15.6, 13]
  ])('total %s GB -> %s GB', (total, expected) => expect(maxAllocatableRamGb(total)).toBe(expected))
})

describe('computeMemoryOptions', () => {
  it('uses the saved value', () => {
    expect(computeMemoryOptions(6, 16)).toEqual({ max: '6G', min: '2G' })
    expect(computeMemoryOptions('10', 16)).toEqual({ max: '10G', min: '2G' })
  })

  it('caps at total minus the reserve', () => {
    expect(computeMemoryOptions(8, 8)).toEqual({ max: '6G', min: '2G' })
    expect(computeMemoryOptions(100, 16)).toEqual({ max: '14G', min: '2G' })
  })

  it('keeps min <= max on small machines', () => {
    expect(computeMemoryOptions(1, 16)).toEqual({ max: '1G', min: '1G' })
    expect(computeMemoryOptions(4, 3)).toEqual({ max: '1G', min: '1G' })
  })

  it.each(['', null, undefined, 'abc', 0, -2, 2.5, {}])('falls back to the default for %j', (value) => {
    expect(computeMemoryOptions(value, 32)).toEqual({ max: `${DEFAULT_RAM_GB}G`, min: '2G' })
  })
})
