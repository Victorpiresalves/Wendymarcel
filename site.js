(function(){
  "use strict";

  var onDetailPage = window.location.pathname.indexOf('/imoveis/') !== -1;
  var FOTO_BASE = onDetailPage ? '../fotos/' : '/fotos/';
  var HREF_BASE = onDetailPage ? '' : 'imoveis/';
  var WPP = '5518997078784';

  var currency = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:0});
  function fmtPrice(p){ return p===null ? "Sob consulta" : currency.format(p); }

  function cidadeDe(l){
    var m = l.match(/([A-Za-zÀ-ÿ]+)\/SP/);
    if(m) return m[1];
    if(l.indexOf("Birigui")>=0) return "Birigui";
    return "Outras";
  }

  function placeholderSvg(){
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#EEEFFA"/><g fill="none" stroke="#2E3191" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path d="M130 200 L130 150 L200 105 L270 150 L270 200 Z"/><line x1="100" y1="200" x2="300" y2="200"/></g><text x="200" y="245" text-anchor="middle" fill="#6A6F80" font-family="Montserrat, sans-serif" font-size="12" letter-spacing="3">FOTO EM BREVE</text></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  var PLACEHOLDER = placeholderSvg();

  var SPEC_ICONS = {
    q: '<svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="7" rx="1.5"/><path d="M3 18v2M21 18v2"/><path d="M3 11V8a2 2 0 0 1 2-2h5v5"/></svg>',
    b: '<svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M4 12V7a2 2 0 0 1 2-2"/><line x1="3" y1="19" x2="3" y2="21"/><line x1="21" y1="19" x2="21" y2="21"/></svg>',
    v: '<svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13"/><rect x="2" y="13" width="20" height="5" rx="1.5"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>',
    a: '<svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>'
  };

  var HEART_PATH = 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z';

  var FAV_KEY = 'wendyFavoritos';
  function getFavorites(){
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch(e){ return []; }
  }
  function isFavorite(code){ return getFavorites().indexOf(code) !== -1; }
  function toggleFavorite(code){
    var favs = getFavorites();
    var i = favs.indexOf(code);
    if(i === -1) favs.push(code); else favs.splice(i,1);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    return favs;
  }

  function galleryOf(im){
    if(im.imgs && im.imgs.length) return im.imgs;
    if(im.f) return [im.f];
    return [];
  }

  function cardHtml(im){
    var specs = [];
    if(im.q) specs.push('<span>' + SPEC_ICONS.q + im.q + ' quartos</span>');
    if(im.b) specs.push('<span>' + SPEC_ICONS.b + im.b + ' banheiros</span>');
    if(im.v) specs.push('<span>' + SPEC_ICONS.v + im.v + ' vagas</span>');
    if(im.a) specs.push('<span>' + SPEC_ICONS.a + im.a + '</span>');
    var msg = encodeURIComponent('Olá Wendy! Tenho interesse no imóvel ' + im.n + ' (cód. ' + im.c + '). Pode me passar mais informações?');
    var gal = galleryOf(im);
    var foto = gal.length ? (FOTO_BASE + gal[0]) : PLACEHOLDER;
    var href = HREF_BASE + im.c + '.html';
    var isFav = isFavorite(im.c);
    return (
      '<article class="property-card">' +
        '<div class="property-photo-wrap">' +
          '<a class="property-photo-link" href="' + href + '">' +
            '<div class="property-photo">' +
              '<img src="' + foto + '" alt="' + im.n + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'">' +
              '<span class="property-tag">' + im.t + '</span>' +
              '<span class="property-code">cód. ' + im.c + '</span>' +
            '</div>' +
          '</a>' +
          '<button type="button" class="fav-btn' + (isFav ? ' is-fav' : '') + '" data-fav="' + im.c + '" aria-label="' + (isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '"><svg viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + HEART_PATH + '"/></svg></button>' +
        '</div>' +
        '<div class="property-body">' +
          '<span class="property-price">' + fmtPrice(im.p) + '</span>' +
          '<a class="property-name" href="' + href + '">' + im.n + '</a>' +
          '<span class="property-loc">' + im.l + '</span>' +
          '<div class="property-specs">' + specs.join('') + '</div>' +
          '<div class="property-cta"><a href="' + href + '">Ver detalhes</a><a class="cta-whatsapp" href="https://wa.me/' + WPP + '?text=' + msg + '" target="_blank" rel="noopener">Tenho interesse</a></div>' +
        '</div>' +
      '</article>'
    );
  }

  window.WendySite = {
    FOTO_BASE: FOTO_BASE,
    WPP: WPP,
    fmtPrice: fmtPrice,
    cidadeDe: cidadeDe,
    PLACEHOLDER: PLACEHOLDER,
    SPEC_ICONS: SPEC_ICONS,
    HEART_PATH: HEART_PATH,
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    galleryOf: galleryOf,
    cardHtml: cardHtml
  };
})();
