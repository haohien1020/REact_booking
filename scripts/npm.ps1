param([ValidateSet('dev', 'build', 'preview', 'test', 'ci')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
    $portablePointer = Join-Path $env:TEMP 'booking-fe-toolchain\node-root.txt'
    if (Test-Path -LiteralPath $portablePointer) {
        $nodeRoot = (Get-Content -LiteralPath $portablePointer -Raw).Trim()
        if (Test-Path -LiteralPath (Join-Path $nodeRoot 'node.exe')) {
            $env:PATH = $nodeRoot + ';' + $env:PATH
            $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
        }
    }
}
if (-not $npm) { throw 'Install Node.js LTS (22.12+; recommended 24), then reopen the terminal. https://nodejs.org/en/download' }
Push-Location $projectRoot
try {
    if ($Task -eq 'ci') { & $npm.Source ci }
    else {
        if (-not (Test-Path -LiteralPath 'node_modules')) { & $npm.Source ci; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
        & $npm.Source run $Task
    }
    exit $LASTEXITCODE
} finally { Pop-Location }
