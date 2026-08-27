const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DIAGNOSTIC_PLUGIN_UUID,
  PRODUCTION_PLUGIN_UUID,
  diagnosticErrorTitle,
  resolvePluginIdentity,
  resolvePluginIdentityFromInfo,
} = require('../com.chromusx.bluetooth-connector.sdPlugin/bin/runtime-mode.js');

test('only the private UUID enables diagnostic mode', () => {
  assert.equal(resolvePluginIdentity(PRODUCTION_PLUGIN_UUID).diagnostic, false);
  assert.equal(resolvePluginIdentity(`${PRODUCTION_PLUGIN_UUID}.diagnostic-copy`).diagnostic, false);
  assert.equal(resolvePluginIdentity(DIAGNOSTIC_PLUGIN_UUID).diagnostic, true);
});

test('the action UUID follows the installed plugin UUID', () => {
  assert.equal(
    resolvePluginIdentity(DIAGNOSTIC_PLUGIN_UUID).actionUUID,
    `${DIAGNOSTIC_PLUGIN_UUID}.connect`
  );
});

test('launch info supplies the manifest UUID instead of the random registration token', () => {
  const diagnostic = resolvePluginIdentityFromInfo(JSON.stringify({
    plugin: { uuid: DIAGNOSTIC_PLUGIN_UUID, version: '1.0.0.1' },
  }));
  assert.equal(diagnostic.diagnostic, true);
  assert.equal(diagnostic.actionUUID, `${DIAGNOSTIC_PLUGIN_UUID}.connect`);

  assert.equal(resolvePluginIdentityFromInfo('{invalid').pluginUUID, PRODUCTION_PLUGIN_UUID);
  assert.equal(resolvePluginIdentityFromInfo(undefined).diagnostic, false);
});

test('diagnostic titles identify Bluetooth profiles and compact Windows errors', () => {
  assert.equal(
    diagnosticErrorTitle('Handsfree: fail:0x00000490, AudioSink: ok'),
    'ERROR\nHFP\n1168'
  );
  assert.equal(
    diagnosticErrorTitle('ERROR: No active playback endpoint matches AirPods Max'),
    'ERROR\nAUDIO'
  );
  assert.equal(diagnosticErrorTitle('unexpected failure'), 'ERROR');
});
