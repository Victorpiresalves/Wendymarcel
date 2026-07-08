(function(){
  "use strict";
  var KEY = 'wendyCookieConsent';

  function getConsent(){ try { return localStorage.getItem(KEY); } catch(e){ return null; } }
  function setConsent(v){ try { localStorage.setItem(KEY, v); } catch(e){} }

  window.wendyHasAnalyticsConsent = function(){ return getConsent() === 'accepted'; };

  if(getConsent()) return;

  document.addEventListener('DOMContentLoaded', function(){
    var el = document.createElement('div');
    el.className = 'cookie-banner';
    el.id = 'cookieBanner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Aviso de cookies');
    el.innerHTML =
      '<div class="cookie-banner-text">Usamos cookies e armazenamento local para melhorar sua experiência, como salvar seus imóveis favoritos, e futuramente para entender como você usa o site. Ao continuar navegando, você concorda com nossa <a href="/privacidade.html">Política de Privacidade</a>.</div>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" id="cookieDecline" class="btn btn-outline">Somente essenciais</button>' +
        '<button type="button" id="cookieAccept" class="btn btn-accent">Aceitar todos</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('is-visible'); });

    function dismiss(value){
      setConsent(value);
      el.classList.remove('is-visible');
      setTimeout(function(){ el.remove(); }, 350);
    }
    document.getElementById('cookieAccept').addEventListener('click', function(){ dismiss('accepted'); });
    document.getElementById('cookieDecline').addEventListener('click', function(){ dismiss('declined'); });
  });
})();
