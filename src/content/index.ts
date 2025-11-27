/**
 * Content Script
 * 
 * Executa dentro das páginas web para detectar se a página atual é um site SEI.
 * Usa múltiplas heurísticas (URL, título, elementos DOM) para identificar sites SEI
 * e notifica o background script quando detectado.
 */

import type { Message } from '../shared/types';

// Log imediato para confirmar que o content script está sendo executado
console.debug('[Painel SEI][ContentScript] script loaded', { url: location.href, readyState: document.readyState });

/**
 * Verifica se a página atual é um site SEI usando diferentes heurísticas
 * @returns Objeto com resultado da detecção e informações extraídas (URL, nome do órgão)
 */
function isSeiSite(): { matched: boolean; url?: string; name?: string } {
  const url = location.origin + location.pathname;
  const title = document.title || '';
  
  // Heurística 1: Verifica se a URL contém "sei" ou caminho /sei/
  const hasSeiInUrl = /\bsei\b/i.test(location.pathname) || /\/sei\//i.test(location.href);
  
  // Heurística 2: Verifica se o título contém "SEI" ou "Sistema Eletrônico de Informações"
  const hasSeiInTitle = /(\bSEI\b|Sistema Eletrônico de Informações)/i.test(title);
  
  // Heurística 3: Verifica presença de elementos DOM característicos do SEI
  const knownSelectors = ['#main_menu', '#infraBarraSuperior', '#divInfraAreaTela', 'frameset[name="main"]'];
  const hasKnownDom = knownSelectors.some(sel => !!document.querySelector(sel));
  
  // Considera SEI se qualquer heurística for positiva
  const matched = hasSeiInUrl || hasSeiInTitle || hasKnownDom;
  
  // Tenta extrair o nome do órgão do logo da barra superior
  let name: string | undefined;
  const orgEl = document.querySelector('#infraBarraSuperiorLogo a[title]') as HTMLAnchorElement | null;
  if (orgEl && orgEl.title) name = orgEl.title;
  
  return { matched, url, name };
}

/**
 * Notifica o background script quando um site SEI é detectado
 * Envia mensagem com URL e nome do órgão (se disponível)
 * Também detecta e envia a área/setor atual
 */
function notifyDetection() {
  console.debug('[Painel SEI][ContentScript][notifyDetection] called');
  try {
    const det = isSeiSite();
    console.debug('[Painel SEI][ContentScript][notifyDetection] detect?', {
      matched: det.matched,
      url: det.url,
      title: document.title,
      location: location.href
    });
    if (!det.matched) {
      console.debug('[Painel SEI][ContentScript][notifyDetection] not a SEI site, skipping');
      return;
    }
    if (!det.url) {
      console.debug('[Painel SEI][ContentScript][notifyDetection] no URL detected, skipping');
      return;
    }
    
    console.debug('[Painel SEI][ContentScript][notifyDetection] SEI site detected, injecting button and detecting area');
    
    // Injeta botão na barra do SEI
    console.debug('[Painel SEI][ContentScript][notifyDetection] trying to insert side panel button');
    injectSeiBarButton();
    
    // Detecta e envia a área/setor atual
    detectAndNotifySEIContext();
  } catch (err) {
    console.error('[Painel SEI][ContentScript][notifyDetection] error during detection', err);
  }
}

/**
 * Injeta um botão na barra superior do SEI para abrir o painel lateral
 */
let _injectAttempts = 0;
const _INJECT_MAX_ATTEMPTS = 5;

function injectSeiBarButton() {
  // Verifica se o botão já foi injetado
  const existing = document.getElementById('painel-sei-button');
  if (existing) {
    console.debug('[Painel SEI][ContentScript][injectSeiBarButton] button already present, skipping');
    return;
  }
  
  // Localiza a barra do SEI (lado direito onde ficam os ícones)
  const barraD = document.querySelector('#divInfraBarraSistemaPadraoD');
  if (!barraD) {
    _injectAttempts++;
    console.debug('[Painel SEI][ContentScript][injectSeiBarButton] barra superior não encontrada (#divInfraBarraSistemaPadraoD)', {
      attempt: _injectAttempts,
      max: _INJECT_MAX_ATTEMPTS
    });
    if (_injectAttempts <= _INJECT_MAX_ATTEMPTS) {
      setTimeout(() => {
        injectSeiBarButton();
      }, 800);
    } else {
      console.warn('[Painel SEI][ContentScript][injectSeiBarButton] desistindo de injetar botão após múltiplas tentativas');
    }
    return;
  }
  
  // Cria o botão seguindo o mesmo padrão visual dos outros ícones da barra
  const navItem = document.createElement('div');
  navItem.className = 'nav-item d-md-flex infraAcaoBarraSistema';
  navItem.id = 'painel-sei-button';
  
  const link = document.createElement('a');
  link.className = 'align-self-center d-none d-md-block';
  link.href = '#';
  link.title = 'Abrir Painel SEI (Ctrl+Shift+P)';
  link.tabIndex = 65;
  link.style.cursor = 'pointer';
  link.style.marginTop = '-6px';
  
  // Cria o ícone SVG (usando um ícone similar aos do SEI)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 21 21');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('class', 'infraImg');
  svg.innerHTML = '<g fill="none" fill-rule="evenodd" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 3)"><path d="m2.5.5h10c1.1045695 0 2 .8954305 2 2v10c0 1.1045695-.8954305 2-2 2h-10c-1.1045695 0-2-.8954305-2-2v-10c0-1.1045695.8954305-2 2-2z"></path><path d="m2.5 11.5v-8"></path></g>';
  
  link.appendChild(svg);
  
  // Adiciona evento de clique
  link.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Verifica se o contexto da extensão ainda é válido
    if (!chrome.runtime?.id) {
      console.warn('[Painel SEI][ContentScript] Extensão foi recarregada. Recarregue a página.');
      alert('A extensão foi atualizada. Por favor, recarregue a página.');
      return;
    }
    
    // Envia mensagem para o background abrir o painel
    console.debug('[Painel SEI][ContentScript] click -> sending panel:open');
    chrome.runtime.sendMessage({ type: 'panel:open' } as Message);
  });
  
  navItem.appendChild(link);
  
  // Insere o botão antes do último item (botão Sair)
  const lastItem = barraD.lastElementChild;
  if (lastItem) {
    console.debug('[Painel SEI][ContentScript] inserting button before last item');
    barraD.insertBefore(navItem, lastItem);
  } else {
    console.debug('[Painel SEI][ContentScript] appending button as last item');
    barraD.appendChild(navItem);
  }
  console.debug('[Painel SEI][ContentScript] button injected successfully');
}

/**
 * Detecta usuário e a área/setor atual e notifica o background 
 */
function detectAndNotifySEIContext() {
  // Importa dinamicamente para evitar problemas de ordem
  console.debug('[Painel SEI][ContentScript][detectArea] detectAndNotifyArea called');

  import('../shared/sei').then(({ extractCurrentArea, extractSeiBaseUrl, extractCurrentUser, extractCurrentProcessNumber }) => {
    const area = extractCurrentArea();
    const usuario = extractCurrentUser();
    const siteUrl = extractSeiBaseUrl(location.href);
    const processo = extractCurrentProcessNumber();

    console.debug('[Painel SEI][ContentScript] detectAndNotifySEIContext area:', area);
    console.debug('[Painel SEI][ContentScript] detectAndNotifySEIContext siteUrl:', siteUrl);
    console.debug('[Painel SEI][ContentScript] detectAndNotifySEIContext usuario:', usuario);
    console.debug('[Painel SEI][ContentScript] detectAndNotifySEIContext processo:', processo);

    if (siteUrl) {
      const msg: Message = {
        type: 'context:changed',
        siteUrl,
        area,
        usuario,
        ...(processo ? { processo } : {})
      };
      chrome.runtime.sendMessage(msg);
    }
  });
}

// Detecta em diferentes momentos do carregamento da página
console.debug('[Painel SEI][ContentScript][content] registering event listeners');
document.addEventListener('DOMContentLoaded', () => {
  console.debug('[Painel SEI][ContentScript][event] DOMContentLoaded fired');
  notifyDetection();
});
window.addEventListener('load', () => {
  console.debug('[Painel SEI][ContentScript][event] load fired');
  notifyDetection();
});
window.addEventListener('hashchange', () => {
  console.debug('[Painel SEI][ContentScript][ContentScript][event] hashchange fired');
  notifyDetection();
});

// Escuta mensagens do background para atualizar área/usuário
chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.type === 'context:request') {
    console.debug('[Painel SEI][ContentScript] recebida context:request do background, atualizando área/usuário');
    detectAndNotifySEIContext();
  }
});

// Se o documento já estiver pronto, executa imediatamente
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.debug('[Painel SEI][ContentScript][content] document already ready, calling notifyDetection immediately');
  notifyDetection();
}

/**
 * Intercepta navegações SPA (Single Page Application)
 * Alguns sites SEI podem usar navegação cliente sem recarregar a página
 */
const origPush = history.pushState;
history.pushState = function (...args) {
  const ret = origPush.apply(this, args as any);
  console.debug('[Painel SEI][ContentScript][history] pushState intercepted');
  notifyDetection();
  return ret;
};

const origReplace = history.replaceState;
history.replaceState = function (...args) {
  const ret = origReplace.apply(this, args as any);
  console.debug('[Painel SEI][ContentScript][history] replaceState intercepted');
  notifyDetection();
  return ret;
};
