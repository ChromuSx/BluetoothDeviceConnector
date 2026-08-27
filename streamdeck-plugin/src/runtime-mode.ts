export const PRODUCTION_PLUGIN_UUID = 'com.chromusx.bluetooth-connector';
export const DIAGNOSTIC_PLUGIN_UUID = `${PRODUCTION_PLUGIN_UUID}.diagnostic`;

export interface PluginIdentity {
  pluginUUID: string;
  actionUUID: string;
  diagnostic: boolean;
}

export function resolvePluginIdentity(pluginUUID: string): PluginIdentity {
  return {
    pluginUUID,
    actionUUID: `${pluginUUID}.connect`,
    diagnostic: pluginUUID === DIAGNOSTIC_PLUGIN_UUID,
  };
}

export function resolvePluginIdentityFromInfo(info: unknown): PluginIdentity {
  if (typeof info === 'string') {
    try {
      const pluginUUID = JSON.parse(info)?.plugin?.uuid;
      if (typeof pluginUUID === 'string' && pluginUUID.trim()) {
        return resolvePluginIdentity(pluginUUID);
      }
    } catch {
      // Older or malformed launch information falls back to the production UUID.
    }
  }
  return resolvePluginIdentity(PRODUCTION_PLUGIN_UUID);
}

export function diagnosticErrorTitle(message: unknown): string {
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
  let code: string | undefined;
  if (rawCode) {
    const numericCode = Number.parseInt(rawCode.slice(2), 16);
    code = Number.isSafeInteger(numericCode) && numericCode <= 99999
      ? String(numericCode)
      : rawCode.toUpperCase();
  }

  return ['ERROR', component, code].filter(Boolean).join('\n');
}
