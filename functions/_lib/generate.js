// Ported from generate-pages.ps1 - keep in sync with that script if it changes.
const FOTO_BASE = 'https://wendymarcel.com.br/fotos/';
const SITE_BASE = 'https://wendymarcel.com.br';
const MIDDOT = '·';

export function cidadeDe(l) {
  if (!l) return '';
  let last = l.includes(MIDDOT) ? l.split(MIDDOT).pop().trim() : l.trim();
  last = last.replace(/\/SP\s*$/, '');
  return last.trim();
}

function htmlEscape(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildImoveisJs(listings) {
  // NOTE: must be "var", not "const"/"let" - top-level const/let in a classic
  // script does not attach to window, and imovel.js reads window.IMOVEIS.
  return `var IMOVEIS = ${JSON.stringify(listings, null, 4)};\n`;
}

export function buildPropertyPage(template, im) {
  const title = htmlEscape(im.n);
  const descSource = im.d || `${im.t} em ${im.l}.`;
  let shortDesc = descSource;
  if (shortDesc.length > 155) shortDesc = shortDesc.slice(0, 152).trimEnd() + '...';
  const metaDesc = htmlEscape(shortDesc);
  const firstImg = im.imgs && im.imgs.length ? im.imgs[0] : im.f ? im.f.replace(/^thumb-/, '') : '';
  const ogImage = htmlEscape(FOTO_BASE + firstImg);
  const pageUrl = `${SITE_BASE}/imoveis/${im.c}.html`;
  const cidade = cidadeDe(im.l);

  const imgUrls =
    im.imgs && im.imgs.length ? im.imgs.map((g) => FOTO_BASE + g) : im.f ? [FOTO_BASE + firstImg] : [];

  const descForLd = im.d || `${im.t} em ${im.l}.`;

  const listingLd = {
    '@type': 'RealEstateListing',
    '@id': pageUrl,
    name: im.n,
    description: descForLd,
    url: pageUrl,
    image: imgUrls,
    address: { '@type': 'PostalAddress', addressLocality: cidade, addressRegion: 'SP', addressCountry: 'BR' },
  };
  if (im.lat && im.lng) {
    listingLd.geo = { '@type': 'GeoCoordinates', latitude: im.lat, longitude: im.lng };
  }
  if (im.q) listingLd.numberOfRooms = im.q;
  if (im.b) listingLd.numberOfBathroomsTotal = im.b;
  if (im.p != null) {
    listingLd.offers = {
      '@type': 'Offer',
      price: im.p,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    };
  }

  const breadcrumbLd = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_BASE}/index.html` },
      { '@type': 'ListItem', position: 2, name: 'Comprar', item: `${SITE_BASE}/index.html#acervo` },
      { '@type': 'ListItem', position: 3, name: im.n, item: pageUrl },
    ],
  };

  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [listingLd, breadcrumbLd] }).replace(
    /<\//g,
    '<\\/'
  );

  let page = template;
  page = page.split('__CODE__').join(im.c);
  page = page.split('__TITLE__').join(title);
  page = page.split('__METADESC__').join(metaDesc);
  page = page.split('__OGIMAGE__').join(ogImage);
  page = page.split('__PAGEURL__').join(htmlEscape(pageUrl));
  page = page.split('__JSONLD__').join(jsonLd);
  return page;
}

export function buildSitemap(listings) {
  const urls = [];
  urls.push(`  <url><loc>${SITE_BASE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`);
  urls.push(
    `  <url><loc>${SITE_BASE}/privacidade.html</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`
  );
  for (const im of listings) {
    urls.push(
      `  <url><loc>${SITE_BASE}/imoveis/${im.c}.html</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('\n') +
    '\n</urlset>\n'
  );
}
