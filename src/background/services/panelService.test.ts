import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as storage from '../../shared/storage';
import * as panelService from './panelService';

// Mock chrome APIs
const sendMessage = vi.fn();
(globalThis as any).chrome = {
  runtime: { sendMessage },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  sidePanel: {
    setOptions: vi.fn().mockResolvedValue(undefined),
  },
};

describe('panelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateAndSendAppState', () => {
    it('deve buscar estado e enviar app:state', async () => {
      const fakeSites = [{ url: 'https://sei.example.com', firstDetectedAt: 'x', lastVisitedAt: 'y' }];
      const fakeTab = { siteUrl: 'https://sei.example.com', area: 'SESINF', usuario: 'João', lastUpdatedAt: 'z' };

      vi.spyOn(storage, 'getSeiSites').mockResolvedValue(fakeSites as any);
      vi.spyOn(storage, 'getCurrentTabContext').mockResolvedValue(fakeTab as any);

      await panelService.updateAndSendAppState();

      expect(sendMessage).toHaveBeenCalledTimes(1);
      const payload = sendMessage.mock.calls[0][0];
      expect(payload.type).toBe('app:state');
      expect(payload.state).toEqual({ seiSites: fakeSites, currentTab: fakeTab });
    });
  });

  describe('processSeiSiteVisit', () => {
    it('deve chamar upsertSeiSite e configurar side panel e badge para URL SEI', async () => {
      const upsertSpy = vi.spyOn(storage, 'upsertSeiSite').mockResolvedValue([]);

      const tabId = 123;
      const url = 'https://sei.example.com/sei/controlador.php';
      await panelService.processSeiSiteVisit(tabId, url, 'Nome do Órgão');

      expect(upsertSpy).toHaveBeenCalledWith(url, 'Nome do Órgão');
      expect(chrome.sidePanel.setOptions).toHaveBeenCalledWith({ tabId, path: 'src/sidepanel/index.html', enabled: true });
      expect(chrome.action.setBadgeText).toHaveBeenCalled();
      expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalled();
    });

    it('deve ignorar URLs que não são SEI', async () => {
      const upsertSpy = vi.spyOn(storage, 'upsertSeiSite').mockResolvedValue([]);

      await panelService.processSeiSiteVisit(1, 'https://www.google.com');

      expect(upsertSpy).not.toHaveBeenCalled();
      expect(chrome.sidePanel.setOptions).not.toHaveBeenCalled();
    });
  });
});
