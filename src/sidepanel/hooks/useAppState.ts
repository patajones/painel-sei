/**
 * Hook customizado para gerenciar estado da aplicação
 * 
 * Responsabilidades:
 * 1. Solicita estado inicial ao background quando o painel abre
 * 2. Escuta atualizações de estado vindas do background
 * 3. Remove listener quando o painel fecha (cleanup)
 * 
 * @returns Estado atual: { seiSites, currentTab }
 */

import { useEffect, useState } from 'react';
import type { AppState, Message } from '../../shared/types';

export function useAppState(): AppState {
  // Estado local React: armazena lista de sites e site atual
  const [state, setState] = useState<AppState>({ seiSites: [] });

  useEffect(() => {
    // -------------------------------------------------------------------------
    // INICIALIZAÇÃO: Solicita estado inicial ao background
    // -------------------------------------------------------------------------
    chrome.runtime.sendMessage({ type: 'app:getState' } as Message, (response) => {
      const lastErr = (chrome.runtime as any)?.lastError;
      if (lastErr) {
        // Em alguns casos o SW pode estar hibernado; tenta novamente rapidamente
        console.debug('[Painel SEI][useAppState] app:getState retry due to lastError', lastErr?.message);
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'app:getState' } as Message, (retryRes) => {
            console.debug('[Painel SEI][useAppState] app:getState retry response', retryRes);
            if (retryRes) {
              setState(cur => ({
                ...cur,
                seiSites: retryRes.seiSites ?? cur.seiSites,
                currentTab: retryRes.currentTab ?? cur.currentTab,
              }));
            }
          });
        }, 300);
        return;
      }
      console.debug('[Painel SEI][useAppState] app:getState initial response', response);
      if (response) {
        setState(currentState => ({ 
          ...currentState,
          seiSites: response.seiSites ?? currentState.seiSites,
          currentTab: response.currentTab ?? currentState.currentTab,
        }));
      }
    });
    
    // -------------------------------------------------------------------------
    // LISTENER: Escuta atualizações contínuas do background
    // -------------------------------------------------------------------------
    const messageHandler = (message: Message) => {
      console.debug('[Painel SEI][useAppState] message received', message);
      if (message.type === 'app:state') {
        console.debug('[Painel SEI][useAppState] updating state', message.state);
        // Substitui todo o estado com o novo recebido
        setState(message.state);
      }
    };
    
    // Registra o listener
    chrome.runtime.onMessage.addListener(messageHandler);
    
    // CLEANUP: Remove listener quando componente desmontar (painel fechar)
    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    };
  }, []); // Array vazio = executa apenas uma vez na montagem

  return state;
}
