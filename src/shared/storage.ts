import type { SeiSite } from './types';

const SITES_KEY = 'seiSites';

export async function getSeiSites(): Promise<SeiSite[]> {
  const data = await chrome.storage.local.get(SITES_KEY);
  return (data[SITES_KEY] as SeiSite[] | undefined) ?? [];
}

export async function upsertSeiSite(url: string, name?: string): Promise<SeiSite[]> {
  const sites = await getSeiSites();
  const now = new Date().toISOString();
  const existing = sites.find(s => s.url === url);
  if (existing) {
    existing.lastVisitedAt = now;
    if (name && !existing.name) existing.name = name;
  } else {
    sites.push({ url, name, firstDetectedAt: now, lastVisitedAt: now });
  }
  await chrome.storage.local.set({ [SITES_KEY]: sites });
  return sites;
}
