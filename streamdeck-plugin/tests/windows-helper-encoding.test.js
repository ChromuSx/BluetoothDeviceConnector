const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

test(
  'the Windows helper writes Bluetooth names as valid UTF-8',
  { skip: process.platform !== 'win32' },
  async () => {
    const helper = path.resolve(
      __dirname,
      '..',
      'com.chromusx.bluetooth-connector.sdPlugin',
      'BluetoothConnector.exe'
    );
    const unicodeProfile = 'test’猫';

    let failure;
    try {
      await execFileAsync(helper, ['-', 'connect', unicodeProfile], { timeout: 5000 });
    } catch (error) {
      failure = error;
    }

    assert.ok(failure, 'the intentionally invalid profile should fail');
    assert.equal(failure.code, 64);
    assert.equal(
      failure.stdout,
      `ERROR: Unknown audio profile '${unicodeProfile}'. Expected a2dp or a2dp-hfp.\n`
    );
    assert.doesNotMatch(failure.stdout, /\uFFFD|\?/);
  }
);
