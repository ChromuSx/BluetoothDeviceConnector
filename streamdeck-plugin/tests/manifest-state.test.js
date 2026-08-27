const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('the plugin exclusively controls its four visual states', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(
    __dirname,
    '..',
    'com.chromusx.bluetooth-connector.sdPlugin',
    'manifest.json'
  ), 'utf8'));
  const action = manifest.Actions.find(
    (candidate) => candidate.UUID === 'com.chromusx.bluetooth-connector.connect'
  );

  assert.ok(action);
  assert.equal(action.DisableAutomaticStates, true);
  assert.deepEqual(
    action.States.map((state) => state.Name),
    ['Disconnected', 'Connecting', 'Connected', 'Error']
  );
});
