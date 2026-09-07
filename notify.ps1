param(
    [string]$RepoName = "ZenithValues/Apex-Ball-TD-WIKI",
    [string]$Title = "Test Realm Update",
    [int]$Color = 5814783,
    [string]$Description = "Test Realm update - code cleanup:",
    [string]$SiteUrl = "https://zenithvalues.github.io/Apex-Ball-TD-WIKI/",
    [string]$FooterText = "APEX Testing - Auto Deploy"
)

# ============================================================================
# THIS UPDATE'S MESSAGE
# ----------------------------------------------------------------------------
# Edit these lines before every push. Keep the text simple and accessible
# so anyone can read it. push.cmd runs this file as-is (no overrides).
# ============================================================================
$features = @(
    'Behind-the-scenes cleanup: old notes and decorative banners stripped from the code',
    'No feature changes - same site, same games, same values'
)

# Discord caps field values at 1024 chars — the list is auto-split into
# <=1000-char chunks so a long feature list can never 400 again.
$maxChunk = 1000
$chunks = New-Object System.Collections.Generic.List[string]
$current = ''
foreach ($line in ($features | Select-Object -First 12 | ForEach-Object { "- $_" })) {
    if ($current.Length -eq 0) {
        $current = $line
    } elseif (($current + "`n" + $line).Length -le $maxChunk) {
        $current = $current + "`n" + $line
    } else {
        $chunks.Add($current)
        $current = $line
    }
}
if ($current) { $chunks.Add($current) }

$fields = New-Object System.Collections.Generic.List[hashtable]
for ($i = 0; $i -lt $chunks.Count; $i++) {
    $name = 'What Changed'
    if ($i -gt 0) { $name = "What Changed ($($i + 1))" }
    $fields.Add(@{ name = $name; value = $chunks[$i]; inline = $false })
}

$short = ''
try { $short = (git rev-parse --short HEAD 2>$null) } catch {}
$count = ''
try { $count = (git rev-list --count HEAD 2>$null) } catch {}

# Discord also rejects EMPTY field values - always fall back to a dash.
$commitValue = if ($short) { '' + $short } else { '-' }
$buildValue = if ($count) { '#' + $count } else { '-' }

$fields.Add(@{ name = 'Commit'; value = $commitValue; inline = $true })
$fields.Add(@{ name = 'Build'; value = $buildValue; inline = $true })
$fields.Add(@{ name = 'Link'; value = "[Open Site]($SiteUrl)"; inline = $false })

$body = @{
    embeds = @(@{
        title       = $Title
        url         = "https://github.com/$RepoName"
        color       = $Color
        description = $Description
        fields      = $fields
        footer      = @{ text = $FooterText }
        timestamp   = (Get-Date -Format o)
    })
} | ConvertTo-Json -Depth 10 -Compress

# Discord webhook — the notification is sent ONLY from this file.
$webhook = 'https://discord.com/api/webhooks/1530560657848533163/fSAs2a2OGZW-b1uTA0RYbrllFbJZ7FcFQ7Jf_6JWT6nj5gUlVdaIuuSN3515I_3a4Q-a'

try {
    Invoke-RestMethod -Uri $webhook -Method Post -ContentType 'application/json' -Body $body | Out-Null
    Write-Host 'Discord notification sent.'
} catch {
    Write-Host "Notification failed: $($_.Exception.Message)"
    $resp = $_.Exception.Response
    if ($resp) {
        try {
            $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $details = $reader.ReadToEnd()
            if ($details) { Write-Host "Discord says: $details" }
        } catch { }
    }
}
