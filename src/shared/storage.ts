/**
 * Módulo de Storage
 * 
 * Gerencia o armazenamento persistente de sites SEI detectados usando chrome.storage.local.
 * Mantém histórico de sites visitados com timestamps de primeira detecção e último acesso.
 */

import type { SeiSite } from './types';
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