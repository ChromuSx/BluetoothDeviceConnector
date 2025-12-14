const fs = require('fs');
const path = require('path');

// Ensure the .sdPlugin directory structure exists
const sdPluginDir = path.join(__dirname, '..', 'com.chromusx.bluetooth-connector.sdPlugin');

console.log('Build completed successfully!');
console.log('Plugin directory:', sdPluginDir);

// Verify critical files exist
const criticalFiles = [
  'bin/plugin.js',
  'BluetoothConnector.exe',
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
