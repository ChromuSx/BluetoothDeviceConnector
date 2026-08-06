[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# GUI-subsystem tools such as Ahk2Exe can leave this automatic variable unset.
# Initialize it so strict mode remains deterministic; output checks below are
# still authoritative when a tool does not publish an exit code.
$global:LASTEXITCODE = 0

function Get-FirstExistingFile {
    param(
        [Parameter(Mandatory)]
        [AllowNull()]
        [AllowEmptyString()]
        [string[]] $Candidates
    )

    foreach ($candidate in $Candidates) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and
            (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return [System.IO.Path]::GetFullPath($candidate)
        }
    }

    return $null
}

function Find-VsWhere {
    param(
        [Parameter(Mandatory)]
        [string] $ProgramFiles,

        [Parameter(Mandatory)]
        [string] $ProgramFilesX86
    )

    $fromPath = Get-Command 'vswhere.exe' -CommandType Application -ErrorAction SilentlyContinue
    $pathCandidate = if ($null -ne $fromPath) { $fromPath.Source } else { $null }

    return Get-FirstExistingFile -Candidates @(
        $env:VSWHERE_PATH,
        (Join-Path $ProgramFilesX86 'Microsoft Visual Studio\Installer\vswhere.exe'),
        (Join-Path $ProgramFiles 'Microsoft Visual Studio\Installer\vswhere.exe'),
        $pathCandidate
    )
}

function Find-VsDevCmd {
    param(
        [Parameter(Mandatory)]
        [string] $ProgramFiles,

        [Parameter(Mandatory)]
        [string] $ProgramFilesX86
    )

    $vsWhere = Find-VsWhere -ProgramFiles $ProgramFiles -ProgramFilesX86 $ProgramFilesX86
    if ($null -ne $vsWhere) {
        $installationPath = (& $vsWhere -latest -products '*' `
            -requires 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64' `
            -property installationPath | Select-Object -First 1)

        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($installationPath)) {
            $candidate = Join-Path $installationPath.Trim() 'Common7\Tools\VsDevCmd.bat'
            if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                return [System.IO.Path]::GetFullPath($candidate)
            }
        }
    }

    # Fallback for machines where Visual Studio is installed but vswhere is absent.
    foreach ($root in @(
        (Join-Path $ProgramFilesX86 'Microsoft Visual Studio'),
        (Join-Path $ProgramFiles 'Microsoft Visual Studio')
    )) {
        if (-not (Test-Path -LiteralPath $root -PathType Container)) {
            continue
        }

        $years = Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending
        foreach ($year in $years) {
            $editions = Get-ChildItem -LiteralPath $year.FullName -Directory -ErrorAction SilentlyContinue |
                Sort-Object @{ Expression = { if ($_.Name -eq 'BuildTools') { 0 } else { 1 } } }, Name
            foreach ($edition in $editions) {
                $candidate = Join-Path $edition.FullName 'Common7\Tools\VsDevCmd.bat'
                if (Test-Path -LiteralPath $candidate -PathType Leaf) {
                    return [System.IO.Path]::GetFullPath($candidate)
                }
            }
        }
    }

    return $null
}

function Import-VsDevEnvironment {
    param(
        [Parameter(Mandatory)]
        [string] $VsDevCmd
    )

    $commandProcessor = if ([string]::IsNullOrWhiteSpace($env:ComSpec)) {
        Join-Path ([Environment]::GetFolderPath('System')) 'cmd.exe'
    } else {
        $env:ComSpec
    }

    $environmentLines = & $commandProcessor /d /c `
        "call `"$VsDevCmd`" -no_logo -arch=x64 -host_arch=x64 >nul && set"
    if ($LASTEXITCODE -ne 0) {
        throw "Visual Studio x64 environment initialization failed with exit code $LASTEXITCODE."
    }

    foreach ($line in $environmentLines) {
        $separator = $line.IndexOf('=')
        if ($separator -le 0) {
            continue
        }

        $name = $line.Substring(0, $separator)
        $value = $line.Substring($separator + 1)
        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceDirectory = Join-Path $projectRoot 'src'
$pluginDirectory = Join-Path $projectRoot 'com.chromusx.bluetooth-connector.sdPlugin'
$nativeBuildDirectory = Join-Path $projectRoot '.native-build'

$ahkSource = Join-Path $sourceDirectory 'bluetooth_connector_cli.ahk'
$routerSource = Join-Path $sourceDirectory 'audio_endpoint_router.cpp'
$bluetoothOutput = Join-Path $pluginDirectory 'BluetoothConnector.exe'
$routerOutput = Join-Path $pluginDirectory 'AudioEndpointRouter.exe'
$routerObject = Join-Path $nativeBuildDirectory 'audio_endpoint_router.obj'

foreach ($requiredPath in @($ahkSource, $routerSource)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required source file not found: $requiredPath"
    }
}
if (-not (Test-Path -LiteralPath $pluginDirectory -PathType Container)) {
    throw "Plugin output directory not found: $pluginDirectory"
}

$programFiles = [Environment]::GetFolderPath('ProgramFiles')
$programFilesX86 = [Environment]::GetFolderPath('ProgramFilesX86')
$localAppData = [Environment]::GetFolderPath('LocalApplicationData')

$ahk2ExeFromPath = Get-Command 'Ahk2Exe.exe' -CommandType Application -ErrorAction SilentlyContinue
$ahk2ExePathCandidate = if ($null -ne $ahk2ExeFromPath) { $ahk2ExeFromPath.Source } else { $null }
$ahk2Exe = Get-FirstExistingFile -Candidates @(
    $env:AHK2EXE_PATH,
    (Join-Path $programFiles 'AutoHotkey\Compiler\Ahk2Exe.exe'),
    (Join-Path $localAppData 'Programs\AutoHotkey\Compiler\Ahk2Exe.exe'),
    $ahk2ExePathCandidate
)
if ($null -eq $ahk2Exe) {
    throw 'Ahk2Exe.exe was not found. Install AutoHotkey v2 with its compiler, or set AHK2EXE_PATH.'
}

$compilerRoot = Split-Path -Parent (Split-Path -Parent $ahk2Exe)
$ahkBase = Get-FirstExistingFile -Candidates @(
    $env:AUTOHOTKEY_V2_BASE,
    (Join-Path $compilerRoot 'v2\AutoHotkey64.exe'),
    (Join-Path $programFiles 'AutoHotkey\v2\AutoHotkey64.exe'),
    (Join-Path $localAppData 'Programs\AutoHotkey\v2\AutoHotkey64.exe')
)
if ($null -eq $ahkBase) {
    throw 'AutoHotkey v2 x64 base executable was not found. Install AutoHotkey v2, or set AUTOHOTKEY_V2_BASE.'
}

$baseVersionText = [Diagnostics.FileVersionInfo]::GetVersionInfo($ahkBase).ProductVersion
$baseVersion = $null
$numericVersionText = if ([string]::IsNullOrWhiteSpace($baseVersionText)) {
    $null
} else {
    ($baseVersionText -split '[-+ ]', 2)[0]
}
if ([string]::IsNullOrWhiteSpace($numericVersionText) -or
    -not [Version]::TryParse($numericVersionText, [ref] $baseVersion) -or
    $baseVersion.Major -lt 2) {
    throw "The selected AutoHotkey base is not a recognized v2 executable: $ahkBase"
}

Write-Host "Building Bluetooth helper with AutoHotkey v$baseVersion..."
Write-Host "  Compiler: $ahk2Exe"
Write-Host "  Base:     $ahkBase"
& $ahk2Exe /in $ahkSource /out $bluetoothOutput /base $ahkBase
if ($LASTEXITCODE -ne 0) {
    throw "Ahk2Exe failed with exit code $LASTEXITCODE."
}
if (-not (Test-Path -LiteralPath $bluetoothOutput -PathType Leaf) -or
    (Get-Item -LiteralPath $bluetoothOutput).Length -eq 0) {
    throw "Ahk2Exe did not produce a valid output file: $bluetoothOutput"
}

$vsDevCmd = Find-VsDevCmd -ProgramFiles $programFiles -ProgramFilesX86 $programFilesX86
if ($null -eq $vsDevCmd) {
    throw 'Visual Studio Build Tools with the Desktop development with C++ workload were not found.'
}

Write-Host 'Initializing the Visual Studio x64 build environment...'
Write-Host "  VsDevCmd: $vsDevCmd"
Import-VsDevEnvironment -VsDevCmd $vsDevCmd

$cl = Get-Command 'cl.exe' -CommandType Application -ErrorAction SilentlyContinue
if ($null -eq $cl) {
    throw 'cl.exe was not found after initializing the Visual Studio x64 build environment.'
}

New-Item -ItemType Directory -Path $nativeBuildDirectory -Force | Out-Null

Write-Host 'Building Windows audio endpoint router (x64, C++17, static CRT)...'
Write-Host "  Compiler: $($cl.Source)"
& $cl.Source /nologo /std:c++17 /O2 /EHsc /DUNICODE /D_UNICODE /MT `
    "/Fo$routerObject" "/Fe$routerOutput" $routerSource ole32.lib propsys.lib
if ($LASTEXITCODE -ne 0) {
    throw "cl.exe failed with exit code $LASTEXITCODE."
}
if (-not (Test-Path -LiteralPath $routerOutput -PathType Leaf) -or
    (Get-Item -LiteralPath $routerOutput).Length -eq 0) {
    throw "cl.exe did not produce a valid output file: $routerOutput"
}

Write-Host 'Windows helpers built successfully:'
Write-Host "  $bluetoothOutput"
Write-Host "  $routerOutput"
