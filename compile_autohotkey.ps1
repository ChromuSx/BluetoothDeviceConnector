$compiler = "C:\Program Files\AutoHotkey\Compiler\Ahk2Exe.exe"
$basefile = "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe"
$scriptPath = Join-Path $PSScriptRoot "streamdeck-plugin\src\bluetooth_connector_cli.ahk"
$outputPath = Join-Path $PSScriptRoot "streamdeck-plugin\com.chromusx.bluetooth-connector.sdPlugin\BluetoothConnector.exe"

Write-Host "Compiling AutoHotkey script..."
Write-Host "Input: $scriptPath"
Write-Host "Base: $basefile"
Write-Host "Output: $outputPath"

$process = Start-Process -FilePath $compiler -ArgumentList @("/in", "`"$scriptPath`"", "/out", "`"$outputPath`"", "/base", "`"$basefile`"") -Wait -PassThru -NoNewWindow

if ($process.ExitCode -eq 0) {
    Write-Host "Compilation successful!" -ForegroundColor Green
    if (Test-Path $outputPath) {
        Write-Host "Executable created at: $outputPath" -ForegroundColor Green
    }
} else {
    Write-Host "Compilation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
}

exit $process.ExitCode
