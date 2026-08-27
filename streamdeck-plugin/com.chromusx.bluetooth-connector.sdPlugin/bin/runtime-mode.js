"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIAGNOSTIC_PLUGIN_UUID = exports.PRODUCTION_PLUGIN_UUID = void 0;
exports.resolvePluginIdentity = resolvePluginIdentity;
exports.resolvePluginIdentityFromInfo = resolvePluginIdentityFromInfo;
exports.diagnosticErrorTitle = diagnosticErrorTitle;
exports.PRODUCTION_PLUGIN_UUID = 'com.chromusx.bluetooth-connector';
exports.DIAGNOSTIC_PLUGIN_UUID = `${exports.PRODUCTION_PLUGIN_UUID}.diagnostic`;
function resolvePluginIdentity(pluginUUID) {
    return {
        pluginUUID,
        actionUUID: `${pluginUUID}.connect`,
        diagnostic: pluginUUID === exports.DIAGNOSTIC_PLUGIN_UUID,
    };
}
function resolvePluginIdentityFromInfo(info) {
    if (typeof info === 'string') {
        try {
            const pluginUUID = JSON.parse(info)?.plugin?.uuid;
            if (typeof pluginUUID === 'string' && pluginUUID.trim()) {
                return resolvePluginIdentity(pluginUUID);
            }
        }
        catch {
            // Older or malformed launch information falls back to the production UUID.
        }
    }
    return resolvePluginIdentity(exports.PRODUCTION_PLUGIN_UUID);
}
function diagnosticErrorTitle(message) {
    const detail = String(message || '');
    const component = /handsfree|\bhfp\b/i.test(detail)
        ? 'HFP'
        : /audiosink|\ba2dp\b/i.test(detail)
            ? 'A2DP'
            : /audio routing|audioendpointrouter|playback endpoint/i.test(detail)
                ? 'AUDIO'
                : undefined;
    const rawCode = detail.match(/\bfail:(0x[0-9a-f]{1,8})\b/i)?.[1] ||
        detail.match(/\((0x[0-9a-f]{1,8})\)/i)?.[1];
    let code;
    if (rawCode) {
        const numericCode = Number.parseInt(rawCode.slice(2), 16);
        code = Number.isSafeInteger(numericCode) && numericCode <= 99999
            ? String(numericCode)
            : rawCode.toUpperCase();
    }
    return ['ERROR', component, code].filter(Boolean).join('\n');
}
