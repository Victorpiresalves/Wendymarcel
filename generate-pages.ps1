$ErrorActionPreference = "Stop"
$root = "C:\Projetos\wendymarcel"
$json = [System.IO.File]::ReadAllText("$root\imoveis-data.json", [System.Text.Encoding]::UTF8)
$data = $json | ConvertFrom-Json
$template = [System.IO.File]::ReadAllText("$root\imovel-template.html", [System.Text.Encoding]::UTF8)
$fotoBase = "https://wendymarcel.com.br/fotos/"
$siteBase = "https://wendymarcel.com.br"
$inicioLabel = "In" + [char]0x00ED + "cio"
$middot = [char]0x00B7

function CidadeDe($l) {
  if ($l.Contains($middot)) {
    $parts = $l.Split($middot)
    $last = $parts[$parts.Count - 1].Trim()
  } else {
    $last = $l.Trim()
  }
  $last = $last -replace "/SP\s*$", ""
  return $last.Trim()
}

function JsonEscape($s) {
  if ($null -eq $s) { return "" }
  $s = $s.Replace('\', '\\')
  $s = $s.Replace('"', '\"')
  $s = $s.Replace("`r`n", ' ')
  $s = $s.Replace("`n", ' ')
  $s = $s.Replace("`r", ' ')
  $s = $s.Replace('</', '<\/')
  return $s
}

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

  $pageUrl = "$siteBase/imoveis/$($im.c).html"
  $cidade = CidadeDe($im.l)

  $imgUrls = @()
  if ($im.imgs -and $im.imgs.Count -gt 0) {
    foreach ($g in $im.imgs) { $imgUrls += ($fotoBase + $g) }
  } elseif ($im.f) {
    $imgUrls += ($fotoBase + $firstImg)
  }
  $imgJson = "[" + (($imgUrls | ForEach-Object { '"' + (JsonEscape($_)) + '"' }) -join ",") + "]"

  $descForLd = if ($im.d) { $im.d } else { "$($im.t) em $($im.l)." }

  $geoJson = ""
  if ($im.lat -and $im.lng) {
    $geoJson = ',"geo":{"@type":"GeoCoordinates","latitude":' + $im.lat + ',"longitude":' + $im.lng + '}'
  }

  $roomsJson = ""
  if ($im.q) { $roomsJson += ',"numberOfRooms":' + $im.q }
  if ($im.b) { $roomsJson += ',"numberOfBathroomsTotal":' + $im.b }

  $offersJson = ""
  if ($null -ne $im.p) {
    $offersJson = ',"offers":{"@type":"Offer","price":' + $im.p + ',"priceCurrency":"BRL","availability":"https://schema.org/InStock","url":"' + (JsonEscape($pageUrl)) + '"}'
  }

  $listingLd = '{"@type":"RealEstateListing","@id":"' + (JsonEscape($pageUrl)) + '","name":"' + (JsonEscape($im.n)) + '","description":"' + (JsonEscape($descForLd)) + '","url":"' + (JsonEscape($pageUrl)) + '","image":' + $imgJson + ',"address":{"@type":"PostalAddress","addressLocality":"' + (JsonEscape($cidade)) + '","addressRegion":"SP","addressCountry":"BR"}' + $geoJson + $roomsJson + $offersJson + '}'

  $breadcrumbLd = '{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"' + (JsonEscape($inicioLabel)) + '","item":"' + $siteBase + '/index.html"},{"@type":"ListItem","position":2,"name":"Comprar","item":"' + $siteBase + '/index.html#acervo"},{"@type":"ListItem","position":3,"name":"' + (JsonEscape($im.n)) + '","item":"' + (JsonEscape($pageUrl)) + '"}]}'

  $jsonLd = '{"@context":"https://schema.org","@graph":[' + $listingLd + ',' + $breadcrumbLd + ']}'

  $page = $template
  $page = $page.Replace("__CODE__", $im.c)
  $page = $page.Replace("__TITLE__", $title)
  $page = $page.Replace("__METADESC__", $metaDesc)
  $page = $page.Replace("__OGIMAGE__", $ogImage)
  $page = $page.Replace("__PAGEURL__", (HtmlEscape($pageUrl)))
  $page = $page.Replace("__JSONLD__", $jsonLd)

  $outPath = "$root\imoveis\$($im.c).html"
  [System.IO.File]::WriteAllText($outPath, $page, [System.Text.UTF8Encoding]::new($false))
  $count++
}
Write-Output "Generated $count property pages."

$sitemapUrls = @()
$sitemapUrls += '  <url><loc>' + $siteBase + '/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>'
$sitemapUrls += '  <url><loc>' + $siteBase + '/privacidade.html</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>'
foreach ($im in $data) {
  $sitemapUrls += '  <url><loc>' + $siteBase + '/imoveis/' + $im.c + '.html</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>'
}
$sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>' + "`n" + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "`n" + ($sitemapUrls -join "`n") + "`n" + '</urlset>' + "`n"
[System.IO.File]::WriteAllText("$root\sitemap.xml", $sitemapXml, [System.Text.UTF8Encoding]::new($false))
Write-Output "Regenerated sitemap.xml"
