[CmdletBinding()]
param(
  [string]$Snapshot = "HEAD",
  [switch]$KeepTemporaryDirectory
)

$ErrorActionPreference = "Stop"

$sourceDirectory = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$temporaryRoot = [System.IO.Path]::GetTempPath()
$temporaryDirectory = $null
$archivePath = $null
$composeProject = "primer-parcial-clean-$([Guid]::NewGuid().ToString("N").Substring(0, 12))"
$apiProcess = $null
$postgresStarted = $false
$environmentCaptured = $false
$apiPort = 3100

function Invoke-Native {
  param(
    [string]$Command,
    [string[]]$Arguments
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command failed with exit code $LASTEXITCODE."
  }
}

function Assert-LoopbackPortAvailable {
  param([int]$Port)

  $listener = [System.Net.Sockets.TcpListener]::new(
    [System.Net.IPAddress]::Loopback,
    $Port
  )

  try {
    $listener.Start()
  } catch {
    throw "Blocked: 127.0.0.1:$Port is already in use. The clean reproduction will not touch an existing service."
  } finally {
    $listener.Stop()
  }
}

function Get-SyntheticEnvironment {
  param([string]$ExamplePath)

  $values = @{}
  foreach ($line in Get-Content -LiteralPath $ExamplePath) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $key, $value = $trimmed -split "=", 2
    $values[$key] = $value
  }

  foreach ($requiredKey in @(
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "WEB_ORIGIN",
    "JWT_SECRET",
    "JWT_EXPIRES_IN_SECONDS",
    "BCRYPT_COST"
  )) {
    if (-not $values.ContainsKey($requiredKey)) {
      throw "Blocked: .env.example from the selected snapshot lacks $requiredKey."
    }
  }

  return $values
}

function Invoke-Compose {
  param([string[]]$Arguments)

  $composeArguments = @(
    "compose",
    "--project-name", $composeProject,
    "--project-directory", $temporaryDirectory,
    "-f", (Join-Path $temporaryDirectory "compose.yaml")
  ) + $Arguments
  Invoke-Native -Command docker -Arguments $composeArguments
}

function Wait-ForAvailableHealth {
  param([string]$HealthUrl)

  foreach ($attempt in 1..30) {
    if ($apiProcess.HasExited) {
      throw "Blocked: the API process exited before its health endpoint became available."
    }

    try {
      $response = Invoke-RestMethod -Uri $HealthUrl -TimeoutSec 2
      if ($response.status -eq "available") {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Blocked: $HealthUrl did not return the available health contract within 30 seconds."
}

$environmentNames = @(
  "POSTGRES_DB",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "API_PORT",
  "WEB_ORIGIN",
  "JWT_SECRET",
  "JWT_EXPIRES_IN_SECONDS",
  "BCRYPT_COST"
)
$previousEnvironment = @{}

try {
  foreach ($command in @("git", "npm", "node", "docker")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
      throw "Blocked: $command is required for clean reproduction."
    }
  }

  $nodeVersion = (& node --version).Trim()
  if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch "^v24\.") {
    throw "Blocked: Node 24 is required; found $nodeVersion."
  }
  $npmVersion = (& npm --version).Trim()
  if ($LASTEXITCODE -ne 0 -or $npmVersion -notmatch "^11\.") {
    throw "Blocked: npm 11 is required; found $npmVersion."
  }

  $resolvedSnapshot = (& git -C $sourceDirectory rev-parse --verify "$Snapshot^{commit}").Trim()
  if ($LASTEXITCODE -ne 0) {
    throw "Blocked: $Snapshot is not a versioned Git commit."
  }

  $temporaryDirectory = Join-Path $temporaryRoot "primer-parcial-clean-$([Guid]::NewGuid().ToString("N"))"
  $archivePath = Join-Path $temporaryRoot "primer-parcial-snapshot-$([Guid]::NewGuid().ToString("N")).zip"
  New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null
  Write-Output "Snapshot: $resolvedSnapshot"
  Write-Output "Temporary directory: $temporaryDirectory"
  Write-Output "Snapshot source: git archive from $sourceDirectory"

  Invoke-Native -Command git -Arguments @(
    "-C", $sourceDirectory,
    "archive",
    "--format=zip",
    "--output=$archivePath",
    $resolvedSnapshot
  )
  Expand-Archive -LiteralPath $archivePath -DestinationPath $temporaryDirectory
  Remove-Item -LiteralPath $archivePath -Force
  $archivePath = $null

  foreach ($requiredPath in @(
    "package.json",
    "package-lock.json",
    "compose.yaml",
    ".env.example",
    "playwright.config.ts",
    ".github/workflows/ci.yml"
  )) {
    if (-not (Test-Path -LiteralPath (Join-Path $temporaryDirectory $requiredPath))) {
      throw "Blocked: snapshot $resolvedSnapshot lacks $requiredPath."
    }
  }

  $lockfiles = @(Get-ChildItem -LiteralPath $temporaryDirectory -Recurse -File -Filter "package-lock.json")
  if ($lockfiles.Count -ne 1 -or $lockfiles[0].FullName -ne (Join-Path $temporaryDirectory "package-lock.json")) {
    throw "Blocked: snapshot $resolvedSnapshot must contain exactly one root package-lock.json."
  }

  $forbiddenDirectories = @(
    "node_modules",
    "dist",
    ".astro",
    "coverage",
    "playwright-report",
    "test-results"
  )
  $unexpectedDirectories = @(
    Get-ChildItem -LiteralPath $temporaryDirectory -Recurse -Directory -Force |
      Where-Object { $forbiddenDirectories -contains $_.Name }
  )
  if ($unexpectedDirectories.Count -gt 0) {
    throw "Blocked: snapshot $resolvedSnapshot contains excluded generated directories: $($unexpectedDirectories.FullName -join ', ')."
  }

  $unexpectedEnvironmentFiles = @(
    Get-ChildItem -LiteralPath $temporaryDirectory -Recurse -File -Force |
      Where-Object { $_.Name -like ".env*" -and $_.Name -ne ".env.example" }
  )
  if ($unexpectedEnvironmentFiles.Count -gt 0) {
    throw "Blocked: snapshot $resolvedSnapshot contains non-example environment files."
  }

  Assert-LoopbackPortAvailable -Port 5432
  Assert-LoopbackPortAvailable -Port $apiPort

  $syntheticEnvironment = Get-SyntheticEnvironment (Join-Path $temporaryDirectory ".env.example")
  foreach ($name in $environmentNames) {
    $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
  }
  $environmentCaptured = $true
  foreach ($name in @(
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "WEB_ORIGIN",
    "JWT_SECRET",
    "JWT_EXPIRES_IN_SECONDS",
    "BCRYPT_COST"
  )) {
    [Environment]::SetEnvironmentVariable($name, $syntheticEnvironment[$name], "Process")
  }
  [Environment]::SetEnvironmentVariable("API_PORT", $apiPort, "Process")

  Push-Location $temporaryDirectory
  try {
    Invoke-Native -Command npm -Arguments @("ci")
  } finally {
    Pop-Location
  }

  Invoke-Compose -Arguments @("config")
  Invoke-Compose -Arguments @("up", "-d", "--wait", "postgres")
  $postgresStarted = $true
  Invoke-Compose -Arguments @("exec", "-T", "postgres", "pg_isready", "-U", $syntheticEnvironment.POSTGRES_USER, "-d", $syntheticEnvironment.POSTGRES_DB)

  Push-Location $temporaryDirectory
  try {
    Invoke-Native -Command npm -Arguments @("run", "lint")
    Invoke-Native -Command npm -Arguments @("run", "typecheck")
    Invoke-Native -Command npm -Arguments @("run", "migration:run", "--workspace", "@primer-parcial/api")
    Invoke-Native -Command npm -Arguments @("run", "test")
    Invoke-Native -Command npm -Arguments @("run", "test:e2e")
    Invoke-Native -Command npm -Arguments @("run", "build")
  } finally {
    Pop-Location
  }

  $apiOutputPath = Join-Path $temporaryDirectory "api-clean-reproduction.out.log"
  $apiErrorPath = Join-Path $temporaryDirectory "api-clean-reproduction.err.log"
  $apiProcess = Start-Process -FilePath "node.exe" -ArgumentList @("apps/api/dist/main.js") -WorkingDirectory $temporaryDirectory -RedirectStandardOutput $apiOutputPath -RedirectStandardError $apiErrorPath -PassThru
  Wait-ForAvailableHealth -HealthUrl "http://127.0.0.1:$apiPort/api/health"

  [PSCustomObject]@{
    Snapshot = $resolvedSnapshot
    TemporaryDirectory = $temporaryDirectory
    ComposeProject = $composeProject
    Health = "available"
  }
} finally {
  if ($null -ne $apiProcess -and -not $apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id -Force
  }

  if ($postgresStarted) {
    try {
      Invoke-Compose -Arguments @("stop", "postgres")
    } catch {
      Write-Warning "Could not stop the isolated PostgreSQL service ${composeProject}: $_"
    }
  }

  if ($environmentCaptured) {
    foreach ($name in $environmentNames) {
      [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], "Process")
    }
  }

  if ($null -ne $archivePath -and (Test-Path -LiteralPath $archivePath)) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  if ($null -ne $temporaryDirectory -and -not $KeepTemporaryDirectory) {
    Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
  }
}
