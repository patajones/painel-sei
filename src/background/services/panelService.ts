/**
 * Serviço do Painel Lateral (Side Panel)
 * - Orquestra abertura do painel
 * - Sincroniza estado (broadcast)
 * - Processa visitas/detecções de sites SEI
 */

import type { Message, AppState, TabContext } from '../../shared/types';
import { getSeiSites, upsertSeiSite, getCurrentTabContext } from '../../shared/storage';
import { getSettings } from '../../shared/settings';
import { isSeiUrl } from '../../shared/sei';

/**
 * Atualiza e envia o estado atual da aplicação para todos os ouvintes (principalmente o side panel)
 * Busca automaticamente o contexto da aba ativa do storage
 */
export async function updateAndSendAppState() {
  const seiSites = await getSeiSites();
  const currentTab = await getCurrentTabContext();
  
  const state: AppState = { 
    seiSites, 
    currentTab
  };
  
  console.debug('[Painel SEI][broadcast] sending app:state', state);
  chrome.runtime.sendMessage({ type: 'app:state', state } satisfies Message);
}

/**
 * Processa visita/detecção de site SEI (centralizado)
 * - Upsert no storage (normaliza base URL internamente)
 * - Abre side panel se preferido
 * - NÃO faz broadcast aqui - aguarda context:changed para fazer broadcast completo
 */
export async function processSeiSiteVisit(tabId: number, url: string, name?: string) {
  try {
    // Garante que só processamos URLs SEI
    if (!isSeiUrl(url)) return;
    await upsertSeiSite(url, name);
    // Habilita o side panel para a aba
    const sidePanel = (chrome as any).sidePanel;
    try {
      await sidePanel.setOptions({ tabId, path: 'src/sidepanel/index.html', enabled: true });
    } catch {}
    // Marca via badge que há painel disponível
    try {
      chrome.action?.setBadgeText?.({ text: 'SEI', tabId });
      chrome.action?.setBadgeBackgroundColor?.({ color: '#004C97', tabId });
    } catch {}
  } catch (e) {
    console.debug('[Painel SEI] processSeiSiteVisit skip', e);
  }
}
