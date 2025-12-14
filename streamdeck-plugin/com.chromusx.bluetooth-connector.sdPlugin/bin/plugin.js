"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const WebSocketLib = __importStar(require("ws"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ws;
const settingsCache = new Map();
const connectionState = new Map(); // Track connection state per context
const pluginUUID = 'com.chromusx.bluetooth-connector';
const connectActionUUID = `${pluginUUID}.connect`;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
    ws = new WebSocketLib.WebSocket(`ws://127.0.0.1:${inPort}`);
    ws.on('open', () => {
        const registerEvent = {
            event: inRegisterEvent,
            uuid: inPluginUUID,
        };
        ws.send(JSON.stringify(registerEvent));
    });
    ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        handleMessage(message);
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
}
function handleMessage(message) {
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
async function handleConnectAction(context, settings) {
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
            }
            else {
                // Just disconnected - return to disconnected state
                setState(context, 0);
                setTitle(context, 'Disconnected!');
                showOK(context);
                playSound('success');
                logMessage(`Disconnected from ${deviceName}`);
                // Clear title after 2 seconds
                setTimeout(() => setTitle(context, ''), 2000);
            }
        }
        else if (stderr || stdout.includes('ERROR')) {
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
    }
    catch (error) {
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
function setState(context, state) {
    sendEvent('setState', context, { state });
}
function setTitle(context, title) {
    sendEvent('setTitle', context, { title });
}
function showOK(context) {
    sendEvent('showOk', context);
}
function showAlert(context) {
    sendEvent('showAlert', context);
}
function logMessage(message) {
    sendEvent('logMessage', undefined, { message });
}
function playSound(soundType) {
    // Play Windows system sounds using PowerShell
    const soundCommand = soundType === 'success'
        ? '[System.Media.SystemSounds]::Asterisk.Play()'
        : '[System.Media.SystemSounds]::Exclamation.Play()';
    (0, child_process_1.exec)(`powershell -Command "${soundCommand}"`, (error) => {
        if (error) {
            logMessage(`Failed to play sound: ${error.message}`);
        }
    });
}
function sendEvent(event, context, payload) {
    const message = { event };
    if (context)
        message.context = context;
    if (payload)
        message.payload = payload;
    ws.send(JSON.stringify(message));
}
// Parse command line arguments
const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^-+/, '');
    const value = args[i + 1];
    if (value) {
        params[key] = value;
    }
}
if (params.port && params.pluginUUID && params.registerEvent && params.info) {
    connectElgatoStreamDeckSocket(params.port, params.pluginUUID, params.registerEvent, params.info);
}
else {
    console.error('Missing required arguments:', params);
    process.exit(1);
}
