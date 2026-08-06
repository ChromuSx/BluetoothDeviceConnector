const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

test(
  'the bundled Windows audio router can enumerate active playback endpoints',
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
  }
);
