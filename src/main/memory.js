// Java heap size for the game, from the player's "allocatedRam" setting (in GB).

/** Same default as the Settings page when nothing is saved yet. */
export const DEFAULT_RAM_GB = 5
/** Memory left to the OS and the launcher. */
export const RESERVED_RAM_GB = 2
export const MIN_RAM_GB = 1
/** Initial heap, capped by the max heap. */
export const INITIAL_HEAP_GB = 2

/**
 * Largest heap the player may select, in whole GB.
 * @param {number} totalGb - total system memory in GB (floor)
 * @returns {number}
 */
export function maxAllocatableRamGb(totalGb) {
  const total = Number.isFinite(totalGb) ? Math.floor(totalGb) : 0
  return Math.max(MIN_RAM_GB, total - RESERVED_RAM_GB)
}

/**
 * MCLC `memory` option from the saved setting.
 * @param {unknown} allocatedRam - saved value (number or numeric string, GB); '' or invalid = default
 * @param {number} totalGb - total system memory in GB
 * @returns {{ max: string, min: string }}
 */
export function computeMemoryOptions(allocatedRam, totalGb) {
  const cap = maxAllocatableRamGb(totalGb)
  const parsed =
    typeof allocatedRam === 'number'
      ? allocatedRam
      : typeof allocatedRam === 'string' && allocatedRam.trim() !== ''
        ? Number(allocatedRam)
        : NaN
  const requested = Number.isInteger(parsed) && parsed >= MIN_RAM_GB ? parsed : DEFAULT_RAM_GB
  const max = Math.min(requested, cap)
  const min = Math.min(INITIAL_HEAP_GB, max)
  return { max: `${max}G`, min: `${min}G` }
}
