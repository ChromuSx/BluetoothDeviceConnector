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
const audio_profile_1 = require("./audio-profile");
const device_handoff_1 = require("./device-handoff");
const runtime_mode_1 = require("./runtime-mode");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let ws;
const settingsCache = new Map();
const connectionState = new Map(); // Track connection state per context
const needsReconcile = new Set(); // A Windows profile choice must be applied before toggling off.
const pendingHandoff = new Map(); // Previous target to disconnect on this context's next press.
const executionLock = new Map(); // Prevent concurrent executions per context
const stateRevision = new Map(); // Ignore status checks made stale by actions/settings.
const feedbackRevision = new Map(); // Prevent old UI timers overwriting newer actions/settings.
const pendingSettingsEchoes = new Map(); // Ignore our own delayed setSettings echoes.
const visibleContexts = new Set(); // Poll only actions currently visible on Stream Deck.
const statusPollTimers = new Map();
const STATUS_POLL_INTERVAL_MS = 5000;
let connectActionUUID = `${runtime_mode_1.PRODUCTION_PLUGIN_UUID}.connect`;
let diagnosticMode = false;
// Resolve the platform-specific native helper relative to bin/plugin.js.
function helperPath() {
    if (process.platform === 'win32') {
        return path.join(__dirname, '..', 'BluetoothConnector.exe');
    }
    if (process.platform === 'darwin') {
        return path.join(__dirname, '..', 'BluetoothConnectorMac');
    }
    throw new Error(`Unsupported platform: ${process.platform}`);
}
// Windows can keep playing through a previously connected Bluetooth endpoint
// even after the selected device connects successfully. This helper makes the
// selected device the default Core Audio endpoint and verifies the change.
function audioRouterPath() {
    return path.join(__dirname, '..', 'AudioEndpointRouter.exe');
}
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
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
                const incomingSettings = payload.settings;
                if (consumeSettingsEcho(context, incomingSettings)) {
                    break;
                }
                acceptSettingsSnapshot(context, incomingSettings, false);
            }
            break;
        case 'willAppear': {
            let appearanceSettings = (payload?.settings || {});
            startStatusPolling(context);
            if (payload?.settings) {
                const cachedSettings = settingsCache.get(context);
                const hasPendingWrite = (pendingSettingsEchoes.get(context)?.length || 0) > 0;
                if (cachedSettings && hasPendingWrite) {
                    // A stale appearance event can cross an in-flight setSettings echo.
                    // Keep the plugin-owned snapshot until Stream Deck acknowledges it.
                    appearanceSettings = cachedSettings;
                }
                else {
                    settingsCache.set(context, appearanceSettings);
                }
                const handoffFromDeviceName = (0, device_handoff_1.resolveHandoffDevice)(appearanceSettings.handoffFromDeviceName, undefined, appearanceSettings.deviceName);
                if (handoffFromDeviceName) {
                    pendingHandoff.set(context, handoffFromDeviceName);
                    needsReconcile.add(context);
                    connectionState.set(context, false);
                    invalidatePendingStatus(context);
                    setState(context, 0);
                    break;
                }
                pendingHandoff.delete(context);
            }
            // Reflect the device's real connection state on the key.
            syncVisualState(context, appearanceSettings);
            break;
        }
        case 'willDisappear':
            stopStatusPolling(context);
            break;
        case 'sendToPlugin':
            // The Property Inspector asks for the list of paired devices.
            if (payload?.event === 'getDevices') {
                listDevices().then((devices) => {
                    sendToPropertyInspector(context, { event: 'deviceList', devices });
                });
            }
            else if (payload?.event === 'updateSettings') {
                applyPropertyInspectorSettings(context, payload.settings || {}, payload.initialSettings || {}, payload.requestId);
            }
            break;
    }
}
function applyPropertyInspectorSettings(context, publicSettings, initialSettings, requestId) {
    let currentSettings = settingsCache.get(context);
    if (!currentSettings) {
        currentSettings = { ...initialSettings };
        settingsCache.set(context, currentSettings);
    }
    const transition = (0, device_handoff_1.reduceSettingsPatch)(currentSettings, publicSettings, process.platform === 'win32');
    const nextSettings = transition.settings;
    if (transition.handoffFromDeviceName) {
        pendingHandoff.set(context, transition.handoffFromDeviceName);
    }
    else {
        pendingHandoff.delete(context);
    }
    if (settingsKey(currentSettings) !== settingsKey(nextSettings)) {
        invalidateFeedback(context);
    }
    settingsCache.set(context, nextSettings);
    persistSettings(context, nextSettings);
    if (transition.needsReconcile) {
        needsReconcile.add(context);
        connectionState.set(context, false);
        invalidatePendingStatus(context);
        setState(context, 0);
    }
    else if (transition.shouldSyncVisual) {
        if (transition.handoffCancelled)
            needsReconcile.delete(context);
        syncVisualState(context, nextSettings);
    }
    sendAcceptedSettings(context, requestId);
}
function acceptSettingsSnapshot(context, incomingSettings, persistAlways) {
    const previousSettings = settingsCache.get(context);
    const nextSettings = { ...incomingSettings };
    const hadPendingHandoff = pendingHandoff.has(context) ||
        normalizeHandoffName(previousSettings?.handoffFromDeviceName) !== '';
    const previousDeviceName = previousSettings
        ? (0, device_handoff_1.normalizeDeviceName)(previousSettings.deviceName)
        : undefined;
    const deviceChanged = previousSettings !== undefined &&
        !(0, device_handoff_1.sameDeviceName)(previousDeviceName, (0, device_handoff_1.normalizeDeviceName)(nextSettings.deviceName));
    const profileChanged = process.platform === 'win32' &&
        (0, audio_profile_1.normalizeAudioProfile)(previousSettings?.audioProfile) !==
            (0, audio_profile_1.normalizeAudioProfile)(nextSettings.audioProfile);
    const handoffFromDeviceName = (0, device_handoff_1.resolveHandoffDevice)(nextSettings.handoffFromDeviceName || previousSettings?.handoffFromDeviceName, deviceChanged ? previousDeviceName : undefined, nextSettings.deviceName);
    if (handoffFromDeviceName) {
        nextSettings.handoffFromDeviceName = handoffFromDeviceName;
        pendingHandoff.set(context, handoffFromDeviceName);
    }
    else {
        delete nextSettings.handoffFromDeviceName;
        pendingHandoff.delete(context);
    }
    if (previousSettings && settingsKey(previousSettings) !== settingsKey(nextSettings)) {
        invalidateFeedback(context);
    }
    settingsCache.set(context, nextSettings);
    if (persistAlways ||
        normalizeHandoffName(incomingSettings.handoffFromDeviceName) !==
            normalizeHandoffName(nextSettings.handoffFromDeviceName)) {
        persistSettings(context, nextSettings);
    }
    if (handoffFromDeviceName || profileChanged) {
        // Editing settings never touches hardware. The next key press performs the
        // exclusive handoff or applies the selected Windows audio profile.
        needsReconcile.add(context);
        connectionState.set(context, false);
        invalidatePendingStatus(context);
        setState(context, 0);
    }
    else if (deviceChanged || hadPendingHandoff) {
        if (hadPendingHandoff) {
            // Returning to the original device before pressing the key cancels the
            // pending handoff. A2DP sync may add reconciliation back when needed.
            needsReconcile.delete(context);
        }
        syncVisualState(context, nextSettings);
    }
}
async function handleConnectAction(context, settings) {
    // Check if an execution is already in progress for this context
    if (executionLock.get(context)) {
        logMessage('Action already in progress, ignoring button press');
        return;
    }
    executionLock.set(context, true);
    invalidatePendingStatus(context);
    invalidateFeedback(context);
    // Settings updates are serialized through this plugin. Prefer the cache so
    // a delayed keyDown payload can never act on a device the PI already changed.
    settings = settingsCache.get(context) || settings;
    if (!settingsCache.has(context))
        settingsCache.set(context, settings);
    const deviceName = (0, device_handoff_1.normalizeDeviceName)(settings.deviceName);
    const audioProfile = (0, audio_profile_1.normalizeAudioProfile)(settings.audioProfile);
    const operationSettingsKey = settingsKey(settings);
    const handoffFromDeviceName = pendingHandoff.get(context) ||
        (0, device_handoff_1.resolveHandoffDevice)(settings.handoffFromDeviceName, undefined, deviceName);
    if (handoffFromDeviceName) {
        pendingHandoff.set(context, handoffFromDeviceName);
    }
    let action = 'connect';
    let wasConnected = false;
    // Set to "Connecting" state (state 1)
    setState(context, 1);
    let attemptedCommand;
    try {
        let isConnected = connectionState.get(context) || false;
        const shouldReconcile = needsReconcile.has(context);
        if (!handoffFromDeviceName) {
            // External disconnects (closing a case, changing host, etc.) do not emit
            // a Stream Deck event. Refresh from the active Windows audio endpoint so
            // a stale green key cannot issue the opposite operation.
            const observedStatus = await getEffectiveConnectionStatus(deviceName, audioProfile);
            if (settingsChangedDuringOperation(context, operationSettingsKey)) {
                keepNewSettingsPending(context, undefined, deviceName);
                return;
            }
            isConnected = (0, audio_profile_1.resolveObservedConnectionState)(isConnected, observedStatus);
            if (observedStatus !== 'unknown') {
                connectionState.set(context, isConnected);
            }
        }
        action = handoffFromDeviceName
            ? 'connect'
            : (0, audio_profile_1.chooseConnectionAction)(isConnected, shouldReconcile);
        wasConnected = !handoffFromDeviceName && isConnected && !shouldReconcile;
        setTitle(context, 'Wait...');
        let handoffStatus = 'not-found';
        if (handoffFromDeviceName) {
            handoffStatus = await getEffectiveConnectionStatus(handoffFromDeviceName, audioProfile);
            if (settingsChangedDuringOperation(context, operationSettingsKey)) {
                keepNewSettingsPending(context, undefined, deviceName);
                return;
            }
        }
        const commands = (0, device_handoff_1.buildExclusiveConnectionPlan)(deviceName, action, handoffFromDeviceName, handoffStatus);
        for (const command of commands) {
            attemptedCommand = command;
            const helperArgs = (0, audio_profile_1.buildHelperArgs)(command.deviceName, command.action, audioProfile, process.platform);
            const { stdout } = await execFileAsync(helperPath(), helperArgs, { timeout: 30000 });
            if (!stdout.includes('SUCCESS')) {
                throw new Error(`Unexpected result while trying to ${command.action} ` +
                    `${command.deviceName}: ${stdout}`);
            }
            if (settingsChangedDuringOperation(context, operationSettingsKey)) {
                keepNewSettingsPending(context, command.action, command.deviceName);
                return;
            }
            if (handoffFromDeviceName &&
                command.action === 'disconnect' &&
                (0, device_handoff_1.sameDeviceName)(command.deviceName, handoffFromDeviceName)) {
                logMessage(`Disconnected previous device ${handoffFromDeviceName}`);
            }
        }
        const didConnect = commands[commands.length - 1].action === 'connect';
        if (didConnect && process.platform === 'win32') {
            const { stdout, stderr } = await execFileAsync(audioRouterPath(), [deviceName, audioProfile], { timeout: 20000 });
            if (!stdout.includes('SUCCESS')) {
                throw new Error(`Audio routing did not complete for ${deviceName}: ${stderr || stdout}`);
            }
            if (settingsChangedDuringOperation(context, operationSettingsKey)) {
                keepNewSettingsPending(context, 'connect', deviceName);
                return;
            }
            logMessage(`Routed Windows audio: ${stdout.trim()}`);
        }
        connectionState.set(context, didConnect);
        needsReconcile.delete(context);
        if (didConnect) {
            clearPendingHandoff(context);
            // Just connected - show connected state
            setState(context, 2);
            setTitle(context, 'Connected!');
            playSound('success');
            logMessage(`Connected to ${deviceName} using ${audioProfile}`);
            scheduleFeedback(context, () => setTitle(context, ''), 2000);
        }
        else {
            // Just disconnected - return to disconnected state
            setState(context, 0);
            setTitle(context, 'Disconnected!');
            playSound('success');
            logMessage(`Disconnected from ${deviceName}`);
            scheduleFeedback(context, () => setTitle(context, ''), 2000);
        }
    }
    catch (error) {
        // Non-zero exit: device not found, both profiles failed, timeout, etc.
        const detail = error?.stdout || error?.stderr || error?.message || 'unknown error';
        if (settingsChangedDuringOperation(context, operationSettingsKey)) {
            const attemptedConnect = attemptedCommand?.action === 'connect';
            keepNewSettingsPending(context, attemptedConnect ? 'connect' : undefined, attemptedCommand?.deviceName || deviceName);
            return;
        }
        if (attemptedCommand?.action === 'connect') {
            // The helper may have toggled one service before failing or timing out.
            // Keep that attempted target as the next cleanup source, even when it is
            // still the selected device; a later B→C edit will then disconnect B.
            persistPendingHandoff(context, attemptedCommand.deviceName);
            needsReconcile.add(context);
            connectionState.set(context, false);
        }
        showError(context, wasConnected, `Failed to ${action} ${deviceName}: ${detail}`);
    }
    finally {
        // Always release the execution lock
        invalidatePendingStatus(context);
        executionLock.set(context, false);
    }
}
// Show the error state, then revert to the previous state after 3 seconds.
function showError(context, wasConnected, logText) {
    setState(context, 3);
    setTitle(context, diagnosticMode ? (0, runtime_mode_1.diagnosticErrorTitle)(logText) : 'Error!');
    showAlert(context);
    playSound('error');
    logMessage(logText);
    if (diagnosticMode && process.platform === 'win32') {
        showDiagnosticDialog(logText);
    }
    scheduleFeedback(context, () => {
        setState(context, wasConnected ? 2 : 0);
        setTitle(context, '');
    }, diagnosticMode ? 30000 : 3000);
}
function showDiagnosticDialog(logText) {
    const scriptPath = path.join(__dirname, '..', 'ShowDiagnosticError.ps1');
    const message = [
        'Bluetooth Device Connector diagnostic result',
        '',
        String(logText || 'Unknown error').trim(),
        '',
        'Please use Copy diagnostic and include the result in your GitHub issue or support request.',
    ].join('\r\n');
    (0, child_process_1.execFile)('powershell.exe', [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-STA',
        '-File',
        scriptPath,
        '-Message',
        message,
    ], { windowsHide: true }, (error) => {
        if (error)
            logMessage(`Failed to show diagnostic dialog: ${error.message}`);
    });
}
// Query the executable for the list of paired Bluetooth device names.
async function listDevices() {
    try {
        const { stdout } = await execFileAsync(helperPath(), ['-', 'list'], { timeout: 15000 });
        return stdout
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }
    catch (error) {
        logMessage(`Failed to list devices: ${error?.message || error}`);
        return [];
    }
}
// Query the executable for the current connection state of a device.
async function getDeviceStatus(deviceName, audioProfile) {
    try {
        const helperArgs = (0, audio_profile_1.buildHelperArgs)(deviceName, 'status', audioProfile, process.platform);
        const { stdout } = await execFileAsync(helperPath(), helperArgs, { timeout: 15000 });
        // Order matters: the string "DISCONNECTED" contains the substring "CONNECTED".
        if (stdout.includes('DISCONNECTED'))
            return 'disconnected';
        if (stdout.includes('CONNECTED'))
            return 'connected';
        return 'unknown';
    }
    catch (error) {
        const detail = String(error?.stdout || error?.stderr || error?.message || '');
        if (detail.toLocaleLowerCase().includes('not found'))
            return 'not-found';
        return 'unknown';
    }
}
// Windows can report a Bluetooth device-wide connection while both audio
// services are inactive. An active render endpoint is the state relevant to
// this action and is therefore the authoritative Windows signal.
async function getAudioEndpointStatus(deviceName) {
    try {
        const { stdout } = await execFileAsync(audioRouterPath(), ['--status', deviceName], { timeout: 5000 });
        // Order matters: the string "DISCONNECTED" contains "CONNECTED".
        if (stdout.includes('DISCONNECTED'))
            return 'disconnected';
        if (stdout.includes('CONNECTED'))
            return 'connected';
        return 'unknown';
    }
    catch {
        return 'unknown';
    }
}
function getEffectiveConnectionStatus(deviceName, audioProfile) {
    return process.platform === 'win32'
        ? getAudioEndpointStatus(deviceName)
        : getDeviceStatus(deviceName, audioProfile);
}
// On appear (or after a settings change), reflect the device's real connection
// state on the key so the icon is correct even after a Stream Deck restart.
async function syncVisualState(context, settings) {
    if (!settings.deviceName)
        return;
    const revision = (stateRevision.get(context) || 0) + 1;
    stateRevision.set(context, revision);
    const status = await getEffectiveConnectionStatus(settings.deviceName, settings.audioProfile);
    // Ignore a stale status request that completed after settings changed or the
    // user pressed the key.
    if (stateRevision.get(context) !== revision || needsReconcile.has(context))
        return;
    if (status !== 'unknown') {
        const isConnected = (0, audio_profile_1.resolveVisualConnectionState)(connectionState.get(context) || false, status, process.platform);
        connectionState.set(context, isConnected);
        if (!isConnected)
            needsReconcile.delete(context);
        setState(context, isConnected ? 2 : 0);
    }
    // 'unknown' (e.g. device not currently paired): leave the key as-is.
}
function startStatusPolling(context) {
    stopStatusPolling(context);
    visibleContexts.add(context);
    const poll = async () => {
        if (!visibleContexts.has(context))
            return;
        if (!executionLock.get(context)) {
            const settings = settingsCache.get(context);
            if (settings)
                await syncVisualState(context, settings);
        }
        if (visibleContexts.has(context)) {
            statusPollTimers.set(context, setTimeout(poll, STATUS_POLL_INTERVAL_MS));
        }
    };
    statusPollTimers.set(context, setTimeout(poll, STATUS_POLL_INTERVAL_MS));
}
function stopStatusPolling(context) {
    visibleContexts.delete(context);
    const timer = statusPollTimers.get(context);
    if (timer)
        clearTimeout(timer);
    statusPollTimers.delete(context);
    invalidatePendingStatus(context);
}
function invalidatePendingStatus(context) {
    stateRevision.set(context, (stateRevision.get(context) || 0) + 1);
}
function invalidateFeedback(context) {
    feedbackRevision.set(context, (feedbackRevision.get(context) || 0) + 1);
}
function scheduleFeedback(context, callback, delayMs) {
    const revision = feedbackRevision.get(context) || 0;
    setTimeout(() => {
        if ((feedbackRevision.get(context) || 0) === revision)
            callback();
    }, delayMs);
}
function settingsKey(settings) {
    return JSON.stringify([
        (0, device_handoff_1.normalizeDeviceName)(settings.deviceName),
        (0, audio_profile_1.normalizeAudioProfile)(settings.audioProfile),
        normalizeHandoffName(settings.handoffFromDeviceName),
    ]);
}
function settingsChangedDuringOperation(context, operationSettingsKey) {
    const currentSettings = settingsCache.get(context);
    return currentSettings !== undefined && settingsKey(currentSettings) !== operationSettingsKey;
}
function normalizeHandoffName(value) {
    return typeof value === 'string' ? value.trim().toLocaleLowerCase() : '';
}
function persistSettings(context, settings) {
    settingsCache.set(context, settings);
    const echoes = pendingSettingsEchoes.get(context) || [];
    echoes.push(settingsKey(settings));
    // A context should only have a few in-flight writes, but keep the tracker
    // bounded if Stream Deck closes before echoing an update.
    if (echoes.length > 20)
        echoes.splice(0, echoes.length - 20);
    pendingSettingsEchoes.set(context, echoes);
    sendEvent('setSettings', context, settings);
}
function consumeSettingsEcho(context, settings) {
    const echoes = pendingSettingsEchoes.get(context);
    if (!echoes)
        return false;
    const index = echoes.indexOf(settingsKey(settings));
    if (index === -1)
        return false;
    // Stream Deck preserves write order but may coalesce notifications. If a
    // later echo arrives, every earlier queued snapshot is obsolete as well.
    echoes.splice(0, index + 1);
    if (echoes.length === 0)
        pendingSettingsEchoes.delete(context);
    return true;
}
function sendAcceptedSettings(context, requestId) {
    const settings = settingsCache.get(context);
    if (settings) {
        sendToPropertyInspector(context, {
            event: 'settingsAccepted',
            settings,
            requestId,
        });
    }
}
function persistPendingHandoff(context, deviceName) {
    const normalizedDeviceName = (0, device_handoff_1.normalizeDeviceName)(deviceName);
    pendingHandoff.set(context, normalizedDeviceName);
    const currentSettings = settingsCache.get(context);
    if (currentSettings &&
        !(0, device_handoff_1.sameDeviceName)(currentSettings.handoffFromDeviceName, normalizedDeviceName)) {
        const nextSettings = {
            ...currentSettings,
            handoffFromDeviceName: normalizedDeviceName,
        };
        settingsCache.set(context, nextSettings);
        persistSettings(context, nextSettings);
    }
    sendAcceptedSettings(context);
}
function clearPendingHandoff(context) {
    pendingHandoff.delete(context);
    const currentSettings = settingsCache.get(context);
    if (currentSettings?.handoffFromDeviceName) {
        const nextSettings = { ...currentSettings };
        delete nextSettings.handoffFromDeviceName;
        settingsCache.set(context, nextSettings);
        persistSettings(context, nextSettings);
    }
    sendAcceptedSettings(context);
}
function keepNewSettingsPending(context, completedAction, previousDeviceName) {
    const selectedDeviceName = settingsCache.get(context)?.deviceName;
    const staleHandoffDeviceName = (0, device_handoff_1.resolveStaleConnectHandoff)(selectedDeviceName, completedAction, previousDeviceName);
    if (staleHandoffDeviceName) {
        // The now-stale target may really be connected. Make it the next handoff
        // source so a rapid settings change cannot leave two devices active.
        persistPendingHandoff(context, staleHandoffDeviceName);
    }
    needsReconcile.add(context);
    connectionState.set(context, false);
    setState(context, 0);
    setTitle(context, '');
    logMessage(`Ignored stale ${completedAction || 'status'} result for ${previousDeviceName}; ` +
        'the next press will apply the updated settings');
}
function setState(context, state) {
    sendEvent('setState', context, { state });
}
function setTitle(context, title) {
    sendEvent('setTitle', context, { title });
}
function showAlert(context) {
    sendEvent('showAlert', context);
}
function logMessage(message) {
    sendEvent('logMessage', undefined, { message });
}
function sendToPropertyInspector(context, payload) {
    ws.send(JSON.stringify({
        event: 'sendToPropertyInspector',
        action: connectActionUUID,
        context,
        payload,
    }));
}
function playSound(soundType) {
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
    (0, child_process_1.execFile)(command, args, (error) => {
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
    // -pluginUUID is a per-process registration token, not the UUID declared in
    // manifest.json. The real plugin UUID is provided inside the info payload.
    const identity = (0, runtime_mode_1.resolvePluginIdentityFromInfo)(params.info);
    connectActionUUID = identity.actionUUID;
    diagnosticMode = identity.diagnostic;
    connectElgatoStreamDeckSocket(params.port, params.pluginUUID, params.registerEvent, params.info);
}
else {
    console.error('Missing required arguments:', params);
    process.exit(1);
}
