import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as WebSocketLib from 'ws';

const execAsync = promisify(exec);

interface Settings {
  deviceName?: string;
}

interface ActionContext {
  action: string;
  context: string;
  device: string;
  payload: {
    settings: Settings;
    coordinates?: { column: number; row: number };
    state?: number;
    userDesiredState?: number;
    isInMultiAction?: boolean;
  };
}

let ws: WebSocketLib.WebSocket;
const settingsCache = new Map<string, Settings>();
const connectionState = new Map<string, boolean>(); // Track connection state per context

const pluginUUID = 'com.chromusx.bluetooth-connector';
const connectActionUUID = `${pluginUUID}.connect`;

function connectElgatoStreamDeckSocket(
  inPort: string,
  inPluginUUID: string,
  inRegisterEvent: string,
  inInfo: string
) {
  ws = new WebSocketLib.WebSocket(`ws://127.0.0.1:${inPort}`);

  ws.on('open', () => {
    const registerEvent = {
      event: inRegisterEvent,
      uuid: inPluginUUID,
    };
    ws.send(JSON.stringify(registerEvent));
  });

  ws.on('message', (data: string) => {
    const message = JSON.parse(data.toString());
    handleMessage(message);
  });

  ws.on('error', (error: Error) => {
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
      }
      break;

    case 'willAppear':
      if (payload?.settings) {
        settingsCache.set(context, payload.settings);
      }
      break;
  }
}

async function handleConnectAction(context: string, settings: Settings) {
  const deviceName = settings.deviceName || 'AirPods Pro';

  // Determine action based on current connection state
  const isConnected = connectionState.get(context) || false;
  const action = isConnected ? 'disconnect' : 'connect';

  // Set to "Connecting" state (state 1)
  setState(context, 1);

  try {
    const pluginPath = process.cwd();
    const exePath = path.join(pluginPath, 'BluetoothConnector.exe');

    const command = `"${exePath}" "${deviceName}" "${action}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
    });

    if (stdout.includes('SUCCESS')) {
      // Update connection state
      connectionState.set(context, !isConnected);

      // Set appropriate visual state
      if (!isConnected) {
        // Just connected - show connected state
        setState(context, 2);
        setTitle(context, 'Connected!');
        showOK(context);
        playSound('success');
        logMessage(`Connected to ${deviceName}`);

        // Clear title after 2 seconds
        setTimeout(() => setTitle(context, ''), 2000);
      } else {
        // Just disconnected - return to disconnected state
        setState(context, 0);
        setTitle(context, 'Disconnected!');
        showOK(context);
        playSound('success');
        logMessage(`Disconnected from ${deviceName}`);

        // Clear title after 2 seconds
        setTimeout(() => setTitle(context, ''), 2000);
      }
    } else if (stderr || stdout.includes('ERROR')) {
      // Set to "Error" state (state 3)
      setState(context, 3);
      setTitle(context, 'Error!');
      showAlert(context);
      playSound('error');
      logMessage(`Failed to ${action}: ${stdout || stderr}`);

      // Return to previous state after 3 seconds, clear title
      setTimeout(() => {
        setState(context, isConnected ? 2 : 0);
        setTitle(context, '');
      }, 3000);
    }
  } catch (error: any) {
    // Set to "Error" state (state 3)
    setState(context, 3);
    setTitle(context, 'Error!');
    showAlert(context);
    playSound('error');
    logMessage(`Error: ${error.message}`);

    // Return to previous state after 3 seconds, clear title
    setTimeout(() => {
      setState(context, isConnected ? 2 : 0);
      setTitle(context, '');
    }, 3000);
  }
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

function playSound(soundType: 'success' | 'error') {
  // Play Windows system sounds using PowerShell
  const soundCommand =
    soundType === 'success'
      ? '[System.Media.SystemSounds]::Asterisk.Play()'
      : '[System.Media.SystemSounds]::Exclamation.Play()';

  exec(`powershell -Command "${soundCommand}"`, (error) => {
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
