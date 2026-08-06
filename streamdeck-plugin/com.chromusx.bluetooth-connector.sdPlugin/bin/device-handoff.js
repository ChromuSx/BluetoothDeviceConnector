"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DEVICE_NAME = void 0;
exports.reduceSettingsPatch = reduceSettingsPatch;
exports.normalizeDeviceName = normalizeDeviceName;
exports.sameDeviceName = sameDeviceName;
exports.resolveHandoffDevice = resolveHandoffDevice;
exports.buildExclusiveConnectionPlan = buildExclusiveConnectionPlan;
exports.resolveStaleConnectHandoff = resolveStaleConnectHandoff;
const audio_profile_1 = require("./audio-profile");
exports.DEFAULT_DEVICE_NAME = 'AirPods Pro';
// The Property Inspector sends public fields only. The plugin owns and reduces
// the hidden handoff journal so every settings write is ordered on one socket.
function reduceSettingsPatch(previous, publicPatch, isWindows) {
    const settings = { ...previous };
    if (Object.prototype.hasOwnProperty.call(publicPatch, 'deviceName')) {
        settings.deviceName = publicPatch.deviceName;
    }
    if (Object.prototype.hasOwnProperty.call(publicPatch, 'audioProfile')) {
        settings.audioProfile = (0, audio_profile_1.normalizeAudioProfile)(publicPatch.audioProfile);
    }
    const hadHandoff = normalizeOptionalDeviceName(previous.handoffFromDeviceName) !== undefined;
    // An absent deviceName is the legacy representation of DEFAULT_DEVICE_NAME.
    // Treat it as a real previous target so migrating that key to another device
    // can disconnect an already-active default device instead of losing history.
    const previousDeviceName = normalizeDeviceName(previous.deviceName);
    const nextDeviceName = normalizeDeviceName(settings.deviceName);
    const deviceChanged = !sameDeviceName(previousDeviceName, nextDeviceName);
    const profileChanged = isWindows &&
        (0, audio_profile_1.normalizeAudioProfile)(previous.audioProfile) !==
            (0, audio_profile_1.normalizeAudioProfile)(settings.audioProfile);
    const handoffFromDeviceName = resolveHandoffDevice(previous.handoffFromDeviceName, deviceChanged ? previousDeviceName : undefined, settings.deviceName);
    if (handoffFromDeviceName) {
        settings.handoffFromDeviceName = handoffFromDeviceName;
    }
    else {
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
function normalizeDeviceName(value) {
    return normalizeOptionalDeviceName(value) || exports.DEFAULT_DEVICE_NAME;
}
function sameDeviceName(left, right) {
    const leftName = normalizeOptionalDeviceName(left);
    const rightName = normalizeOptionalDeviceName(right);
    return leftName !== undefined &&
        rightName !== undefined &&
        leftName.toLocaleLowerCase() === rightName.toLocaleLowerCase();
}
// Keep the first device selected before a key is switched. Further edits before
// the next press must not replace it, while returning to that device cancels the
// pending handoff.
function resolveHandoffDevice(existingHandoff, previousDevice, nextDevice) {
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
function buildExclusiveConnectionPlan(selectedDevice, selectedAction, handoffFromDevice, handoffStatus) {
    const selected = normalizeDeviceName(selectedDevice);
    const handoffFrom = normalizeOptionalDeviceName(handoffFromDevice);
    if (!handoffFrom || sameDeviceName(handoffFrom, selected)) {
        return [{ deviceName: selected, action: selectedAction }];
    }
    const commands = [];
    if (handoffStatus === 'connected' || handoffStatus === 'unknown') {
        commands.push({ deviceName: handoffFrom, action: 'disconnect' });
    }
    commands.push({ deviceName: selected, action: 'connect' });
    return commands;
}
// A stale connect attempt may have enabled one service before failing or timing
// out. Conservatively disconnect that intermediate target on the next press,
// except when only the profile changed on the same selected device.
function resolveStaleConnectHandoff(selectedDevice, attemptedAction, attemptedDevice) {
    const attempted = normalizeOptionalDeviceName(attemptedDevice);
    if (attemptedAction !== 'connect' ||
        !attempted ||
        sameDeviceName(selectedDevice, attempted)) {
        return undefined;
    }
    return attempted;
}
function normalizeOptionalDeviceName(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
