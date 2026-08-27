export const AUDIO_PROFILE_A2DP = 'a2dp' as const;
export const AUDIO_PROFILE_A2DP_HFP = 'a2dp-hfp' as const;

export type AudioProfile =
  | typeof AUDIO_PROFILE_A2DP
  | typeof AUDIO_PROFILE_A2DP_HFP;

export type HelperAction = 'connect' | 'disconnect' | 'status' | 'list';
export type ObservedConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'not-found'
  | 'unknown';

// Settings created before audio profiles were configurable have no value here.
// Defaulting them to A2DP + HFP preserves the behavior those keys already had.
export function normalizeAudioProfile(value: unknown): AudioProfile {
  return value === AUDIO_PROFILE_A2DP
    ? AUDIO_PROFILE_A2DP
    : AUDIO_PROFILE_A2DP_HFP;
}

export function buildHelperArgs(
  deviceName: string,
  action: HelperAction,
  audioProfile: unknown,
  platform: NodeJS.Platform
): string[] {
  const args = [deviceName, action];

  // The Windows helper can control individual Bluetooth audio services. The
  // macOS beta helper opens/closes the whole Bluetooth connection and its CLI
  // intentionally remains a two-argument interface.
  if (platform === 'win32' && action !== 'list') {
    args.push(normalizeAudioProfile(audioProfile));
  }

  return args;
}

export function chooseConnectionAction(
  isConnected: boolean,
  needsReconcile: boolean
): 'connect' | 'disconnect' {
  return isConnected && !needsReconcile ? 'disconnect' : 'connect';
}

// Prefer an observed endpoint state when it is conclusive. Unknown checks keep
// the last plugin-owned state so a transient helper failure cannot flip a key.
export function resolveObservedConnectionState(
  cachedConnected: boolean,
  observedStatus: ObservedConnectionStatus
): boolean {
  if (observedStatus === 'connected') return true;
  if (observedStatus === 'disconnected' || observedStatus === 'not-found') {
    return false;
  }
  return cachedConnected;
}

// Background polling is intentionally one-way: it may clear a stale connected
// state, but only a completed connect action may turn a key green. This avoids
// transient Windows endpoints appearing as successful connections.
export function resolvePolledConnectionState(
  cachedConnected: boolean,
  observedStatus: ObservedConnectionStatus
): boolean {
  if (observedStatus === 'disconnected' || observedStatus === 'not-found') {
    return false;
  }
  return cachedConnected;
}
