$ErrorActionPreference = "Stop"
$root = "C:\Projetos\wendymarcel"
$locs = [System.IO.File]::ReadAllLines("$root\unique_locations.txt", [System.Text.Encoding]::UTF8) | Where-Object { $_.Trim() -ne "" }

$headers = @{ "User-Agent" = "WendyMarcelSite/1.0 (contact: daap.alves@gmail.com)" }
$result = @{}

$MIDDOT = [char]0x00B7

function TryGeocode($query) {
  $uri = "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=" + [System.Uri]::EscapeDataString($query)
  try {
    $resp = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    if ($resp -and $resp.Count -gt 0) {
      return @{ lat = [double]$resp[0].lat; lng = [double]$resp[0].lon }
    }
  } catch {
    Write-Output "  error: $_"
  }
  return $null
}

foreach ($loc in $locs) {
  $loc = $loc.Trim()
  if ($loc -eq "") { continue }

  $bairro = $null
  $cidade = "Birigui"

  if ($loc.Contains($MIDDOT)) {
    $parts = $loc.Split($MIDDOT)
    $left = $parts[0].Trim()
    $right = $parts[1].Trim()
    if ($right -match "^a\s+[\d,]+\s*km\s+de\s+(.+)$") {
      $bairro = $left
      $cidade = $Matches[1].Trim()
    } elseif ($right -match "^(.+)/SP$") {
      $bairro = $left
      $cidade = $Matches[1].Trim()
    } else {
      $bairro = $left
      $cidade = $right
    }
  } elseif ($loc -match "^(.+)/SP$") {
    $cidade = $Matches[1].Trim()
  } else {
    $cidade = $loc
  }

  Write-Output "Geocoding: '$loc' (bairro='$bairro' cidade='$cidade')"
  $found = $null

  if ($bairro) {
    $found = TryGeocode("$bairro, $cidade, SP, Brasil")
    Start-Sleep -Milliseconds 1100
  }
  if (-not $found) {
    $found = TryGeocode("$cidade, SP, Brasil")
    Start-Sleep -Milliseconds 1100
  }

  if ($found) {
    Write-Output "  -> $($found.lat), $($found.lng)"
    $result[$loc] = $found
  } else {
    Write-Output "  -> NOT FOUND"
  }
}

$json = $result | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$root\geocode-cache.json", $json, [System.Text.UTF8Encoding]::new($false))
Write-Output "Done. Saved $($result.Count)/$($locs.Count) results."
