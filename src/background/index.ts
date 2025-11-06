import type { Message, AppState } from '../shared/types';
import { getSeiSites, upsertSeiSite } from '../shared/storage';

// Broadcast state to all listeners (side panel)
async function broadcastState(currentSiteUrl?: string) {
  const seiSites = await getSeiSites();
  const state: AppState = { seiSites, currentSiteUrl };
  chrome.runtime.sendMessage({ type: 'app:state', state } satisfies Message);
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case 'sei:detected': {
        await upsertSeiSite(msg.site.url, msg.site.name);
        await broadcastState(msg.site.url);
        break;
      }
      case 'app:getState': {
        const seiSites = await getSeiSites();
        sendResponse({ seiSites });
        break;
      }
      case 'app:navigateTo': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          await chrome.tabs.update(tab.id, { url: msg.url });
        }
        break;
      }
    }
  })();
  // Indicate async response if we used sendResponse
  return true;
});

chrome.tabs.onActivated.addListener(async activeInfo => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  const url = tab.url;
  if (url) {
    const sites = await getSeiSites();
    const current = sites.find(s => url.startsWith(s.url));
    await broadcastState(current?.url);
  }
});
