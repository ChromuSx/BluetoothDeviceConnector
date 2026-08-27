const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'com.chromusx.bluetooth-connector.sdPlugin');
const buildRoot = path.join(projectRoot, 'diagnostic-build');
const diagnosticUUID = 'com.chromusx.bluetooth-connector.diagnostic';
const targetDir = path.join(buildRoot, `${diagnosticUUID}.sdPlugin`);

const relativeTarget = path.relative(buildRoot, targetDir);
if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
  throw new Error(`Refusing to replace diagnostic output outside ${buildRoot}`);
}

if (!fs.existsSync(path.join(sourceDir, 'bin', 'plugin.js'))) {
  throw new Error('The standard plugin has not been built. Run npm run build first.');
}

fs.mkdirSync(buildRoot, { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

const manifestPath = path.join(targetDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.Name = 'Bluetooth Device Connector (Diagnostic)';
manifest.Version = '1.0.1.0';
manifest.Description = 'Private diagnostic build for troubleshooting. Not for Marketplace distribution.';
manifest.UUID = diagnosticUUID;
manifest.Category = 'Bluetooth Device Connector (Diagnostic)';
manifest.Actions = manifest.Actions.map((action) => ({
  ...action,
  Name: 'Test Bluetooth Connection',
  UUID: `${diagnosticUUID}.connect`,
  Tooltip: 'Run a Bluetooth connection test and display the complete error on screen',
}));
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

fs.copyFileSync(
  path.join(__dirname, 'show-diagnostic-error.ps1'),
  path.join(targetDir, 'ShowDiagnosticError.ps1')
);

console.log(`Diagnostic plugin created at ${targetDir}`);
