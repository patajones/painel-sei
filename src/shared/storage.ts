/**
 * Módulo de Storage
 * 
 * Gerencia o armazenamento persistente de sites SEI detectados usando chrome.storage.local.
 * Mantém histórico de sites visitados com timestamps de primeira detecção e último acesso.
 */

import type { SeiSite, TabContext } from './types';
import { extractSeiBaseUrl, isSeiUrl } from './sei';

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
 * Adiciona um novo site SEI ou atualiza um existente (upsert)
 * - Se o site já existe (mesma URL), atualiza lastVisitedAt e nome (se fornecido)
 * - Se é novo, adiciona à lista com timestamps de criação
 * 
 * @param url - URL base do site SEI (ex: https://sei.exemplo.gov.br)
 * @param name - Nome do órgão/organização (opcional, extraído do logo)
 * @returns Lista atualizada de todos os sites
 */
export async function upsertSeiSite(url: string, name?: string): Promise<SeiSite[]> {
  // Se não for uma URL de site SEI, não adiciona
  const current = await getSeiSites();
  if (!isSeiUrl(url)) return current;

  // Extrai sempre a baseUrl para evitar duplicidade de subpáginas
  let baseUrl = extractSeiBaseUrl(url);
  if (!baseUrl) baseUrl = url;
  const sites = current;
  const now = new Date().toISOString();
  const existing = sites.find(s => s.url === baseUrl);

  if (existing) {
    existing.lastVisitedAt = now;
    if (name && !existing.name) existing.name = name;
  } else {
    sites.push({ url: baseUrl, name, firstDetectedAt: now, lastVisitedAt: now });
  }

  await chrome.storage.local.set({ [SITES_KEY]: sites });
  return sites;
}

/**
 * Contexto em memória por aba (tabContextMap) e utilitários de estado atual
 *
 * Mantido aqui para centralizar responsabilidades de “estado” da extensão:
 * - Persistência (chrome.storage.local) para metadados de sites SEI
 * - Contexto efêmero por aba (em memória) com site atual e área/setor atual
 *
 * Observação: O contexto por aba não é persistido. Ele é reconstruído conforme o
 * content script detecta a área e envia a mensagem `context:changed`.
 */

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
  tabContextMap.set(tabId, {
    ...ctx,
    lastUpdatedAt: new Date().toISOString(),
  });
}

/**
 * Atualiza parcialmente o contexto da aba (merge com contexto existente)
 * Útil para atualizar apenas alguns campos sem sobrescrever o resto
 */
export function updateTabContext(tabId: number, partial: Partial<TabContext>): void {
  const existing = tabContextMap.get(tabId);
  if (existing) {
    tabContextMap.set(tabId, {
      ...existing,
      ...partial,
      lastUpdatedAt: new Date().toISOString(),
    });
  }
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