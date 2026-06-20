# test.ps1 — MandateRail Daml test runner.
#
# Wires JAVA_HOME + PATH (daml/java are not on PATH on this box), builds the
# Daml model, then runs the full Daml Script test suite. Exits non-zero on any
# failure so CI / callers can gate on it.

$ErrorActionPreference = 'Stop'

# --- Resolve the repo root absolutely (this script lives in <root>/scripts) ---
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

# --- JAVA_HOME + PATH wiring (copied verbatim from run-ledger.ps1) ------------
# `daml` and `java` are not on PATH on this machine, so we wire them up here.
$jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like 'jdk-17*' } | Select-Object -First 1
if ($jdk) { $env:JAVA_HOME = $jdk.FullName } else {
  Write-Warning "JDK 17 not found under 'C:\Program Files\Microsoft' — set JAVA_HOME manually."
}
$env:PATH = "$env:JAVA_HOME\bin;$env:APPDATA\daml\bin;$env:PATH"

Set-Location $RepoRoot

# --- 1. Build -----------------------------------------------------------------
Write-Host "==> daml build..." -ForegroundColor Cyan
daml build
if ($LASTEXITCODE -ne 0) { Write-Error "daml build failed."; exit $LASTEXITCODE }

# --- 2. Test ------------------------------------------------------------------
Write-Host "==> daml test (running the Daml Script suite)..." -ForegroundColor Cyan
daml test
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "DAML TESTS FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
  exit $LASTEXITCODE
}

# --- 3. Success summary -------------------------------------------------------
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "     ALL DAML TESTS PASSED" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
exit 0
