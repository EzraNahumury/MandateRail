# Starts the Daml + Canton ledger for MandateRail (JSON API on :7575).
# `daml` and `java` are not on PATH on this machine, so we wire them up here.
# Keep this window OPEN while you use the UI; press Ctrl+C to stop the ledger.

$jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like 'jdk-17*' } | Select-Object -First 1
if ($jdk) { $env:JAVA_HOME = $jdk.FullName } else {
  Write-Warning "JDK 17 not found under 'C:\Program Files\Microsoft' — set JAVA_HOME manually."
}
$env:PATH = "$env:JAVA_HOME\bin;$env:APPDATA\daml\bin;$env:PATH"

Set-Location $PSScriptRoot
Write-Host "Starting ledger (JSON API -> http://localhost:7575). First boot takes ~1-2 min..." -ForegroundColor Cyan
daml start
