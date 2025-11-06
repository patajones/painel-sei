import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSeiSites, upsertSeiSite } from './storage';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

(globalThis as any).chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        return Promise.resolve(mockStorage);
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
      remove: vi.fn((keys) => {
        if (typeof keys === 'string') {
          delete mockStorage[keys];
        } else if (Array.isArray(keys)) {
          keys.forEach(k => delete mockStorage[k]);
        }
        return Promise.resolve();
      }),
    },
  },
};

describe('Storage Utils', () => {
  beforeEach(() => {
    // Limpar storage entre testes
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  describe('getSeiSites', () => {
    it('deve retornar array vazio quando não há sites', async () => {
      const sites = await getSeiSites();
      expect(sites).toEqual([]);
    });

    it('deve retornar sites armazenados', async () => {
      const testSites = [
        { url: 'https://sei.example.com', firstDetectedAt: '2025-01-01', lastVisitedAt: '2025-01-01' }
      ];
      mockStorage.seiSites = testSites;

      const sites = await getSeiSites();
      expect(sites).toEqual(testSites);
    });
  });

  describe('upsertSeiSite', () => {
    it('deve adicionar novo site quando não existe', async () => {
      const url = 'https://sei.example.com';
      const name = 'SEI Exemplo';

      const sites = await upsertSeiSite(url, name);

      expect(sites).toHaveLength(1);
      expect(sites[0].url).toBe(url);
      expect(sites[0].name).toBe(name);
      expect(sites[0].firstDetectedAt).toBeDefined();
      expect(sites[0].lastVisitedAt).toBeDefined();
    });

    it('deve atualizar lastVisitedAt de site existente', async () => {
      const url = 'https://sei.example.com';
      const oldDate = '2025-01-01T00:00:00.000Z';
      
      mockStorage.seiSites = [
        { url, firstDetectedAt: oldDate, lastVisitedAt: oldDate }
      ];

      const sites = await upsertSeiSite(url);

      expect(sites).toHaveLength(1);
      expect(sites[0].url).toBe(url);
      expect(sites[0].firstDetectedAt).toBe(oldDate);
      expect(sites[0].lastVisitedAt).not.toBe(oldDate);
    });

    it('deve preservar name existente quando não fornecido', async () => {
      const url = 'https://sei.example.com';
      const name = 'Nome Original';
      
      mockStorage.seiSites = [
        { url, name, firstDetectedAt: '2025-01-01', lastVisitedAt: '2025-01-01' }
      ];

      const sites = await upsertSeiSite(url);

      expect(sites[0].name).toBe(name);
    });

    it('deve atualizar name quando fornecido novo', async () => {
      const url = 'https://sei.example.com';
      
      mockStorage.seiSites = [
        { url, firstDetectedAt: '2025-01-01', lastVisitedAt: '2025-01-01' }
      ];

      const newName = 'Novo Nome';
      const sites = await upsertSeiSite(url, newName);

      expect(sites[0].name).toBe(newName);
    });
  });
});
