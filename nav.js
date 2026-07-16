(function(){
  "use strict";

  var navToggle = document.getElementById('navToggle');
  var mobilePanel = document.getElementById('mobilePanel');
  function closeNav(){
    navToggle.setAttribute('aria-expanded','false');
    mobilePanel.classList.remove('is-open');
    mobilePanel.setAttribute('aria-hidden','true');
    document.body.classList.remove('nav-open');
  }
  function openNav(){
    navToggle.setAttribute('aria-expanded','true');
    mobilePanel.classList.add('is-open');
    mobilePanel.setAttribute('aria-hidden','false');
    document.body.classList.add('nav-open');
  }
  navToggle.addEventListener('click', function(){
    if(navToggle.getAttribute('aria-expanded') === 'true') closeNav(); else openNav();
  });
  mobilePanel.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeNav); });
  document.getElementById('mobilePanelClose').addEventListener('click', closeNav);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', function(){ if(window.innerWidth >= 940) closeNav(); });

  var header = document.getElementById('topo');
  function onScroll(){ header.classList.toggle('is-scrolled', window.scrollY > 8); }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-in'); });
  }

  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
})();
