"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIO_PROFILE_A2DP_HFP = exports.AUDIO_PROFILE_A2DP = void 0;
exports.normalizeAudioProfile = normalizeAudioProfile;
exports.buildHelperArgs = buildHelperArgs;
exports.chooseConnectionAction = chooseConnectionAction;
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
