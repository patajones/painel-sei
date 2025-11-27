/**
 * Background Script (Service Worker)
 * 
 * Orquestra a lógica principal da extensão:
 * - Recebe notificações de detecção de sites SEI do content script
 * - Gerencia o armazenamento de sites detectados
 * - Controla abertura automática do side panel
 * - Sincroniza estado entre componentes da extensão
 */

import type { Message } from '../shared/types';
import { getCurrentSeiSiteContextData, getSeiSites } from '../shared/storage';
import { isSeiUrl, extractSeiBaseUrl } from '../shared/sei';
import { processSeiSiteVisit, updateAndSendAppState } from './services/panelService';
import { getCurrentTabContext, deleteTabContext, setTabContext, getTabContext, getLastSeiTabId } from '../shared/storage';

/**
 * Listener principal de mensagens da extensão
 * Delega processamento para handlers específicos conforme o tipo de mensagem
 */
chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {  
  (async () => {
    console.debug('[Painel SEI][Background] onMessage received', msg);
    switch (msg.type) {
      case 'context:changed':
        await handleContextChanged(msg, sender);
        break;
      case 'app:getState':
        await handleGetState(sendResponse);
        break;
      case 'app:navigateTo':
        await handleNavigateTo(msg);
        break;
      case 'panel:open':
        await handlePanelOpen(sender);
        break;
      case 'app:activateLastSeiTab':
        await handleActivateLastSeiTab();
        break;
    }
  /**
   * Handler para ativar a última aba SEI
   */
  async function handleActivateLastSeiTab() {
    try {      
      const lastTabId = getLastSeiTabId();
      console.debug('[Painel SEI][Background] ativar o tab SEI', lastTabId);
      if (typeof lastTabId === 'number') {
        await chrome.tabs.update(lastTabId, { active: true });
        console.debug('[Painel SEI][Background] ativou aba SEI', lastTabId);
      }
    } catch (e) {
      console.error('[Painel SEI][Background] erro ao ativar aba SEI', e);
    }
  }
  })();
  return true; // Indica que a resposta será enviada de forma assíncrona
});


/**
 * Listener de instalação da extensão
 * Executa na primeira instalação ou atualização
 */
chrome.runtime.onInstalled.addListener(async () => {
  // Habilita o painel globalmente
  try {
    const sidePanel = (chrome as any).sidePanel;
    // Habilita o painel para todas as janelas
    await sidePanel.setOptions({
      path: 'src/sidepanel/index.html',
      enabled: true
    });
    // Configura para abrir ao clicar no ícone
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (e) {
    console.error('[Painel SEI][Background] setPanelBehavior failed', e);
  }
});

/**
 * Listener de inicialização do navegador
 * Recria o menu quando o Chrome reinicia
 */
chrome.runtime.onStartup?.addListener?.(async () => {
  // Habilita o painel globalmente
  try {
    const sidePanel = (chrome as any).sidePanel;
    // Habilita o painel para todas as janelas
    await sidePanel.setOptions({
      path: 'src/sidepanel/index.html',
      enabled: true
    });
    // Configura para abrir ao clicar no ícone
    sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (e) {
    console.error('[Painel SEI][Background] setPanelBehavior failed', e);
  }
});

/**
 * Listener de troca de aba ativa
 * Atualiza o estado e ícone quando usuário troca de aba
 */
chrome.tabs.onActivated.addListener(async activeInfo => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await handleTabChangeOrNavigation(activeInfo.tabId, tab.url);
});


/**
 * Listener de atualização de abas (navegação, mudança de URL, carregamento)
 * Serve como backup para detecção de sites SEI quando o content script não dispara
 * Também tenta abrir o side panel automaticamente se configurado
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Aguarda mudança de URL ou conclusão do carregamento
  const maybeUrl = changeInfo.url ?? tab.url;
  const isComplete = changeInfo.status === 'complete';
  if (!maybeUrl && !isComplete) return;
  await handleTabChangeOrNavigation(tabId, maybeUrl ?? tab.url);
});


/**
 * Centraliza a verificação e ações quando há mudança de aba ou navegação
 * - Verifica se é site SEI
 * - Adiciona à lista de sites SEI
 * - Abre painel lateral se configurado
 * - Atualiza estado do painel (sempre, mesmo que não seja SEI)
 */
async function handleTabChangeOrNavigation(tabId: number, url?: string) {
  if (!url) return;
  const isSei = isSeiUrl(url);
  console.debug('[Painel SEI][Background][handleTabChangeOrNavigation] called', { tabId, url, isSei });
  
  // Se for site SEI, processa normalmente
  if (isSei) {
    console.debug('[Painel SEI][Background][handleTabChangeOrNavigation] processing SEI site', { tabId, url, isSei });    
    await processSeiSiteVisit(tabId, url);
    // Define contexto provisório para a aba (sem área/usuario ainda) para permitir que o painel
    // já reflita a troca de aba imediatamente enquanto o content script detecta detalhes.
    const baseUrl = extractSeiBaseUrl(url) || url;
    const existing = getTabContext(tabId);
    if (!existing || existing.siteUrl !== baseUrl) {
      console.debug('[Painel SEI][Background][handleTabChangeOrNavigation] set provisional tab context', { tabId, context: { siteUrl: baseUrl, area: existing?.area ?? null, usuario: existing?.usuario ?? null } });
      setTabContext(tabId, {
        siteUrl: baseUrl,
        area: existing?.area ?? null,
        usuario: existing?.usuario ?? null,
        processo: existing?.processo ?? null,
      });
    }
    await updateAndSendAppState();
    // Solicita ao content script que atualize área/usuário
    try {
      chrome.tabs.sendMessage(tabId, { type: 'context:request' });
      console.debug('[Painel SEI][Background] context:request enviado para tabId', tabId);
    } catch (e) {
      console.debug('[Painel SEI][Background] erro ao enviar context:request', e);
    }
  } else {
    console.debug('[Painel SEI][Background][handleTabChangeOrNavigation] processing non-SEI site', { tabId, url, isSei });
    // Se não for SEI, limpa o contexto da aba
    deleteTabContext(tabId);
    // Apenas faz broadcast do estado com a URL atual (sem área)
    await updateAndSendAppState();
  }
}

/**
 * Processa mudança de contexto da página (área, usuário, etc.):
 * - Armazena em memória no Map por aba
 * - Faz broadcast do estado atualizado
 */
async function handleContextChanged(msg: Extract<Message, { type: 'context:changed' }>, sender: chrome.runtime.MessageSender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return;
  
  console.debug('[Painel SEI][Background] context:changed', { 
    tabId, 
    siteUrl: msg.siteUrl, 
    area: msg.area,
    usuario: msg.usuario
  });
  
  // Armazena o contexto da aba em memória, incluindo processo se presente
  setTabContext(tabId, {
    siteUrl: msg.siteUrl,
    area: msg.area,
    usuario: msg.usuario,
    processo: msg.processo ?? null,
  });
  
  // Faz broadcast do estado atualizado
  await updateAndSendAppState();
}


/**
 * Retorna o estado atual da aplicação para quem solicitou (geralmente o side panel ao abrir)
 */
async function handleGetState(sendResponse: (response: any) => void) {
  const seiSites = await getSeiSites();
  try {
    const currentTab = await getCurrentTabContext();
    const currentSeiSiteContextData = await getCurrentSeiSiteContextData();
    sendResponse({ 
      seiSites, 
      currentTab,
      currentSeiSiteContextData,
    });
  } catch (e) {
    console.error('[Painel SEI][Background] handleGetState failed', e);
    sendResponse({ seiSites });
  }
}

/**
 * Navega a aba ativa para a URL especificada
 */
async function handleNavigateTo(msg: Extract<Message, { type: 'app:navigateTo' }>) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id) {
    await chrome.tabs.update(tab.id, { url: msg.url });
  }
}

/**
 * Abre o painel lateral quando solicitado pelo botão injetado na barra do SEI
 */
async function handlePanelOpen(sender: chrome.runtime.MessageSender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return;
  
  try {
    const sidePanel = (chrome as any).sidePanel;
    await sidePanel.open({ tabId });
    
    // Broadcast do estado após abrir
    await updateAndSendAppState();
    setTimeout(() => updateAndSendAppState(), 250);
    
    console.debug('[Painel SEI][Background] sidePanel opened via SEI bar button');
  } catch (e) {
    console.error('[Painel SEI][Background] handlePanelOpen failed', e);
  }
}



