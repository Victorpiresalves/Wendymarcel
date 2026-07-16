(function(){
  "use strict";

  var S = window.WendySite;
  var FOTO_BASE = S.FOTO_BASE;
  var WPP = S.WPP;
  var fmtPrice = S.fmtPrice;
  var cidadeDe = S.cidadeDe;
  var PLACEHOLDER = S.PLACEHOLDER;
  var SPEC_ICONS = S.SPEC_ICONS;
  var HEART_PATH = S.HEART_PATH;
  var isFavorite = S.isFavorite;
  var toggleFavorite = S.toggleFavorite;
  var galleryOf = S.galleryOf;
  var cardHtml = S.cardHtml;

  function initPropertyPage(){
    var root = document.getElementById('pdRoot');
    if(!root) return;
    var im = (window.IMOVEIS || []).find(function(x){ return x.c === window.PROPERTY_CODE; });
    if(!im){
      root.innerHTML = '<div class="container" style="padding:80px 0;text-align:center"><h1>Imóvel não encontrado</h1><p style="color:var(--muted);margin-top:12px"><a href="../index.html#acervo" style="color:var(--navy);font-weight:700">Voltar para o acervo</a></p></div>';
      return;
    }

    var gallery = galleryOf(im).map(function(f){ return FOTO_BASE + f; });
    if(!gallery.length) gallery = [PLACEHOLDER];
    var curIndex = 0;

    document.title = im.n + ' | Wendy Marcel Especialista Imobiliário';
    var metaDesc = document.querySelector('meta[name="description"]');
    var shortDesc = (im.d || (im.t + ' em ' + im.l + '.')).slice(0,155);
    if(metaDesc) metaDesc.setAttribute('content', shortDesc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if(ogTitle) ogTitle.setAttribute('content', im.n + ' | Wendy Marcel');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if(ogDesc) ogDesc.setAttribute('content', shortDesc);
    var ogImg = document.querySelector('meta[property="og:image"]');
    if(ogImg) ogImg.setAttribute('content', window.location.origin + gallery[0].replace('..',''));

    var waMsg = encodeURIComponent('Olá Wendy! Tenho interesse no imóvel ' + im.n + ' (cód. ' + im.c + '). Pode me passar mais informações?');
    var waLink = 'https://wa.me/' + WPP + '?text=' + waMsg;

    var specs = [];
    if(im.q) specs.push({v:im.q, l:'Quartos', icon:SPEC_ICONS.q});
    if(im.b) specs.push({v:im.b, l:'Banheiros', icon:SPEC_ICONS.b});
    if(im.v) specs.push({v:im.v, l:'Vagas', icon:SPEC_ICONS.v});
    if(im.a) specs.push({v:im.a, l:'Área', icon:SPEC_ICONS.a});

    var pageUrl = window.location.href;

    root.innerHTML =
      '<div class="container">' +
        '<nav class="breadcrumb" aria-label="Breadcrumb">' +
          '<a href="../index.html">Início</a><span class="sep">/</span>' +
          '<a href="../index.html#acervo">Comprar</a><span class="sep">/</span>' +
          '<span class="current">' + im.n + '</span>' +
        '</nav>' +
        '<a class="pd-back" href="../index.html#acervo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>Voltar ao acervo</a>' +
        '<header class="pd-header">' +
          '<span class="pd-tag">' + im.t + '</span>' +
          '<div class="pd-title-row">' +
            '<h1 class="pd-title">' + im.n + '</h1>' +
            '<span class="pd-code">cód. ' + im.c + '</span>' +
          '</div>' +
          '<div class="pd-loc"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' + im.l + '</div>' +
          '<div class="pd-price-row"><span class="pd-price">' + fmtPrice(im.p) + '</span>' +
            '<button type="button" id="pdFavBtn" class="pd-fav-btn' + (isFavorite(im.c) ? ' is-fav' : '') + '" aria-label="' + (isFavorite(im.c) ? 'Remover dos favoritos' : 'Adicionar aos favoritos') + '"><svg viewBox="0 0 24 24" fill="' + (isFavorite(im.c) ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + HEART_PATH + '"/></svg> Favoritar</button>' +
          '</div>' +
        '</header>' +

        '<div class="pd-gallery">' +
          '<div class="pd-main-photo" id="pdMainPhoto">' +
            '<img id="pdMainImg" src="' + gallery[0] + '" alt="' + im.n + '" onerror="this.onerror=null;this.src=window.WendySite.PLACEHOLDER">' +
            (gallery.length > 1 ? '<button class="pd-nav-arrow prev" id="pdPrev" aria-label="Foto anterior"><svg viewBox="0 0 24 24" fill="none" stroke="#1E2033" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button><button class="pd-nav-arrow next" id="pdNext" aria-label="Próxima foto"><svg viewBox="0 0 24 24" fill="none" stroke="#1E2033" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' : '') +
            '<span class="pd-photo-count" id="pdPhotoCount">1 / ' + gallery.length + '</span>' +
          '</div>' +
          (gallery.length > 1 ? '<div class="pd-thumbs" id="pdThumbs">' + gallery.map(function(src,i){ return '<button data-i="' + i + '" class="' + (i===0?'active':'') + '"><img src="' + src + '" alt="Foto ' + (i+1) + '" loading="lazy" onerror="this.onerror=null;this.src=window.WendySite.PLACEHOLDER"></button>'; }).join('') + '</div>' : '') +
        '</div>' +

        '<div class="pd-body">' +
          '<div>' +
            '<div class="pd-specs">' + specs.map(function(s){ return '<div class="pd-spec">' + s.icon + '<b>' + s.v + '</b><span>' + s.l + '</span></div>'; }).join('') + '</div>' +
            '<h2 class="pd-section-title">Sobre o imóvel</h2>' +
            '<p class="pd-desc">' + (im.d || ('Imóvel do tipo ' + im.t + ', localizado em ' + im.l + '. Entre em contato com o Wendy para mais detalhes e para agendar uma visita.')) + '</p>' +
            '<div class="pd-share">' +
              '<a href="https://wa.me/?text=' + encodeURIComponent(im.n + ' - ' + fmtPrice(im.p) + ' ' + pageUrl) + '" target="_blank" rel="noopener" aria-label="Compartilhar no WhatsApp"><svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.3c1.9 1 4 1.6 6.2 1.6 6.6 0 12-5.3 12-11.9S22.6 3 16 3z"/></svg></a>' +
              '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl) + '" target="_blank" rel="noopener" aria-label="Compartilhar no Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg></a>' +
              '<a href="https://api.whatsapp.com/send?text=' + encodeURIComponent(pageUrl) + '" target="_blank" rel="noopener" aria-label="Copiar link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"/></svg></a>' +
            '</div>' +
            (im.lat && im.lng ? ('<h2 class="pd-section-title">Localização</h2><div id="pdMap" class="pd-map"></div>') : '') +
          '</div>' +
          '<aside class="pd-sidebar">' +
            '<div class="pd-agent-card">' +
              '<div class="pd-agent-top">' +
                '<img class="pd-agent-photo" src="../corretor.jpg" alt="Wendy Marcel">' +
                '<div><div class="pd-agent-name">Wendy Marcel</div><div class="pd-agent-creci"><svg class="creci-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 Z"/><polyline points="9 12 11 14 15 9.5"/></svg>CRECI 239577-F</div></div>' +
              '</div>' +
              '<a class="btn btn-accent btn-block" href="' + waLink + '" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
              '<a class="btn btn-outline btn-block" style="margin-top:10px" href="tel:+5518997329591">Ligar agora</a>' +
              '<ul class="pd-agent-perks">' +
                '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Atendimento pessoal do início ao fim</li>' +
                '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Ajuda com simulação de financiamento</li>' +
                '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Mais de 10 anos em Birigui e região</li>' +
              '</ul>' +
              '<button type="button" class="pd-lead-toggle" id="pdLeadToggle">Prefere que a gente te ligue? Deixe seus dados</button>' +
              '<div class="pd-lead-form" id="pdLeadFormWrap"><form id="pdLeadForm"></form></div>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>';

    // Lead form toggle
    var pdLeadToggle = document.getElementById('pdLeadToggle');
    var pdLeadFormWrap = document.getElementById('pdLeadFormWrap');
    if(pdLeadToggle) pdLeadToggle.addEventListener('click', function(){
      var isOpen = pdLeadFormWrap.classList.toggle('is-open');
      if(isOpen && window.wendyMountLeadForm){
        window.wendyMountLeadForm(document.getElementById('pdLeadForm'), 'Imóvel ' + im.c + ' - ' + im.n, true);
      }
      pdLeadToggle.style.display = isOpen ? 'none' : 'inline-flex';
    });

    // Favorite button
    var pdFavBtn = document.getElementById('pdFavBtn');
    if(pdFavBtn) pdFavBtn.addEventListener('click', function(){
      toggleFavorite(im.c);
      var fav = isFavorite(im.c);
      pdFavBtn.classList.toggle('is-fav', fav);
      pdFavBtn.setAttribute('aria-label', fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      pdFavBtn.querySelector('svg').setAttribute('fill', fav ? 'currentColor' : 'none');
    });

    // Gallery interactions
    var mainImg = document.getElementById('pdMainImg');
    var photoCount = document.getElementById('pdPhotoCount');
    var thumbs = document.getElementById('pdThumbs');
    function setIndex(i){
      curIndex = (i + gallery.length) % gallery.length;
      mainImg.src = gallery[curIndex];
      if(photoCount) photoCount.textContent = (curIndex+1) + ' / ' + gallery.length;
      if(thumbs){
        thumbs.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', Number(b.getAttribute('data-i')) === curIndex); });
        var activeBtn = thumbs.querySelector('button.active');
        if(activeBtn) activeBtn.scrollIntoView({block:'nearest', inline:'center', behavior:'smooth'});
      }
      if(lbImg && lightbox.classList.contains('is-open')){
        lbImg.src = gallery[curIndex];
        lbCount.textContent = (curIndex+1) + ' / ' + gallery.length;
      }
    }
    var prevBtn = document.getElementById('pdPrev');
    var nextBtn = document.getElementById('pdNext');
    if(prevBtn) prevBtn.addEventListener('click', function(){ setIndex(curIndex-1); });
    if(nextBtn) nextBtn.addEventListener('click', function(){ setIndex(curIndex+1); });
    if(thumbs) thumbs.addEventListener('click', function(e){
      var btn = e.target.closest('button');
      if(btn) setIndex(Number(btn.getAttribute('data-i')));
    });

    // Lightbox
    var lightbox = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbCount = document.getElementById('lbCount');
    document.getElementById('pdMainPhoto').addEventListener('click', function(e){
      if(e.target.closest('.pd-nav-arrow')) return;
      lbImg.src = gallery[curIndex];
      lbCount.textContent = (curIndex+1) + ' / ' + gallery.length;
      lightbox.classList.add('is-open');
    });
    document.getElementById('lbClose').addEventListener('click', function(){ lightbox.classList.remove('is-open'); });
    lightbox.addEventListener('click', function(e){ if(e.target === lightbox) lightbox.classList.remove('is-open'); });
    document.getElementById('lbPrev').addEventListener('click', function(){ setIndex(curIndex-1); });
    document.getElementById('lbNext').addEventListener('click', function(){ setIndex(curIndex+1); });
    document.addEventListener('keydown', function(e){
      if(!lightbox.classList.contains('is-open')) return;
      if(e.key === 'Escape') lightbox.classList.remove('is-open');
      if(e.key === 'ArrowLeft') setIndex(curIndex-1);
      if(e.key === 'ArrowRight') setIndex(curIndex+1);
    });

    // Location map
    var mapEl = document.getElementById('pdMap');
    if(mapEl && window.L && im.lat && im.lng){
      var map = L.map('pdMap', { scrollWheelZoom: false }).setView([im.lat, im.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      L.marker([im.lat, im.lng]).addTo(map);
    }

    // Related listings
    var related = (window.IMOVEIS || [])
      .filter(function(x){ return x.c !== im.c && (x.t === im.t || cidadeDe(x.l) === cidadeDe(im.l)); })
      .slice(0, 3);
    if(related.length < 3){
      (window.IMOVEIS || []).forEach(function(x){
        if(related.length >= 3) return;
        if(x.c !== im.c && related.indexOf(x) === -1 && !related.some(function(r){ return r.c === x.c; })) related.push(x);
      });
      related = related.slice(0,3);
    }
    var relatedGrid = document.getElementById('relatedGrid');
    if(relatedGrid && related.length){
      relatedGrid.innerHTML = related.map(cardHtml).join('');
      relatedGrid.addEventListener('click', function(e){
        var btn = e.target.closest('.fav-btn');
        if(!btn) return;
        e.preventDefault();
        toggleFavorite(btn.getAttribute('data-fav'));
        var fav = isFavorite(btn.getAttribute('data-fav'));
        btn.classList.toggle('is-fav', fav);
        btn.setAttribute('aria-label', fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        btn.querySelector('svg').setAttribute('fill', fav ? 'currentColor' : 'none');
      });
    } else {
      var relatedSection = document.getElementById('relatedSection');
      if(relatedSection) relatedSection.style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', initPropertyPage);

  window.__wendyCardHtml = cardHtml;
})();
