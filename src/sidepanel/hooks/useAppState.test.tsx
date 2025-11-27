import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from './useAppState';

// Mock chrome.runtime API
const sendMessage = vi.fn();
const addListener = vi.fn();
const removeListener = vi.fn();

(globalThis as any).chrome = (globalThis as any).chrome || {};
(globalThis as any).chrome.runtime = {
  sendMessage: (msg: any, cb?: any) => sendMessage(msg, cb),
  onMessage: { addListener, removeListener },
  lastError: undefined,
} as any;

function emitMessage(message: any) {
  // Simula o listener registrado
  const handler = addListener.mock.calls[0]?.[0];
  if (handler) handler(message);
}

describe('useAppState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('solicita estado inicial e aplica resposta', async () => {
    // Configura sendMessage para responder ao app:getState
    sendMessage.mockImplementationOnce((_msg: any, cb: any) => {
      cb?.({ seiSites: [{ url: 'https://sei.example.com' }], currentTab: { siteUrl: 'https://sei.example.com' } });
    });

    const { result } = renderHook(() => useAppState());

    // Estado inicial aplicado
    expect(result.current.seiSites[0].url).toBe('https://sei.example.com');
    expect(result.current.currentTab?.siteUrl).toBe('https://sei.example.com');
    // Listener registrado
    expect(addListener).toHaveBeenCalledTimes(1);
  });

  it('atualiza estado ao receber app:state', async () => {
    // Resposta inicial vazia
    sendMessage.mockImplementationOnce((_msg: any, cb: any) => {
      cb?.({ seiSites: [], currentTab: undefined });
    });

    const { result } = renderHook(() => useAppState());

    // Emite app:state
    act(() => {
      emitMessage({ type: 'app:state', state: { seiSites: [{ url: 'https://sei.cjf.jus.br' }], currentTab: { siteUrl: 'https://sei.cjf.jus.br', area: 'SESINF' } } });
    });

    expect(result.current.seiSites[0].url).toBe('https://sei.cjf.jus.br');
    expect(result.current.currentTab?.area).toBe('SESINF');
  });
});
