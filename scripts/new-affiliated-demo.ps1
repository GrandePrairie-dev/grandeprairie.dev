#requires -Version 7
<#
.SYNOPSIS
  Scaffold a new affiliated demo on the grandeprairie.dev network.

.DESCRIPTION
  Automates the Build (folder scaffold) and Deploy preview (Cloudflare Pages
  project + custom domain + CNAME) stages from docs/network-playbook.md.
  Replaces the ~30 minutes of manual setup we did for Bull Oilfield with
  one command.

.PARAMETER Slug
  URL/repo-safe slug for the demo folder. e.g. "kinetic-energies"

.PARAMETER Subdomain
  Subdomain on grandeprairie.dev where the site will live.
  e.g. "kinetic" -> kinetic.grandeprairie.dev

.PARAMETER Name
  Human-readable business name. e.g. "Kinetic Energies Incorporated"

.PARAMETER SkipDeploy
  Only scaffold the folder; don't create the Pages project or DNS.

.EXAMPLE
  .\scripts\new-affiliated-demo.ps1 -Slug kinetic-energies -Subdomain kinetic -Name "Kinetic Energies Incorporated"

.NOTES
  Pre-requisites:
  - $env:CLOUDFLARE_API_TOKEN set with scopes:
      Account -> Cloudflare Pages -> Edit
      Zone -> DNS -> Edit (for grandeprairie.dev zone only)
  - wrangler available via npx (npm dependency)
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Slug,
    [Parameter(Mandatory)][string]$Subdomain,
    [Parameter(Mandatory)][string]$Name,
    [switch]$SkipDeploy
)

$ErrorActionPreference = 'Stop'

# --- Constants (grandeprairie.dev specific, from CLAUDE.md) ---
$AccountId = '13c2f9e7589ab58d2f4f2981b443ba49'
$ZoneId    = '235dbf5343d71e90b981141acd199abf'
$BaseDomain = 'grandeprairie.dev'

# --- Validate inputs ---
if ($Slug -notmatch '^[a-z0-9-]+$') {
    throw "Slug must be lowercase letters, digits, and hyphens only. Got: '$Slug'"
}
if ($Subdomain -notmatch '^[a-z0-9-]+$') {
    throw "Subdomain must be lowercase letters, digits, and hyphens only. Got: '$Subdomain'"
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$DemoDir  = Join-Path $RepoRoot $Slug
$LeadFile = Join-Path $RepoRoot "docs\leads\$Slug.md"
$TemplateLead = Join-Path $RepoRoot "docs\leads\_template.md"

# --- Stage 1: Folder scaffold ---
Write-Host "`n=== Scaffolding $Slug ===" -ForegroundColor Cyan

if (Test-Path $DemoDir) {
    throw "Demo folder already exists: $DemoDir"
}
New-Item -ItemType Directory -Path $DemoDir | Out-Null
Write-Host "  Created folder: $DemoDir"

# Placeholder design.md - to be filled in before Build
@"
## $Name - Brand Brief

> Stub - fill in before building ``$Slug/index.html``.

### Color Palette
- Primary: ``#``
- Accent: ``#``
- Background: ``#``
- Text: ``#``

### Typography
- Display: ````
- Body: ````

### Layout vibe
TBD

### Voice keywords
TBD

### Avoid
TBD
"@ | Set-Content (Join-Path $DemoDir 'design.md') -Encoding utf8

# Placeholder index.html - minimal viable demo to deploy
@"
<!DOCTYPE html>
<html lang="en-CA">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>$Name - Coming Soon | Grande Prairie, AB</title>
<meta name="description" content="$Name preview site on the grandeprairie.dev network. Awaiting owner sign-off.">
<meta name="robots" content="noindex,nofollow">
<style>
  body { font-family: system-ui, sans-serif; background: #0c0c0c; color: #f0ece4; margin: 0; min-height: 100vh; display: grid; place-items: center; text-align: center; padding: 24px; }
  h1 { font-size: 32px; margin: 0 0 12px; }
  p { color: #999; max-width: 480px; line-height: 1.6; }
  a { color: #3DBFA8; }
</style>
</head>
<body>
  <div>
    <h1>$Name</h1>
    <p>Preview demo on the <a href="https://grandeprairie.dev">grandeprairie.dev</a> network. Site under construction - awaiting owner sign-off.</p>
  </div>
</body>
</html>
"@ | Set-Content (Join-Path $DemoDir 'index.html') -Encoding utf8

Write-Host "  Wrote: design.md (stub), index.html (placeholder)"

# --- Stage 2: Lead tracker ---
if (Test-Path $TemplateLead) {
    if (-not (Test-Path $LeadFile)) {
        $leadContent = (Get-Content $TemplateLead -Raw) `
            -replace '\{Company Name\}', $Name `
            -replace '\{slug\}', $Slug `
            -replace '\{subdomain\}', $Subdomain `
            -replace '\{date\}', (Get-Date -Format 'yyyy-MM-dd')
        Set-Content $LeadFile -Value $leadContent -Encoding utf8
        Write-Host "  Lead tracker: docs/leads/$Slug.md"
    } else {
        Write-Host "  Lead tracker already exists, leaving alone" -ForegroundColor Yellow
    }
} else {
    Write-Host "  (Lead template not found at $TemplateLead, skipping tracker)" -ForegroundColor Yellow
}

if ($SkipDeploy) {
    Write-Host "`n[-SkipDeploy] Stopped after scaffold. Run again without -SkipDeploy to deploy." -ForegroundColor Yellow
    return
}

# --- Stage 3: Cloudflare deploy ---
$Token = $env:CLOUDFLARE_API_TOKEN
if (-not $Token) {
    throw "CLOUDFLARE_API_TOKEN env var not set. Required scopes: Pages:Edit, Zone:DNS:Edit on $BaseDomain"
}

$apiHeaders = @{
    Authorization  = "Bearer $Token"
    'Content-Type' = 'application/json'
}

Write-Host "`n=== Cloudflare Pages: create project '$Slug' ===" -ForegroundColor Cyan
Push-Location $RepoRoot
try {
    & npx wrangler pages project create $Slug --production-branch=main 2>&1 | Out-Host
} finally {
    Pop-Location
}

Write-Host "`n=== Deploy folder to Pages project ===" -ForegroundColor Cyan
Push-Location $RepoRoot
try {
    & npx wrangler pages deploy $Slug --project-name=$Slug --branch=main --commit-dirty=true 2>&1 | Out-Host
} finally {
    Pop-Location
}

Write-Host "`n=== Attach custom domain $Subdomain.$BaseDomain ===" -ForegroundColor Cyan
$attachUri = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$Slug/domains"
$attachBody = (@{ name = "$Subdomain.$BaseDomain" } | ConvertTo-Json -Compress)
try {
    $r = Invoke-RestMethod -Method Post -Uri $attachUri -Headers $apiHeaders -Body $attachBody
    Write-Host "  Domain attached, status: $($r.result.status)"
} catch {
    Write-Host "  Error attaching domain: $($_.ErrorDetails.Message)" -ForegroundColor Red
    throw
}

Write-Host "`n=== Create CNAME $Subdomain.$BaseDomain -> $Slug.pages.dev ===" -ForegroundColor Cyan
$cnameUri = "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records"
$cnameBody = (@{
    type    = 'CNAME'
    name    = $Subdomain
    content = "$Slug.pages.dev"
    proxied = $true
    ttl     = 1
    comment = "Cloudflare Pages: $Slug project (affiliated demo)"
} | ConvertTo-Json -Compress)
try {
    $r = Invoke-RestMethod -Method Post -Uri $cnameUri -Headers $apiHeaders -Body $cnameBody
    Write-Host "  CNAME created"
} catch {
    if ($_.ErrorDetails.Message -match '81057|already exists') {
        Write-Host "  CNAME already exists, skipping" -ForegroundColor Yellow
    } else {
        Write-Host "  Error creating CNAME: $($_.ErrorDetails.Message)" -ForegroundColor Red
        throw
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "  Pages URL:        https://$Slug.pages.dev"
Write-Host "  Custom domain:    https://$Subdomain.$BaseDomain"
Write-Host "  Lead tracker:     docs/leads/$Slug.md"
Write-Host "  Demo folder:      $Slug/"
Write-Host ""
Write-Host "Next steps (per docs/network-playbook.md):" -ForegroundColor Cyan
Write-Host "  1. Fill in $Slug/design.md with the brand brief"
Write-Host "  2. Build $Slug/index.html (use bull-oilfield/index.html as the template)"
Write-Host "  3. Add the org row to db/seed-orgs.sql and seed remote D1"
Write-Host "  4. Add to src/pages/Showcase.tsx DEMOS array with status: 'pitch'"
Write-Host "  5. Redeploy: npx wrangler pages deploy $Slug --project-name=$Slug --commit-dirty=true"
