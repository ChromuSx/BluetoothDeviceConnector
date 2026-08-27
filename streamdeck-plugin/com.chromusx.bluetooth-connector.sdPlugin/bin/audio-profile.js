"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIO_PROFILE_A2DP_HFP = exports.AUDIO_PROFILE_A2DP = void 0;
exports.normalizeAudioProfile = normalizeAudioProfile;
exports.buildHelperArgs = buildHelperArgs;
exports.chooseConnectionAction = chooseConnectionAction;
exports.resolveObservedConnectionState = resolveObservedConnectionState;
exports.resolvePolledConnectionState = resolvePolledConnectionState;
exports.resolveVisualConnectionState = resolveVisualConnectionState;
exports.AUDIO_PROFILE_A2DP = 'a2dp';
exports.AUDIO_PROFILE_A2DP_HFP = 'a2dp-hfp';
// Settings created before audio profiles were configurable have no value here.
// Defaulting them to A2DP + HFP preserves the behavior those keys already had.
function normalizeAudioProfile(value) {
    return value === exports.AUDIO_PROFILE_A2DP
        ? exports.AUDIO_PROFILE_A2DP
        : exports.AUDIO_PROFILE_A2DP_HFP;
}
function buildHelperArgs(deviceName, action, audioProfile, platform) {
    const args = [deviceName, action];
    // The Windows helper can control individual Bluetooth audio services. The
    // macOS beta helper opens/closes the whole Bluetooth connection and its CLI
    // intentionally remains a two-argument interface.
    if (platform === 'win32' && action !== 'list') {
        args.push(normalizeAudioProfile(audioProfile));
    }
    return args;
}
function chooseConnectionAction(isConnected, needsReconcile) {
    return isConnected && !needsReconcile ? 'disconnect' : 'connect';
}
// Prefer an observed endpoint state when it is conclusive. Unknown checks keep
// the last plugin-owned state so a transient helper failure cannot flip a key.
function resolveObservedConnectionState(cachedConnected, observedStatus) {
    if (observedStatus === 'connected')
        return true;
    if (observedStatus === 'disconnected' || observedStatus === 'not-found') {
        return false;
    }
    return cachedConnected;
}
// Background polling is intentionally one-way: it may clear a stale connected
// state, but only a completed connect action may turn a key green. This avoids
// transient Windows endpoints appearing as successful connections.
function resolvePolledConnectionState(cachedConnected, observedStatus) {
    if (observedStatus === 'disconnected' || observedStatus === 'not-found') {
        return false;
    }
    return cachedConnected;
}
// Windows endpoint discovery can briefly report a device as connected while
// audio is not yet usable, so background polling must not create a green key.
// macOS reports the device-wide IOBluetooth connection directly and can safely
// use a conclusive connected observation to restore the visual state.
function resolveVisualConnectionState(cachedConnected, observedStatus, platform) {
    return platform === 'win32'
        ? resolvePolledConnectionState(cachedConnected, observedStatus)
        : resolveObservedConnectionState(cachedConnected, observedStatus);
}
