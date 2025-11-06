import type { Message } from '../shared/types';

function isSeiSite(): { matched: boolean; url?: string; name?: string } {
  const url = location.origin + location.pathname;
  const title = document.title || '';
  const hasSeiInUrl = /\bsei\b/i.test(location.pathname) || /\/sei\//i.test(location.href);
  const hasSeiInTitle = /(\bSEI\b|Sistema Eletrônico de Informações)/i.test(title);
  const knownSelectors = ['#main_menu', '#infraBarraSuperior', '#divInfraAreaTela', 'frameset[name="main"]'];
  const hasKnownDom = knownSelectors.some(sel => !!document.querySelector(sel));
  const matched = hasSeiInUrl || hasSeiInTitle || hasKnownDom;
  let name: string | undefined;
  const orgEl = document.querySelector('#infraBarraSuperiorLogo a[title]') as HTMLAnchorElement | null;
  if (orgEl && orgEl.title) name = orgEl.title;
  return { matched, url, name };
}

function notifyDetection() {
  const det = isSeiSite();
  if (!det.matched || !det.url) return;
  const msg: Message = { type: 'sei:detected', site: { url: det.url, name: det.name } };
  chrome.runtime.sendMessage(msg);
}

document.addEventListener('DOMContentLoaded', notifyDetection);
window.addEventListener('load', notifyDetection);
window.addEventListener('hashchange', notifyDetection);

// observe SPA navigations
const origPush = history.pushState;
history.pushState = function (...args) {
  const ret = origPush.apply(this, args as any);
  notifyDetection();
  return ret;
};
const origReplace = history.replaceState;
history.replaceState = function (...args) {
  const ret = origReplace.apply(this, args as any);
  notifyDetection();
  return ret;
};
