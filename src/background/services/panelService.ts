/**
 * Serviço do Painel Lateral (Side Panel)
 * - Orquestra abertura do painel
 * - Sincroniza estado (broadcast)
 * - Processa visitas/detecções de sites SEI
 */

import type { Message, AppState } from '../../shared/types';
import { getSeiSites, upsertSeiSite } from '../../shared/storage';
import { getSettings } from '../../shared/settings';
import { isSeiUrl } from '../../shared/sei';

/**
 * Envia o estado atual da aplicação para todos os ouvintes (principalmente o side panel)
 * @param currentSiteUrl - URL do site atualmente ativo (opcional)
 * @param currentArea - Área/setor atual (opcional)
 */
export async function broadcastAppState(currentSiteUrl?: string, currentArea?: string | null) {
  const seiSites = await getSeiSites();
  const state: AppState = { seiSites, currentSiteUrl, currentArea };
  chrome.runtime.sendMessage({ type: 'app:state', state } satisfies Message);
}

/**
 * Processa visita/detecção de site SEI (centralizado)
 * - Upsert no storage (normaliza base URL internamente)
 * - Abre side panel se preferido
 * - Broadcast do estado (com reforço após delay para garantir montagem)
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
    await broadcastAppState(url);
  } catch (e) {
    console.debug('[Painel SEI] processSeiSiteVisit skip', e);
  }
}
