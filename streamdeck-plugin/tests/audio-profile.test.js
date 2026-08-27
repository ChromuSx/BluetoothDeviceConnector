const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const {
  AUDIO_PROFILE_A2DP,
  AUDIO_PROFILE_A2DP_HFP,
  buildHelperArgs,
  chooseConnectionAction,
  normalizeAudioProfile,
  resolveObservedConnectionState,
  resolvePolledConnectionState,
} = require('../com.chromusx.bluetooth-connector.sdPlugin/bin/audio-profile.js');
const {
  buildExclusiveConnectionPlan,
  reduceSettingsPatch,
  resolveHandoffDevice,
  resolveStaleConnectHandoff,
} = require('../com.chromusx.bluetooth-connector.sdPlugin/bin/device-handoff.js');

test('legacy and invalid settings preserve the combined profile', () => {
  assert.equal(normalizeAudioProfile(undefined), AUDIO_PROFILE_A2DP_HFP);
  assert.equal(normalizeAudioProfile(null), AUDIO_PROFILE_A2DP_HFP);
  assert.equal(normalizeAudioProfile('unexpected'), AUDIO_PROFILE_A2DP_HFP);
});

test('the stereo-only setting remains selected', () => {
  assert.equal(normalizeAudioProfile(AUDIO_PROFILE_A2DP), AUDIO_PROFILE_A2DP);
});

test('Windows audio commands include the normalized profile', () => {
  assert.deepEqual(
    buildHelperArgs('Qudelix-5K', 'connect', AUDIO_PROFILE_A2DP, 'win32'),
    ['Qudelix-5K', 'connect', 'a2dp']
  );
  assert.deepEqual(
    buildHelperArgs('Qudelix-5K', 'disconnect', undefined, 'win32'),
    ['Qudelix-5K', 'disconnect', 'a2dp-hfp']
  );
  assert.deepEqual(
    buildHelperArgs('Qudelix-5K', 'status', AUDIO_PROFILE_A2DP, 'win32'),
    ['Qudelix-5K', 'status', 'a2dp']
  );
});

test('list and macOS commands keep their existing argument shape', () => {
  assert.deepEqual(buildHelperArgs('-', 'list', AUDIO_PROFILE_A2DP, 'win32'), ['-', 'list']);
  assert.deepEqual(
    buildHelperArgs('AirPods Pro', 'connect', AUDIO_PROFILE_A2DP, 'darwin'),
    ['AirPods Pro', 'connect']
  );
  assert.deepEqual(
    buildHelperArgs('AirPods Pro', 'status', AUDIO_PROFILE_A2DP, 'darwin'),
    ['AirPods Pro', 'status']
  );
});

test('ambiguous Windows state reconnects before normal toggling', () => {
  assert.equal(chooseConnectionAction(false, false), 'connect');
  assert.equal(chooseConnectionAction(true, false), 'disconnect');
  assert.equal(chooseConnectionAction(true, true), 'connect');
  assert.equal(chooseConnectionAction(false, true), 'connect');
});

test('a conclusive endpoint observation replaces stale plugin state', () => {
  assert.equal(resolveObservedConnectionState(true, 'disconnected'), false);
  assert.equal(resolveObservedConnectionState(true, 'not-found'), false);
  assert.equal(resolveObservedConnectionState(false, 'connected'), true);
});

test('an unknown endpoint observation preserves the cached state', () => {
  assert.equal(resolveObservedConnectionState(true, 'unknown'), true);
  assert.equal(resolveObservedConnectionState(false, 'unknown'), false);
});

test('polling clears stale green state but never creates a green state', () => {
  assert.equal(resolvePolledConnectionState(true, 'disconnected'), false);
  assert.equal(resolvePolledConnectionState(true, 'not-found'), false);
  assert.equal(resolvePolledConnectionState(true, 'connected'), true);
  assert.equal(resolvePolledConnectionState(false, 'connected'), false);
  assert.equal(resolvePolledConnectionState(false, 'unknown'), false);
});

test('device changes preserve the first handoff target until the next press', () => {
  const first = resolveHandoffDevice(undefined, 'AirPods Pro', 'Echo Dot');
  assert.equal(first, 'AirPods Pro');
  assert.equal(
    resolveHandoffDevice(first, 'Echo Dot', 'JBL Speaker'),
    'AirPods Pro'
  );
});

test('returning to the original device cancels a pending handoff', () => {
  assert.equal(
    resolveHandoffDevice('AirPods Pro', 'Echo Dot', ' airpods pro '),
    undefined
  );
});

test('single-writer settings keep the first target through rapid A to B to C edits', () => {
  const toEcho = reduceSettingsPatch(
    { deviceName: 'AirPods Pro', audioProfile: AUDIO_PROFILE_A2DP },
    { deviceName: 'Echo Dot' },
    true
  );
  const toJbl = reduceSettingsPatch(
    toEcho.settings,
    { deviceName: 'JBL Speaker' },
    true
  );

  assert.equal(toEcho.handoffFromDeviceName, 'AirPods Pro');
  assert.equal(toJbl.settings.deviceName, 'JBL Speaker');
  assert.equal(toJbl.handoffFromDeviceName, 'AirPods Pro');
  assert.equal(toJbl.needsReconcile, true);
});

test('changing a legacy key preserves its implicit AirPods handoff target', () => {
  const transition = reduceSettingsPatch(
    {},
    { deviceName: 'Echo Dot' },
    true
  );

  assert.equal(transition.deviceChanged, true);
  assert.equal(transition.handoffFromDeviceName, 'AirPods Pro');
  assert.equal(transition.settings.handoffFromDeviceName, 'AirPods Pro');
  assert.equal(transition.needsReconcile, true);
});

test('single-writer settings cancel A to B to A before the key is pressed', () => {
  const toEcho = reduceSettingsPatch(
    { deviceName: 'AirPods Pro' },
    { deviceName: 'Echo Dot' },
    true
  );
  const backToAirPods = reduceSettingsPatch(
    toEcho.settings,
    { deviceName: 'AirPods Pro' },
    true
  );

  assert.equal(backToAirPods.handoffFromDeviceName, undefined);
  assert.equal(backToAirPods.handoffCancelled, true);
  assert.equal(backToAirPods.needsReconcile, false);
  assert.equal(backToAirPods.shouldSyncVisual, true);
});

test('profile-only edits never create a device-to-itself handoff', () => {
  const transition = reduceSettingsPatch(
    { deviceName: 'Echo Dot', audioProfile: AUDIO_PROFILE_A2DP_HFP },
    { audioProfile: AUDIO_PROFILE_A2DP },
    true
  );

  assert.equal(transition.deviceChanged, false);
  assert.equal(transition.profileChanged, true);
  assert.equal(transition.handoffFromDeviceName, undefined);
  assert.equal(transition.needsReconcile, true);
});

test('a stale failed connect is conservatively journaled without self-handoffs', () => {
  assert.equal(
    resolveStaleConnectHandoff('JBL Speaker', 'connect', 'Echo Dot'),
    'Echo Dot'
  );
  assert.equal(
    resolveStaleConnectHandoff('Echo Dot', 'connect', ' echo dot '),
    undefined
  );
  assert.equal(
    resolveStaleConnectHandoff('JBL Speaker', 'disconnect', 'Echo Dot'),
    undefined
  );
});

test('Property Inspector ignores stale public acknowledgements and merges action journals', () => {
  const html = fs.readFileSync(
    require.resolve('../com.chromusx.bluetooth-connector.sdPlugin/ui/property-inspector.html'),
    'utf8'
  );
  const start = html.indexOf('<script>');
  const end = html.indexOf('</script>', start);
  const element = { addEventListener() {}, hidden: false, value: '' };
  const sandbox = {
    console,
    document: { getElementById() { return element; } },
  };
  vm.runInNewContext(html.slice(start + 8, end), sandbox);

  const stale = sandbox.reduceAcceptedSettings(
    { deviceName: 'JBL Speaker' },
    { deviceName: 'AirPods Pro' },
    { deviceName: 'Echo Dot', handoffFromDeviceName: 'AirPods Pro' },
    1,
    2
  );
  assert.equal(stale, null);

  const latest = sandbox.reduceAcceptedSettings(
    { deviceName: 'JBL Speaker' },
    { deviceName: 'AirPods Pro' },
    { deviceName: 'JBL Speaker', handoffFromDeviceName: 'AirPods Pro' },
    2,
    2
  );
  assert.equal(latest.settings.deviceName, 'JBL Speaker');

  const actionAck = sandbox.reduceAcceptedSettings(
    { deviceName: 'JBL Speaker' },
    { deviceName: 'JBL Speaker' },
    { deviceName: 'Echo Dot', handoffFromDeviceName: 'Echo Dot' },
    0,
    2
  );
  assert.equal(actionAck.settings.deviceName, 'JBL Speaker');
  assert.equal(actionAck.settings.handoffFromDeviceName, 'Echo Dot');
});

test('exclusive handoff disconnects a connected or uncertain old target first', () => {
  assert.deepEqual(
    buildExclusiveConnectionPlan('Echo Dot', 'connect', 'AirPods Pro', 'connected'),
    [
      { deviceName: 'AirPods Pro', action: 'disconnect' },
      { deviceName: 'Echo Dot', action: 'connect' },
    ]
  );
  assert.deepEqual(
    buildExclusiveConnectionPlan('Echo Dot', 'connect', 'AirPods Pro', 'unknown'),
    [
      { deviceName: 'AirPods Pro', action: 'disconnect' },
      { deviceName: 'Echo Dot', action: 'connect' },
    ]
  );
});

test('exclusive handoff skips an old target already disconnected or removed', () => {
  for (const status of ['disconnected', 'not-found']) {
    assert.deepEqual(
      buildExclusiveConnectionPlan('Echo Dot', 'connect', 'AirPods Pro', status),
      [{ deviceName: 'Echo Dot', action: 'connect' }]
    );
  }
  assert.deepEqual(
    buildExclusiveConnectionPlan('Echo Dot', 'disconnect', undefined, 'unknown'),
    [{ deviceName: 'Echo Dot', action: 'disconnect' }]
  );
});
