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

  showOK(context);

  try {
    const pluginPath = process.cwd();
    const ahkPath = path.join(pluginPath, 'AutoHotkey64.exe');
    const scriptPath = path.join(pluginPath, 'bluetooth_connector.ahk');

    const command = `"${ahkPath}" "${scriptPath}" "${deviceName}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
    });

    if (stdout.includes('SUCCESS')) {
      showOK(context);
      logMessage(`Connected to ${deviceName}`);
    } else if (stderr || stdout.includes('ERROR')) {
      showAlert(context);
      logMessage(`Failed to connect: ${stdout || stderr}`);
    }
  } catch (error: any) {
    showAlert(context);
    logMessage(`Error: ${error.message}`);
  }
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
