# start-all.ps1 — MandateRail one-command full-stack bring-up.
#
# Brings up the entire MandateRail demo:
#   1. Wires JAVA_HOME + PATH (daml/java are not on PATH on this box).
#   2. Builds the Daml model and regenerates the JS codegen bindings.
#   3. Reminds you to keep DAML_PACKAGE_ID in sync with the built DAR.
#   4. Starts `daml start` (Canton ledger + JSON API on :7575) in THIS window.
#   5. Spawns a SEPARATE PowerShell window for the Next.js frontend (:3000).
#
# Keep THIS window open while you demo; Ctrl+C here stops the ledger.

$ErrorActionPreference = 'Stop'

# --- Resolve the repo root absolutely (this script lives in <root>/scripts) ---
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Frontend = Join-Path $RepoRoot 'frontend'

# --- JAVA_HOME + PATH wiring (copied verbatim from run-ledger.ps1) ------------
# `daml` and `java` are not on PATH on this machine, so we wire them up here.
$jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like 'jdk-17*' } | Select-Object -First 1
if ($jdk) { $env:JAVA_HOME = $jdk.FullName } else {
  Write-Warning "JDK 17 not found under 'C:\Program Files\Microsoft' — set JAVA_HOME manually."
}
$env:PATH = "$env:JAVA_HOME\bin;$env:APPDATA\daml\bin;$env:PATH"

Set-Location $RepoRoot

# --- 1. Build the Daml model -------------------------------------------------
Write-Host "==> daml build (compiling MandateRail templates)..." -ForegroundColor Cyan
daml build
if ($LASTEXITCODE -ne 0) { Write-Error "daml build failed."; exit $LASTEXITCODE }

# --- 2. Regenerate the JS/TS codegen bindings the frontend imports -----------
Write-Host "==> daml codegen js (regenerating daml.js bindings)..." -ForegroundColor Cyan
daml codegen js .daml/dist/mandaterail-1.0.0.dar -o daml.js
if ($LASTEXITCODE -ne 0) { Write-Error "daml codegen js failed."; exit $LASTEXITCODE }

# --- 3. Package-id reminder --------------------------------------------------
# The frontend mints per-party JWTs and addresses templates by package id, so
# DAML_PACKAGE_ID in frontend/.env.local MUST match the DAR's main_package_id.
Write-Host ""
Write-Host "REMINDER: DAML_PACKAGE_ID in frontend/.env.local must match the DAR's" -ForegroundColor Yellow
Write-Host "          main_package_id. Check it with:" -ForegroundColor Yellow
Write-Host "          daml damlc inspect-dar --json .daml/dist/mandaterail-1.0.0.dar" -ForegroundColor Yellow
Write-Host "          (read the JSON 'main_package_id' field and update .env.local if it changed)" -ForegroundColor Yellow
Write-Host ""

# --- 4. Spawn the frontend in a SEPARATE PowerShell window -------------------
# Runs `npm install` then `npm run dev` (:3000) so it survives independently
# of the ledger window. -NoExit keeps the window open after the commands run.
Write-Host "==> Launching frontend in a separate window (npm install + npm run dev)..." -ForegroundColor Cyan
$frontendCmd = "Set-Location '$Frontend'; npm install; npm run dev"
Start-Process powershell -ArgumentList @('-NoExit', '-Command', $frontendCmd)

# --- 5. Print the demo URLs --------------------------------------------------
Write-Host ""
Write-Host "MandateRail is coming up:" -ForegroundColor Green
Write-Host "  Cockpit (demo) : http://localhost:3000/demo" -ForegroundColor Green
Write-Host "  JSON Ledger API: http://localhost:7575" -ForegroundColor Green
Write-Host "  Navigator      : http://localhost:7500" -ForegroundColor Green
Write-Host ""

# --- 6. Start the ledger in THIS window (blocks; Ctrl+C to stop) -------------
Write-Host "==> daml start (Canton ledger + JSON API :7575). First boot takes ~1-2 min..." -ForegroundColor Cyan
daml start
