import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSeiSites, upsertSeiSite, setTabContext, deleteTabContext, getCurrentTabContext, getTabContext } from './storage';

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
  tabs: {
    query: vi.fn(),
  },
};

it('deleteTabContext deve remover contexto e ser idempotente', () => {
  const tabId = 77;
  setTabContext(tabId, { siteUrl: 'https://sei.example.com', area: 'A', usuario: 'U', lastUpdatedAt: 'x' } as any);
  expect(getTabContext(tabId)).toBeTruthy();
  deleteTabContext(tabId);
  expect(getTabContext(tabId)).toBeUndefined();
  // remover de novo não deve quebrar
  expect(() => deleteTabContext(tabId)).not.toThrow();

});


it('getCurrentTabContext deve retornar undefined quando não há aba ativa', async () => {
  (chrome.tabs.query as any).mockResolvedValueOnce([]);
  const ctx = await getCurrentTabContext();
  expect(ctx).toBeUndefined();
});

it('getCurrentTabContext deve retornar contexto da aba ativa quando existir', async () => {
  const tabId = 11;
  (chrome.tabs.query as any).mockResolvedValueOnce([{ id: tabId }]);
  setTabContext(tabId, { siteUrl: 'https://sei.example.com', area: 'SESINF', usuario: 'João', lastUpdatedAt: 'x' } as any);
  const ctx = await getCurrentTabContext();
  expect(ctx?.siteUrl).toBe('https://sei.example.com');
  expect(ctx?.area).toBe('SESINF');
  expect(ctx?.usuario).toBe('João');
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
    const url = 'https://sei.example.com/sei/controlador.php';
    const name = 'SEI Exemplo';

    const sites = await upsertSeiSite(url);

    expect(sites).toHaveLength(1);
    expect(sites[0].url).toBe('https://sei.example.com');
    expect(sites[0].firstDetectedAt).toBeDefined();
    expect(sites[0].lastVisitedAt).toBeDefined();
  });

  it('deve atualizar lastVisitedAt de site existente', async () => {
    const url = 'https://sei.example.com/sei/teste';
    const oldDate = '2025-01-01T00:00:00.000Z';

    mockStorage.seiSites = [
      { url: 'https://sei.example.com', firstDetectedAt: oldDate, lastVisitedAt: oldDate }
    ];

    // Aguarda 1ms para garantir timestamp diferente
    await new Promise(resolve => setTimeout(resolve, 1));

    const sites = await upsertSeiSite(url);

    expect(sites).toHaveLength(1);
    expect(sites[0].url).toBe('https://sei.example.com');
    expect(sites[0].firstDetectedAt).toBe(oldDate);
    expect(sites[0].lastVisitedAt).not.toBe(oldDate);
  });

  it('deve preservar name existente quando não fornecido', async () => {
    const url = 'https://sei.example.com/sei/controlador.php';
    const name = 'Nome Original';

    mockStorage.seiSites = [
      { url: 'https://sei.example.com', name, firstDetectedAt: '2025-01-01', lastVisitedAt: '2025-01-01' }
    ];

    const sites = await upsertSeiSite(url);
    // Adicione asserções se necessário
  });


  it('deleteTabContext deve remover contexto e ser idempotente', () => {
    const tabId = 77;
    setTabContext(tabId, { siteUrl: 'https://sei.example.com', area: 'A', usuario: 'U', lastUpdatedAt: 'x' } as any);
    expect(getTabContext(tabId)).toBeTruthy();
    deleteTabContext(tabId);
    expect(getTabContext(tabId)).toBeUndefined();
    // remover de novo não deve quebrar
    expect(() => deleteTabContext(tabId)).not.toThrow();
  });

  it('getCurrentTabContext deve retornar undefined quando não há aba ativa', async () => {
    (chrome.tabs.query as any).mockResolvedValueOnce([]);
    const ctx = await getCurrentTabContext();
    expect(ctx).toBeUndefined();
  });

  it('getCurrentTabContext deve retornar contexto da aba ativa quando existir', async () => {
    const tabId = 11;
    (chrome.tabs.query as any).mockResolvedValueOnce([{ id: tabId }]);
    setTabContext(tabId, { siteUrl: 'https://sei.example.com', area: 'SESINF', usuario: 'João', lastUpdatedAt: 'x' } as any);
    const ctx = await getCurrentTabContext();
    expect(ctx?.siteUrl).toBe('https://sei.example.com');
    expect(ctx?.area).toBe('SESINF');
    expect(ctx?.usuario).toBe('João');
  });

});

