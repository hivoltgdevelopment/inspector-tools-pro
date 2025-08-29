param(
  [ValidateSet('save-consent','payment','export','all')]
  [string]$Action = 'save-consent',
  [string]$Url,
  [string]$AnonKey,
  [string]$Phone = '+15551234567',
  [string]$Name = 'Jane Doe',
  [string]$ReportId = 'test-report',
  [string]$UserJwt,
  [string]$OutFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-EnvFromFile {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) { return @{} }
  $map = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { continue }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { continue }
    $k = $line.Substring(0,$idx).Trim()
    $v = $line.Substring($idx+1).Trim().Trim('"')
    $map[$k] = $v
  }
  return $map
}

function Resolve-Config {
  # Try explicit params first
  $cfg = [ordered]@{ Url = $Url; Anon = $AnonKey }
  if ($cfg.Url -and $cfg.Anon) { return $cfg }

  # Try env files relative to script
  $root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
  $envFiles = @(
    Join-Path $root '.env.local',
    Join-Path $root 'env.local',
    Join-Path $root '.env'
  )
  foreach ($f in $envFiles) {
    $map = Read-EnvFromFile -Path $f
    if ($map.Count -gt 0) {
      if (-not $cfg.Url -and $map.ContainsKey('VITE_SUPABASE_URL')) { $cfg.Url = $map['VITE_SUPABASE_URL'] }
      if (-not $cfg.Anon -and $map.ContainsKey('VITE_SUPABASE_ANON_KEY')) { $cfg.Anon = $map['VITE_SUPABASE_ANON_KEY'] }
    }
  }

  if (-not $cfg.Url) { $cfg.Url = Read-Host 'Enter VITE_SUPABASE_URL (e.g., https://YOUR-PROJECT.supabase.co)' }
  if (-not $cfg.Anon) { $cfg.Anon = (Read-Host 'Paste VITE_SUPABASE_ANON_KEY').Trim() }
  return $cfg
}

function New-AuthHeader {
  param([string]$Token)
  $h = [System.Collections.Generic.Dictionary[string,string]]::new()
  $h['Authorization'] = "Bearer $($Token.Trim())"
  return $h
}

function Test-SaveConsent {
  param([string]$BaseUrl,[string]$Anon,[string]$Name,[string]$Phone)
  Write-Host "→ save-sms-consent" -ForegroundColor Cyan
  $headers = New-AuthHeader -Token $Anon
  $body = @{ name=$Name; phone=$Phone; consent=$true } | ConvertTo-Json -Compress
  $uri = "$BaseUrl/functions/v1/save-sms-consent"
  $resp = Invoke-WebRequest -Method POST -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body -UseBasicParsing
  Write-Host ("Status: {0}" -f $resp.StatusCode)
  if ($resp.Content) { Write-Host $resp.Content }
}

function Test-CreatePayment {
  param([string]$BaseUrl,[string]$Anon,[string]$ReportId)
  Write-Host "→ create-payment-session (stub)" -ForegroundColor Cyan
  $headers = New-AuthHeader -Token $Anon
  $body = @{ reportId=$ReportId } | ConvertTo-Json -Compress
  $uri = "$BaseUrl/functions/v1/create-payment-session"
  $resp = Invoke-WebRequest -Method POST -Uri $uri -Headers $headers -ContentType 'application/json' -Body $body -UseBasicParsing
  Write-Host ("Status: {0}" -f $resp.StatusCode)
  if ($resp.Content) { Write-Host $resp.Content }
}

function Test-ExportConsent {
  param([string]$BaseUrl,[string]$UserJwt,[string]$OutFile)
  Write-Host "→ export-consent-data (admin JWT required)" -ForegroundColor Cyan
  if (-not $UserJwt) { $UserJwt = (Read-Host 'Paste admin user JWT').Trim() }
  $headers = New-AuthHeader -Token $UserJwt
  $uri = "$BaseUrl/functions/v1/export-consent-data"
  if ($OutFile) {
    Invoke-WebRequest -Method GET -Uri $uri -Headers $headers -OutFile $OutFile -UseBasicParsing | Out-Null
    Write-Host ("Saved CSV to {0}" -f (Resolve-Path $OutFile))
  } else {
    $resp = Invoke-WebRequest -Method GET -Uri $uri -Headers $headers -UseBasicParsing
    Write-Host ("Status: {0}" -f $resp.StatusCode)
    $lines = ($resp.Content -split "`n")
    $preview = ($lines | Select-Object -First 5) -join "`n"
    Write-Host $preview
  }
}

try {
  $cfg = Resolve-Config
  Write-Host ("Using URL: {0}" -f $cfg.Url) -ForegroundColor Green

  switch ($Action) {
    'save-consent' { Test-SaveConsent -BaseUrl $cfg.Url -Anon $cfg.Anon -Name $Name -Phone $Phone }
    'payment' { Test-CreatePayment -BaseUrl $cfg.Url -Anon $cfg.Anon -ReportId $ReportId }
    'export' { Test-ExportConsent -BaseUrl $cfg.Url -UserJwt $UserJwt -OutFile $OutFile }
    'all' {
      Test-SaveConsent -BaseUrl $cfg.Url -Anon $cfg.Anon -Name $Name -Phone $Phone
      Test-CreatePayment -BaseUrl $cfg.Url -Anon $cfg.Anon -ReportId $ReportId
      Test-ExportConsent -BaseUrl $cfg.Url -UserJwt $UserJwt -OutFile $OutFile
    }
  }
}
catch {
  $e = $_.Exception
  Write-Host ("Error: {0}" -f $e.Message) -ForegroundColor Red
  try {
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      Write-Host $_.ErrorDetails.Message
    } elseif ($e.PSObject.Properties.Name -contains 'Response' -and $e.Response) {
      $stream = $e.Response.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        if ($content) { Write-Host $content }
      }
    }
  } catch {}
  exit 1
}
