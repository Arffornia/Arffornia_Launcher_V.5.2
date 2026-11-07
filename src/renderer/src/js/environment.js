import { DEFAULT_ENVIRONMENT, environmentConfig } from '../../../shared/channel'

let current = environmentConfig(DEFAULT_ENVIRONMENT)

/** Called once before the app mounts; production if main can't answer. */
export async function loadEnvironment() {
  try {
    current = (await window.api.getEnvironment()) || current
  } catch {
    // keep production
  }
  return current
}

export function currentEnvironment() {
  return current
}
