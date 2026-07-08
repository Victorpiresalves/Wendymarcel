$ErrorActionPreference = "Stop"
$root = "C:\Projetos\wendymarcel"

$dataRaw = [System.IO.File]::ReadAllText("$root\imoveis-data.json", [System.Text.Encoding]::UTF8)
$data = $dataRaw | ConvertFrom-Json

$cacheRaw = [System.IO.File]::ReadAllText("$root\geocode-cache.json", [System.Text.Encoding]::UTF8)
$cache = $cacheRaw | ConvertFrom-Json

$cacheMap = @{}
foreach ($prop in $cache.PSObject.Properties) {
  $cacheMap[$prop.Name] = $prop.Value
}

$matched = 0
foreach ($im in $data) {
  if ($cacheMap.ContainsKey($im.l)) {
    $geo = $cacheMap[$im.l]
    $im | Add-Member -MemberType NoteProperty -Name "lat" -Value $geo.lat -Force
    $im | Add-Member -MemberType NoteProperty -Name "lng" -Value $geo.lng -Force
    $matched++
  } else {
    Write-Output "NO MATCH for location: $($im.l)"
  }
}

$outJson = $data | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText("$root\imoveis-data.json", $outJson, [System.Text.UTF8Encoding]::new($false))
Write-Output "Matched $matched / $($data.Count) properties with coordinates."
