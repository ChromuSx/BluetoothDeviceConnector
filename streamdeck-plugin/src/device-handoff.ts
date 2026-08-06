import {
  AudioProfile,
  HelperAction,
  normalizeAudioProfile,
} from './audio-profile';

export const DEFAULT_DEVICE_NAME = 'AirPods Pro';

export type DeviceStatus =
  | 'connected'
  | 'disconnected'
  | 'not-found'
  | 'unknown';

export interface DeviceCommand {
  deviceName: string;
  action: Extract<HelperAction, 'connect' | 'disconnect'>;
}

export interface HandoffSettings {
  deviceName?: string;
  audioProfile?: AudioProfile;
  handoffFromDeviceName?: string;
}

export interface HandoffSettingsTransition {
  settings: HandoffSettings;
  deviceChanged: boolean;
  profileChanged: boolean;
  handoffFromDeviceName?: string;
  handoffCancelled: boolean;
  needsReconcile: boolean;
  shouldSyncVisual: boolean;
}

// The Property Inspector sends public fields only. The plugin owns and reduces
// the hidden handoff journal so every settings write is ordered on one socket.
export function reduceSettingsPatch(
  previous: HandoffSettings,
  publicPatch: HandoffSettings,
  isWindows: boolean
): HandoffSettingsTransition {
  const settings: HandoffSettings = { ...previous };
  if (Object.prototype.hasOwnProperty.call(publicPatch, 'deviceName')) {
    settings.deviceName = publicPatch.deviceName;
  }
  if (Object.prototype.hasOwnProperty.call(publicPatch, 'audioProfile')) {
    settings.audioProfile = normalizeAudioProfile(publicPatch.audioProfile);
  }

  const hadHandoff = normalizeOptionalDeviceName(previous.handoffFromDeviceName) !== undefined;
  // An absent deviceName is the legacy representation of DEFAULT_DEVICE_NAME.
  // Treat it as a real previous target so migrating that key to another device
  // can disconnect an already-active default device instead of losing history.
  const previousDeviceName = normalizeDeviceName(previous.deviceName);
  const nextDeviceName = normalizeDeviceName(settings.deviceName);
  const deviceChanged = !sameDeviceName(previousDeviceName, nextDeviceName);
  const profileChanged = isWindows &&
    normalizeAudioProfile(previous.audioProfile) !==
      normalizeAudioProfile(settings.audioProfile);
  const handoffFromDeviceName = resolveHandoffDevice(
    previous.handoffFromDeviceName,
    deviceChanged ? previousDeviceName : undefined,
    settings.deviceName
  );

  if (handoffFromDeviceName) {
    settings.handoffFromDeviceName = handoffFromDeviceName;
  } else {
    delete settings.handoffFromDeviceName;
  }

  const handoffCancelled = hadHandoff && !handoffFromDeviceName;
  const needsReconcile = handoffFromDeviceName !== undefined || profileChanged;
  return {
    settings,
    deviceChanged,
    profileChanged,
    handoffFromDeviceName,
    handoffCancelled,
    needsReconcile,
    shouldSyncVisual: !needsReconcile && (deviceChanged || handoffCancelled),
  };
}

export function normalizeDeviceName(value: unknown): string {
  return normalizeOptionalDeviceName(value) || DEFAULT_DEVICE_NAME;
}

export function sameDeviceName(left: unknown, right: unknown): boolean {
  const leftName = normalizeOptionalDeviceName(left);
  const rightName = normalizeOptionalDeviceName(right);
  return leftName !== undefined &&
    rightName !== undefined &&
    leftName.toLocaleLowerCase() === rightName.toLocaleLowerCase();
}

// Keep the first device selected before a key is switched. Further edits before
// the next press must not replace it, while returning to that device cancels the
// pending handoff.
export function resolveHandoffDevice(
  existingHandoff: unknown,
  previousDevice: unknown,
  nextDevice: unknown
): string | undefined {
  const next = normalizeDeviceName(nextDevice);
  const existing = normalizeOptionalDeviceName(existingHandoff);

  if (existing) {
    return sameDeviceName(existing, next) ? undefined : existing;
  }

  const previous = normalizeOptionalDeviceName(previousDevice);
  return previous && !sameDeviceName(previous, next) ? previous : undefined;
}

// A known-disconnected or removed previous device needs no command. An unknown
// state stays conservative: attempt the disconnect and abort the handoff if it
// fails, rather than silently leaving two audio devices connected.
export function buildExclusiveConnectionPlan(
  selectedDevice: unknown,
  selectedAction: Extract<HelperAction, 'connect' | 'disconnect'>,
  handoffFromDevice: unknown,
  handoffStatus: DeviceStatus
): DeviceCommand[] {
  const selected = normalizeDeviceName(selectedDevice);
  const handoffFrom = normalizeOptionalDeviceName(handoffFromDevice);

  if (!handoffFrom || sameDeviceName(handoffFrom, selected)) {
    return [{ deviceName: selected, action: selectedAction }];
  }

  const commands: DeviceCommand[] = [];
  if (handoffStatus === 'connected' || handoffStatus === 'unknown') {
    commands.push({ deviceName: handoffFrom, action: 'disconnect' });
  }
  commands.push({ deviceName: selected, action: 'connect' });
  return commands;
}

// A stale connect attempt may have enabled one service before failing or timing
// out. Conservatively disconnect that intermediate target on the next press,
// except when only the profile changed on the same selected device.
export function resolveStaleConnectHandoff(
  selectedDevice: unknown,
  attemptedAction: HelperAction | undefined,
  attemptedDevice: unknown
): string | undefined {
  const attempted = normalizeOptionalDeviceName(attemptedDevice);
  if (
    attemptedAction !== 'connect' ||
    !attempted ||
    sameDeviceName(selectedDevice, attempted)
  ) {
    return undefined;
  }
  return attempted;
}

function normalizeOptionalDeviceName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
