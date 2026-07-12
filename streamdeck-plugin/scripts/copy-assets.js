const fs = require('fs');
const path = require('path');

// Ensure the .sdPlugin directory structure exists
const sdPluginDir = path.join(__dirname, '..', 'com.chromusx.bluetooth-connector.sdPlugin');
const projectNodeModules = path.join(__dirname, '..', 'node_modules');
const pluginNodeModules = path.join(sdPluginDir, 'node_modules');

// Stream Deck launches the compiled plugin from inside the .sdPlugin bundle,
// so runtime dependencies must live there rather than only in the project root.
const runtimeModules = ['ws'];
fs.mkdirSync(pluginNodeModules, { recursive: true });
runtimeModules.forEach((moduleName) => {
  const source = path.join(projectNodeModules, moduleName);
  const destination = path.join(pluginNodeModules, moduleName);

  if (!fs.existsSync(source)) {
    console.error(`Missing runtime dependency: ${moduleName}. Run npm install first.`);
    process.exit(1);
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
});

console.log('Build completed successfully!');
console.log('Plugin directory:', sdPluginDir);

// Verify critical files exist
const criticalFiles = [
  'bin/plugin.js',
  process.platform === 'darwin' ? 'BluetoothConnectorMac' : 'BluetoothConnector.exe',
  'node_modules/ws/index.js',
  'manifest.json',
  'ui/property-inspector.html'
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  const filePath = path.join(sdPluginDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.error(`✗ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\nBuild failed: Missing required files');
  process.exit(1);
}

console.log('\nAll required files present!');
