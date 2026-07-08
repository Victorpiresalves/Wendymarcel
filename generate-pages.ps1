$ErrorActionPreference = "Stop"
$root = "C:\Projetos\wendymarcel"
$json = [System.IO.File]::ReadAllText("$root\imoveis-data.json", [System.Text.Encoding]::UTF8)
$data = $json | ConvertFrom-Json
$template = [System.IO.File]::ReadAllText("$root\imovel-template.html", [System.Text.Encoding]::UTF8)
$fotoBase = "https://wendymarcel.com.br/fotos/"

# NOTE: must be "var", not "const"/"let" - top-level const/let in a classic
# script does not attach to window, and imovel.js reads window.IMOVEIS.
$dataJs = "var IMOVEIS = " + $json + ";`n"
[System.IO.File]::WriteAllText("$root\imoveis-data.js", $dataJs, [System.Text.UTF8Encoding]::new($false))
Write-Output "Regenerated imoveis-data.js"

function HtmlEscape($s) {
  if ($null -eq $s) { return "" }
  $s = $s -replace '&', '&amp;'
  $s = $s -replace '"', '&quot;'
  $s = $s -replace '<', '&lt;'
  $s = $s -replace '>', '&gt;'
  return $s
}

New-Item -ItemType Directory -Force -Path "$root\imoveis" | Out-Null

$count = 0
foreach ($im in $data) {
  $title = HtmlEscape($im.n)
  $descSource = if ($im.d) { $im.d } else { "$($im.t) em $($im.l)." }
  $shortDesc = $descSource
  if ($shortDesc.Length -gt 155) { $shortDesc = $shortDesc.Substring(0,152).TrimEnd() + "..." }
  $metaDesc = HtmlEscape($shortDesc)
  $firstImg = if ($im.imgs -and $im.imgs.Count -gt 0) { $im.imgs[0] } elseif ($im.f) { $im.f -replace '^thumb-','' } else { "" }
  $ogImage = HtmlEscape($fotoBase + $firstImg)

  $page = $template
  $page = $page.Replace("__CODE__", $im.c)
  $page = $page.Replace("__TITLE__", $title)
  $page = $page.Replace("__METADESC__", $metaDesc)
  $page = $page.Replace("__OGIMAGE__", $ogImage)

  $outPath = "$root\imoveis\$($im.c).html"
  [System.IO.File]::WriteAllText($outPath, $page, [System.Text.UTF8Encoding]::new($false))
  $count++
}
Write-Output "Generated $count property pages."
