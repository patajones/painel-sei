export type SeiSite = {
  url: string;
  name?: string;
  firstDetectedAt: string; // ISO timestamp
  lastVisitedAt: string; // ISO timestamp
};

export type AppState = {
  seiSites: SeiSite[];
  currentSiteUrl?: string;
};

export type Message =
  | { type: 'sei:detected'; site: { url: string; name?: string } }
  | { type: 'app:getState' }
  | { type: 'app:navigateTo'; url: string }
  | { type: 'app:state'; state: AppState };
