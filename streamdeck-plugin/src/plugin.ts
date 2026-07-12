import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as WebSocketLib from 'ws';

const execFileAsync = promisify(execFile);

interface Settings {
  deviceName?: string;
}

let ws: WebSocketLib.WebSocket;
const settingsCache = new Map<string, Settings>();
const connectionState = new Map<string, boolean>(); // Track connection state per context
const executionLock = new Map<string, boolean>(); // Prevent concurrent executions per context

const pluginUUID = 'com.chromusx.bluetooth-connector';
const connectActionUUID = `${pluginUUID}.connect`;

// Resolve the platform-specific native helper relative to bin/plugin.js.
function helperPath(): string {
  if (process.platform === 'win32') {
    return path.join(__dirname, '..', 'BluetoothConnector.exe');
  }
  if (process.platform === 'darwin') {
    return path.join(__dirname, '..', 'BluetoothConnectorMac');
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

function connectElgatoStreamDeckSocket(
  inPort: string,
  inPluginUUID: string,
  inRegisterEvent: string,
  inInfo: string
) {
  ws = new WebSocketLib.WebSocket(`ws://127.0.0.1:${inPort}`);

  ws.on('open', () => {
    ws.send(JSON.stringify({ event: inRegisterEvent, uuid: inPluginUUID }));
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    handleMessage(message);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

function handleMessage(message: any) {
  const { event, action, context, payload } = message;

  switch (event) {
    case 'keyDown':
      if (action === connectActionUUID) {
        handleConnectAction(context, payload?.settings || {});
      }
      break;

    case 'didReceiveSettings':
      if (payload?.settings) {
        settingsCache.set(context, payload.settings);
        // Device may have changed in the Property Inspector: refresh the key.
        syncVisualState(context, payload.settings.deviceName);
      }
      break;

    case 'willAppear':
      if (payload?.settings) {
        settingsCache.set(context, payload.settings);
      }
      // Reflect the device's real connection state on the key.
      syncVisualState(context, payload?.settings?.deviceName);
      break;

    case 'sendToPlugin':
      // The Property Inspector asks for the list of paired devices.
      if (payload?.event === 'getDevices') {
        listDevices().then((devices) => {
          sendToPropertyInspector(context, { event: 'deviceList', devices });
        });
      }
      break;
  }
}

async function handleConnectAction(context: string, settings: Settings) {
  // Check if an execution is already in progress for this context
  if (executionLock.get(context)) {
    logMessage('Action already in progress, ignoring button press');
    return;
  }
  executionLock.set(context, true);

  const deviceName = settings.deviceName || 'AirPods Pro';

  // Determine action based on current connection state
  const isConnected = connectionState.get(context) || false;
  const action = isConnected ? 'disconnect' : 'connect';

  // Set to "Connecting" state (state 1)
  setState(context, 1);

  try {
    const { stdout } = await execFileAsync(helperPath(), [deviceName, action], {
      timeout: 30000,
    });

    if (stdout.includes('SUCCESS')) {
      // Update connection state
      connectionState.set(context, !isConnected);

      if (!isConnected) {
        // Just connected - show connected state
        setState(context, 2);
        setTitle(context, 'Connected!');
        showOK(context);
        playSound('success');
        logMessage(`Connected to ${deviceName}`);
        setTimeout(() => setTitle(context, ''), 2000);
      } else {
        // Just disconnected - return to disconnected state
        setState(context, 0);
        setTitle(context, 'Disconnected!');
        showOK(context);
        playSound('success');
        logMessage(`Disconnected from ${deviceName}`);
        setTimeout(() => setTitle(context, ''), 2000);
      }
    } else {
      // Exited 0 but without a SUCCESS marker: treat as an error so the button
      // never gets stuck on the "Connecting" state.
      showError(context, isConnected, `Unexpected result while trying to ${action} ${deviceName}: ${stdout}`);
    }
  } catch (error: any) {
    // Non-zero exit: device not found, both profiles failed, timeout, etc.
    const detail = error?.stdout || error?.message || 'unknown error';
    showError(context, isConnected, `Failed to ${action} ${deviceName}: ${detail}`);
  } finally {
    // Always release the execution lock
    executionLock.set(context, false);
  }
}

// Show the error state, then revert to the previous state after 3 seconds.
function showError(context: string, wasConnected: boolean, logText: string) {
  setState(context, 3);
  setTitle(context, 'Error!');
  showAlert(context);
  playSound('error');
  logMessage(logText);
  setTimeout(() => {
    setState(context, wasConnected ? 2 : 0);
    setTitle(context, '');
  }, 3000);
}

// Query the executable for the list of paired Bluetooth device names.
async function listDevices(): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync(helperPath(), ['-', 'list'], { timeout: 15000 });
    return stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error: any) {
    logMessage(`Failed to list devices: ${error?.message || error}`);
    return [];
  }
}

// Query the executable for the current connection state of a device.
async function getDeviceStatus(
  deviceName: string
): Promise<'connected' | 'disconnected' | 'unknown'> {
  try {
    const { stdout } = await execFileAsync(helperPath(), [deviceName, 'status'], { timeout: 15000 });
    // Order matters: the string "DISCONNECTED" contains the substring "CONNECTED".
    if (stdout.includes('DISCONNECTED')) return 'disconnected';
    if (stdout.includes('CONNECTED')) return 'connected';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// On appear (or after a settings change), reflect the device's real connection
// state on the key so the icon is correct even after a Stream Deck restart.
async function syncVisualState(context: string, deviceName?: string) {
  if (!deviceName) return;
  const status = await getDeviceStatus(deviceName);
  if (status === 'connected') {
    connectionState.set(context, true);
    setState(context, 2);
  } else if (status === 'disconnected') {
    connectionState.set(context, false);
    setState(context, 0);
  }
  // 'unknown' (e.g. device not currently paired): leave the key as-is.
}

function setState(context: string, state: number) {
  sendEvent('setState', context, { state });
}

function setTitle(context: string, title: string) {
  sendEvent('setTitle', context, { title });
}

function showOK(context: string) {
  sendEvent('showOk', context);
}

function showAlert(context: string) {
  sendEvent('showAlert', context);
}

function logMessage(message: string) {
  sendEvent('logMessage', undefined, { message });
}

function sendToPropertyInspector(context: string, payload: any) {
  ws.send(
    JSON.stringify({
      event: 'sendToPropertyInspector',
      action: connectActionUUID,
      context,
      payload,
    })
  );
}

function playSound(soundType: 'success' | 'error') {
  const command = process.platform === 'darwin' ? '/usr/bin/afplay' : 'powershell.exe';
  const args = process.platform === 'darwin'
    ? [soundType === 'success'
        ? '/System/Library/Sounds/Glass.aiff'
        : '/System/Library/Sounds/Basso.aiff']
    : [
        '-NoProfile',
        '-Command',
        soundType === 'success'
          ? '[System.Media.SystemSounds]::Asterisk.Play()'
          : '[System.Media.SystemSounds]::Exclamation.Play()',
      ];

  execFile(command, args, (error) => {
    if (error) {
      logMessage(`Failed to play sound: ${error.message}`);
    }
  });
}

function sendEvent(event: string, context?: string, payload?: any) {
  const message: any = { event };
  if (context) message.context = context;
  if (payload) message.payload = payload;
  ws.send(JSON.stringify(message));
}

// Parse command line arguments
const args = process.argv.slice(2);
const params: { [key: string]: string } = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^-+/, '');
  const value = args[i + 1];
  if (value) {
    params[key] = value;
  }
}

if (params.port && params.pluginUUID && params.registerEvent && params.info) {
  connectElgatoStreamDeckSocket(
    params.port,
    params.pluginUUID,
    params.registerEvent,
    params.info
  );
} else {
  console.error('Missing required arguments:', params);
  process.exit(1);
}
