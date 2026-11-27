# =============================================================================
# notify.ps1 - posts a verified "Apex WIKI & Values updated" notice to Discord.
#
# SECURITY HARDENING:
#   - Never stores webhook URLs in source code or logs them on failure.
#   - Strictly allows official Discord webhook endpoints only (anti-SSRF/exfil).
#   - Enforces official APEX repository + package identity lock to prevent
#     unauthorized branding / spoofed release notices from stolen forks.
#   - Scrubs tokens, webhook URLs, and @everyone/@here pings + disables all
#     Discord allowed_mentions.
#   - Attaches a SHA-256 build attestation fingerprint.
# =============================================================================

param(
  [string]$Title   = "Apex WIKI & Values updated",
  [string]$Message = "",
  [string]$Webhook = "",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# --- official brand & repository lock -----------------------------------------
$BrandName     = "Apex WIKI & Values"
$AllowedRemotes = @(
  "https://github.com/zenithvalues/apex-ball-td-wiki"
)

function Get-SanitizedRepoId([string]$Root) {
  try {
    $url = (git -C $Root remote get-url origin 2>$null | Select-Object -First 1)
    if (-not $url) { return "" }
    $clean = $url.Trim().ToLowerInvariant()
    $clean = $clean -replace '\.git$', ''
    $clean = $clean -replace '^https://[^@/]+@github\.com/', 'https://github.com/'
    $clean = $clean -replace '^git@github\.com:', 'https://github.com/'
    return $clean
  } catch { return "" }
}

$repoUrl = Get-SanitizedRepoId $PSScriptRoot
if (-not $repoUrl -or -not ($AllowedRemotes -contains $repoUrl)) {
  Write-Output "Security lock: origin repository is not authorized for official Apex WIKI & Values announcements."
  exit 2
}

$pkgPath = Join-Path $PSScriptRoot "package.json"
if (-not (Test-Path $pkgPath)) {
  Write-Output "Security lock: package.json missing in release root."
  exit 2
}
try {
  $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
} catch {
  Write-Output "Security lock: invalid package.json."
  exit 2
}
if ($pkg.name -ne "apex-td") {
  Write-Output "Security lock: unauthorized package identity (expected apex-td)."
  exit 2
}

# --- resolve message safely from env var if omitted ---------------------------
if (-not $Message -and $env:APEX_NOTIFY_MESSAGE) {
  $Message = $env:APEX_NOTIFY_MESSAGE
}

# --- resolve the webhook (parameter -> env var -> webhook.txt) ----------------
if (-not $Webhook) { $Webhook = $env:APEX_DISCORD_WEBHOOK }
if (-not $Webhook) {
  $txt = Join-Path $PSScriptRoot "webhook.txt"
  if (Test-Path $txt) { $Webhook = (Get-Content $txt -Raw).Trim() }
}
if (-not $Webhook) {
  $parentDir = Split-Path $PSScriptRoot -Parent
  if ($parentDir) {
    $txtParent = Join-Path $parentDir "webhook.txt"
    if (Test-Path $txtParent) { $Webhook = (Get-Content $txtParent -Raw).Trim() }
  }
}

# Strict Discord-only webhook URL pattern (prevents SSRF / arbitrary URL exfiltration)
$DiscordWebhookRegex = '^https://(?:canary\.|ptb\.)?discord(?:app)?\.com/api/webhooks/\d{17,22}/[A-Za-z0-9_-]{40,}$'
if (-not $Webhook -or $Webhook -notmatch $DiscordWebhookRegex) {
  Write-Output "No valid Discord webhook configured - announce skipped."
  exit 1
}

# --- helpers: scrub secrets, mentions & clamp ---------------------------------
function Scrub-Text([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return "" }
  $out = $Text.Trim()
  $out = $out -replace 'https?://(?:canary\.|ptb\.)?discord(?:app)?\.com/api/webhooks/[^\s\)\]]+', '[REDACTED-WEBHOOK]'
  $out = $out -replace '\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b', '[REDACTED-TOKEN]'
  $out = $out -replace '\bgithub_pat_[A-Za-z0-9_]{20,}\b', '[REDACTED-TOKEN]'
  $out = $out -replace '(?i)\b(bearer|token|secret|passcode|password)\s*[:=]\s*\S+', '$1=[REDACTED]'
  $out = $out -replace '@(everyone|here)', '@ $1'
  $out = $out -replace '<@[!&]?\d+>', '[mention]'
  return $out
}

function Clamp([string]$Text, [int]$Max) {
  $clean = Scrub-Text $Text
  if ([string]::IsNullOrWhiteSpace($clean)) { return "-" }
  if ($clean.Length -le $Max) { return $clean }
  return $clean.Substring(0, $Max - 3) + "..."
}

# --- collect verified build context + integrity hash --------------------------
$version = if ($pkg.version) { [string]$pkg.version } else { "?" }

$buildId = "unknown"
$buildIdPath = Join-Path $PSScriptRoot "public\BUILD_ID.txt"
if (Test-Path $buildIdPath) {
  $buildId = ((Get-Content $buildIdPath -Raw) -replace '\s+', '').Trim()
}

$commit = ""
try { $commit = (git -C $PSScriptRoot log -1 --pretty="%h %s" 2>$null | Select-Object -First 1) } catch {}
$commit = Clamp $commit 1024

$stamp = [datetime]::UtcNow.ToString("yyyy-MM-dd HH:mm") + " UTC"

$sha256 = [System.Security.Cryptography.SHA256]::Create()
$attestBytes = [System.Text.Encoding]::UTF8.GetBytes("$repoUrl|$version|$buildId")
$attestHash = ([System.BitConverter]::ToString($sha256.ComputeHash($attestBytes))).Replace("-", "").ToLowerInvariant().Substring(0, 16)

# --- build the embed (locked brand + zero mentions) ---------------------------
$payload = @{
  username         = $BrandName
  allowed_mentions = @{ parse = @() }
  embeds           = @(
    @{
      title       = Clamp $Title 256
      color       = 0x8A5CFF
      description = Clamp $Message 2048
      fields      = @(
        @{ name = "Version";   value = Clamp $version 1024;  inline = $true },
        @{ name = "Commit";    value = $commit;              inline = $true },
        @{ name = "Pushed";    value = $stamp;               inline = $true },
        @{ name = "Integrity"; value = "sha256:$attestHash"; inline = $true }
      )
      footer    = @{ text = "$BrandName - verified release" }
      timestamp = [datetime]::UtcNow.ToString("o")
    }
  )
} | ConvertTo-Json -Depth 6

if ($DryRun) {
  Write-Output $payload
  Write-Output ""
  Write-Output "(dry run - nothing was sent)"
  exit 0
}

$body = [System.Text.Encoding]::UTF8.GetBytes($payload)

try {
  Invoke-RestMethod -Uri $Webhook -Method Post -ContentType "application/json" -Body $body | Out-Null
  Write-Output "Discord notified (verified release)."
  exit 0
} catch {
  # Never leak the webhook URI or stack trace in exception text
  Write-Output "Notify FAILED (status/network error; webhook details redacted)."
  exit 1
}
