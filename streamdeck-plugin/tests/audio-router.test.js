const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

test(
  'the bundled Windows audio router reports active and missing playback endpoints',
  { skip: process.platform !== 'win32' },
  async () => {
    const helper = path.resolve(
      __dirname,
      '..',
      'com.chromusx.bluetooth-connector.sdPlugin',
      'AudioEndpointRouter.exe'
    );
    const { stdout } = await execFileAsync(helper, ['--list'], { timeout: 5000 });
    assert.match(stdout, /^RENDER: .+/m);

    const activeRender = stdout.match(/^RENDER: (.+)$/m)?.[1]?.trim();
    assert.ok(activeRender);
    const activeStatus = await execFileAsync(
      helper,
      ['--status', activeRender],
      { timeout: 5000 }
    );
    assert.equal(activeStatus.stdout.trim(), 'CONNECTED');

    const missingStatus = await execFileAsync(
      helper,
      ['--status', '__BluetoothDeviceConnector_missing_endpoint__'],
      { timeout: 5000 }
    );
    assert.equal(missingStatus.stdout.trim(), 'DISCONNECTED');
  }
);
