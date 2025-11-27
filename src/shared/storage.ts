/**
 * Módulo de Storage
 * 
 * Gerencia o armazenamento persistente de sites SEI detectados usando chrome.storage.local.
 * Mantém histórico de sites visitados com timestamps de primeira detecção e último acesso.
 */

import type { SeiSite, TabContext } from './types';
import { extractSeiBaseUrl, isRecognizedSeiUrl, isSeiUrl } from './sei';

// Chave usada no chrome.storage.local para armazenar a lista de sites
const SITES_KEY = 'seiSites';

/**
 * Recupera todos os sites SEI armazenados
 * @returns Array de sites SEI detectados (vazio se nenhum site foi salvo)
 */
export async function getSeiSites(): Promise<SeiSite[]> {
  const data = await chrome.storage.local.get(SITES_KEY);
  return (data[SITES_KEY] as SeiSite[] | undefined) ?? [];
}

/**
 * Recupera os dados do site SEI armazenado
 * @param seiUrl URL do site SEI
 * @returns O site SEI correspondente ou undefined se não encontrado
 */
export async function findSeiSiteData(seiUrl: string): Promise<SeiSite | undefined> {
  const baseUrl = extractSeiBaseUrl(seiUrl) || seiUrl;
  const sites = await getSeiSites();
  return sites.find(s => s.url === baseUrl);
}

/**
 * Adiciona um novo site SEI ou atualiza um existente (upsert)
 * - Se o site já existe (mesma URL), atualiza lastVisitedAt e nome (se fornecido)
 * - Se é novo, adiciona à lista com timestamps de criação
 * 
 * @param siteUrl - URL base do site SEI (ex: https://sei.exemplo.gov.br)
 * @param name - Nome do órgão/organização (opcional, extraído do logo)
 * @returns Lista atualizada de todos os sites
 */
export async function upsertSeiSite(siteUrl: string): Promise<SeiSite[]> {
  let baseUrl = extractSeiBaseUrl(siteUrl) || siteUrl;
  console.debug('[Painel SEI][Storage] upsertSeiSite', baseUrl);

  const sites = await getSeiSites();
  const now = new Date().toISOString();
  const existing = sites.find(s => s.url === baseUrl);

  if (existing) {
    console.debug('[Painel SEI][Storage] upsertSeiSite, updating lastContextData', baseUrl);
    existing.lastVisitedAt = now;
    // Garante que lastContextData exista
    if (!existing.lastContextData) existing.lastContextData = {} as TabContext;
  } else {
    console.debug('[Painel SEI][Storage] upsertSeiSite, adding new site', baseUrl);
    sites.push({
      url: baseUrl,
      firstDetectedAt: now,
      lastVisitedAt: now,
      lastContextData: {} as TabContext
    });
  }

  // Garante que todos os sites tenham lastContextData
  for (const site of sites) {
    if (!site.lastContextData) site.lastContextData = {} as TabContext;
  }

  await chrome.storage.local.set({ [SITES_KEY]: sites });
  return sites;
}


export async function updateSeiSiteContext(siteUrl: string, ctx: TabContext): Promise<void> {
  let baseUrl = extractSeiBaseUrl(siteUrl) || siteUrl;
  console.debug('[Painel SEI][Storage] updateSeiSiteContext', baseUrl, ctx);

  getSeiSites().then(sites => {
    const site = sites.find(s => s.url === baseUrl);
    if (!site) return;
    if (!site.lastContextData) site.lastContextData = {} as TabContext;

    // Atualiza campos: aceita null só se o tipo permitir
    for (const key of Object.keys(ctx) as (keyof TabContext)[]) {
      const value = ctx[key];
      if (value === undefined) continue;

      // Se value é null, só setar se o tipo aceitar null
      if (value === null) {
        // Lista de campos que aceitam null em TabContext
        if (key === 'area' || key === 'usuario' || key === 'processo') {
          console.debug(`[Painel SEI][Storage] updateSeiSiteContext set ${key} with null`);
          site.lastContextData[key] = null;
        }
        // Se não aceita null, não faz nada
        continue;
      }
      console.debug(`[Painel SEI][Storage] updateSeiSiteContext set ${key} with value ${value}`);
      // Para qualquer outro valor, setar normalmente
      site.lastContextData[key] = value;
    }

    // Persiste alteração
    console.debug('[Painel SEI][Storage] persisting sites', baseUrl, ctx);
    chrome.storage.local.set({ [SITES_KEY]: sites });
  });
}

/**
 * Map em memória que armazena o contexto de cada aba do navegador.
 *
 * Estrutura:
 * - Chave: tabId (número) — ID único da aba fornecido pelo Chrome
 * - Valor: TabContext — contexto completo da aba (site, área, usuário, etc.)
 *
 * Ciclo de vida:
 * - Escrita: quando o content script detecta uma área e envia `context:changed`
 * - Leitura: ao trocar de aba, navegar, ou quando o side panel solicita estado
 * - Remoção: quando o usuário sai de um site SEI ou fecha a aba
 */
// Mapa privado; utilize os helpers abaixo para manipular
const tabContextMap = new Map<number, TabContext>();

/**
 * Lê o contexto da aba informada (se existir)
 */
export function getTabContext(tabId: number): TabContext | undefined {
  return tabContextMap.get(tabId);
}

/**
 * Define ou atualiza o contexto da aba informada
 * Adiciona automaticamente timestamp de atualização
 */
export function setTabContext(tabId: number, ctx: TabContext): void {
  console.debug('[Painel SEI][Storage] setTabContext ', tabId, ctx);
  tabContextMap.set(tabId, {
    ...ctx,
    lastUpdatedAt: new Date().toISOString(),
  });
  updateSeiSiteContext(ctx.siteUrl, ctx);
}

/**
 * Remove o contexto associado à aba informada
 */
export function deleteTabContext(tabId: number): void {
  tabContextMap.delete(tabId);
}

/**
 * Retorna a aba ativa da janela atual (se houver)
 */
async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  // Usa lastFocusedWindow para evitar pegar o painel lateral como "janela atual"
  // quando o foco está no Side Panel. Assim garantimos o tab da janela do navegador.
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return activeTab;
}

/**
 * Retorna o contexto completo da aba ativa
 * - undefined: não há aba ativa
 * - TabContext: contexto da aba ativa (pode ter campos null se ainda não detectados)
 */
export async function getCurrentTabContext(): Promise<TabContext | undefined> {
  const activeTab = await getActiveTab();
  if (!activeTab?.id) return undefined;
  return getTabContext(activeTab.id);
}

export async function getCurrentSeiSiteContextData(): Promise<TabContext | undefined> {  
  const activeTab = await getActiveTab();
  console.debug('[Painel SEI][Storage] getCurrentSeiSiteContextData called', { activeTab });
  if (!activeTab?.id) return undefined;
  const tabContext = getTabContext(activeTab.id);

  console.debug('[Painel SEI][Storage] getCurrentSeiSiteContextData tabContext found', { activeTab, tabContext });

  if (!tabContext?.siteUrl) return undefined;

  if (isRecognizedSeiUrl(tabContext.siteUrl, await getSeiSites())) {
    const siteData = await findSeiSiteData(tabContext.siteUrl);
    console.debug('[Painel SEI][Storage] getCurrentSeiSiteContextData siteData found', { activeTab, tabContext, siteData });
    if (siteData?.lastContextData) {
      return siteData.lastContextData;
    }
  }
  return undefined;
}

// Variável em memória para o último tabId SEI
let lastSeiTabId: number | undefined = undefined;

/**
 * Salva o último tabId SEI detectado em memória
 */
export function setLastSeiTabId(tabId: number) {
  lastSeiTabId = tabId;
}

/**
 * Recupera o último tabId SEI detectado da memória
 */
export function getLastSeiTabId(): number | undefined {
  return lastSeiTabId;
}

