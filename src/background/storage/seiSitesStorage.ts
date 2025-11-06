/**
 * Gerencia o armazenamento e recuperação de sites SEI detectados no chrome.storage.local
 */

export interface SeiSite {
  url: string;
  name?: string;
  firstDetectedAt: string;
  lastVisitedAt: string;
}

const STORAGE_KEY = 'seiSites';

/**
 * Recupera a lista de sites SEI armazenados
 */
export async function getSeiSites(): Promise<SeiSite[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

/**
 * Adiciona ou atualiza um site SEI na lista
 * Se o site já existe (mesmo url), atualiza apenas lastVisitedAt e name (se fornecido)
 */
export async function addOrUpdateSeiSite(url: string, name?: string): Promise<SeiSite[]> {
  const sites = await getSeiSites();
  const existingIndex = sites.findIndex(site => site.url === url);
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    // Atualiza site existente
    sites[existingIndex].lastVisitedAt = now;
    if (name) {
      sites[existingIndex].name = name;
    }
  } else {
    // Adiciona novo site
    const newSite: SeiSite = {
      url,
      name,
      firstDetectedAt: now,
      lastVisitedAt: now,
    };
    sites.push(newSite);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
  return sites;
}

/**
 * Remove um site SEI da lista
 */
export async function removeSeiSite(url: string): Promise<SeiSite[]> {
  const sites = await getSeiSites();
  const filteredSites = sites.filter(site => site.url !== url);
  await chrome.storage.local.set({ [STORAGE_KEY]: filteredSites });
  return filteredSites;
}

/**
 * Limpa todos os sites SEI armazenados
 */
export async function clearSeiSites(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
