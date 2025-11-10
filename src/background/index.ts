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
import { getSeiSites } from '../shared/storage';
import { isSeiUrl } from '../shared/sei';
import { processSeiSiteVisit, broadcastAppState } from './services/panelService';

/**
 * Listener principal de mensagens da extensão
 * Delega processamento para handlers específicos conforme o tipo de mensagem
 */
chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {  
  (async () => {
    console.debug('[Painel SEI] onMessage received', msg);
    switch (msg.type) {
      case 'sei:detected':
        await handleSeiDetected(msg, sender);
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
    console.debug('[Painel SEI] setPanelBehavior failed', e);
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
    console.debug('[Painel SEI] setPanelBehavior failed', e);
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
  console.debug('[Painel SEI] handleTabChangeOrNavigation', { tabId, url, isSei });
  
  // Se for site SEI, processa normalmente
  if (isSei) {
    await processSeiSiteVisit(tabId, url);
  } else {
    // Se não for SEI, apenas faz broadcast do estado com a URL atual
    await broadcastAppState(url);
  }
}

/**
 * Processa a detecção de um site SEI:
 * - Salva o site no storage
 * - Notifica UI sobre atualização
 * - Abre side panel automaticamente se configurado
 */
async function handleSeiDetected(msg: Extract<Message, { type: 'sei:detected' }>, sender: chrome.runtime.MessageSender) {
  console.debug('[Painel SEI] sei:detected', { url: msg.site.url, name: msg.site.name });
  const tabId = sender?.tab?.id;
  if (!tabId) return;
  await processSeiSiteVisit(tabId, msg.site.url, msg.site.name);
}


/**
 * Retorna o estado atual da aplicação para quem solicitou (geralmente o side panel ao abrir)
 */
async function handleGetState(sendResponse: (response: any) => void) {
  const seiSites = await getSeiSites();
  sendResponse({ seiSites });
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
    const tab = await chrome.tabs.get(tabId);
    if (tab.url && isSeiUrl(tab.url)) {
      await broadcastAppState(tab.url);
      setTimeout(() => broadcastAppState(tab.url), 250);
    }
    console.debug('[Painel SEI] sidePanel opened via SEI bar button');
  } catch (e) {
    console.debug('[Painel SEI] handlePanelOpen failed', e);
  }
}



