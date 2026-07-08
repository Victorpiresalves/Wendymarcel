(function(){
  "use strict";

  // TODO(Wendy/dono do site): troque pela sua chave gratuita gerada em https://web3forms.com
  // (basta digitar seu e-mail lá, a chave chega na hora, sem senha nem cartão).
  // Enquanto essa chave não for trocada, os formulários abaixo não vão conseguir enviar e-mail.
  var WEB3FORMS_KEY = "COLOQUE_SUA_CHAVE_WEB3FORMS_AQUI";

  var TIPOS = ['Apartamento','Casa','Casa em Condomínio','Chácara','Ponto Comercial','Rancho','Sobrado','Terreno','Terreno em Condomínio'];

  function leadFieldsHtml(prefix, compact){
    var tipoOpts = '<option value="">Qualquer tipo</option>' + TIPOS.map(function(t){
      return '<option value="' + t + '">' + t + '</option>';
    }).join('');
    return (
      '<div class="lead-field"><label for="' + prefix + 'Nome">Nome</label><input id="' + prefix + 'Nome" name="name" type="text" required placeholder="Seu nome"></div>' +
      '<div class="lead-field"><label for="' + prefix + 'Tel">WhatsApp / Telefone</label><input id="' + prefix + 'Tel" name="phone" type="tel" required placeholder="(18) 99999-9999"></div>' +
      (compact ? '' : '<div class="lead-field"><label for="' + prefix + 'Email">E-mail (opcional)</label><input id="' + prefix + 'Email" name="email" type="email" placeholder="voce@email.com"></div>') +
      '<div class="lead-field"><label for="' + prefix + 'Tipo">Tipo de imóvel de interesse</label><select id="' + prefix + 'Tipo" name="tipo_interesse">' + tipoOpts + '</select></div>' +
      (compact ? '' : '<div class="lead-field"><label for="' + prefix + 'Msg">Mensagem (opcional)</label><textarea id="' + prefix + 'Msg" name="message" rows="3" placeholder="Conte o que você procura..."></textarea></div>') +
      '<label class="lead-honeypot"><input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label>' +
      '<button type="submit" class="btn btn-accent btn-block">Quero ser avisado</button>' +
      '<p class="lead-consent">Ao enviar, você concorda com o uso dos seus dados para contato comercial, conforme nossa <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</p>' +
      '<div class="lead-result" data-state="idle"></div>'
    );
  }

  function initLeadForm(form){
    if(!form || form.dataset.leadInit) return;
    form.dataset.leadInit = '1';
    var resultEl = form.querySelector('.lead-result');
    var honeypot = form.querySelector('input[name="botcheck"]');

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(honeypot && honeypot.checked) return;

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      resultEl.dataset.state = 'idle';

      var fd = new FormData(form);
      fd.append('access_key', WEB3FORMS_KEY);
      fd.append('subject', 'Novo lead do site - ' + (form.dataset.origem || 'Site'));
      fd.append('from_name', 'Site Wendy Marcel');
      var emailVal = fd.get('email');
      if(emailVal) fd.append('replyto', emailVal);

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      }).then(function(r){ return r.json(); }).then(function(data){
        if(data.success){
          resultEl.textContent = 'Recebemos seus dados! O Wendy vai te chamar em breve.';
          resultEl.dataset.state = 'success';
          form.reset();
        } else {
          throw new Error((data && data.message) || 'Falha ao enviar');
        }
      }).catch(function(){
        resultEl.textContent = 'Não deu para enviar agora. Que tal falar direto pelo WhatsApp?';
        resultEl.dataset.state = 'error';
      }).finally(function(){
        btn.disabled = false;
        btn.textContent = originalText;
      });
    });
  }

  function mountLeadForm(container, origem, compact){
    if(!container) return;
    container.dataset.origem = origem;
    container.innerHTML = leadFieldsHtml(container.id || 'lead', !!compact);
    initLeadForm(container);
  }

  function showLeadModal(){
    var KEY = 'wendyLeadModalShown';
    try { if(localStorage.getItem(KEY)) return; localStorage.setItem(KEY, '1'); } catch(e){}

    var overlay = document.createElement('div');
    overlay.className = 'lead-modal-overlay';
    overlay.id = 'leadModalOverlay';
    overlay.innerHTML =
      '<div class="lead-modal" role="dialog" aria-label="Deixe seus dados">' +
        '<button type="button" class="lead-modal-close" aria-label="Fechar">&times;</button>' +
        '<span class="eyebrow">Antes de você continuar...</span>' +
        '<h3>Quer que a gente te avise sobre novos imóveis?</h3>' +
        '<p>Deixe seu contato e o Wendy te chama pessoalmente quando surgir uma oportunidade do seu perfil.</p>' +
        '<form class="lead-card" id="leadModalForm"></form>' +
      '</div>';
    document.body.appendChild(overlay);
    mountLeadForm(overlay.querySelector('#leadModalForm'), 'Popup de entrada', true);

    requestAnimationFrame(function(){ overlay.classList.add('is-visible'); });

    function close(){
      overlay.classList.remove('is-visible');
      setTimeout(function(){ overlay.remove(); }, 300);
    }
    overlay.querySelector('.lead-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e){
      if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); }
    });
  }

  function armLeadModalTriggers(){
    var KEY = 'wendyLeadModalShown';
    try { if(localStorage.getItem(KEY)) return; } catch(e){ return; }

    var triggered = false;
    function trigger(){
      if(triggered) return;
      triggered = true;
      showLeadModal();
    }
    setTimeout(trigger, 20000);
    window.addEventListener('scroll', function onScroll(){
      var scrollable = document.body.scrollHeight - window.innerHeight;
      if(scrollable > 0 && (window.scrollY / scrollable) > 0.5){
        trigger();
        window.removeEventListener('scroll', onScroll);
      }
    }, { passive: true });
  }

  window.wendyMountLeadForm = mountLeadForm;
  document.addEventListener('DOMContentLoaded', armLeadModalTriggers);
})();
