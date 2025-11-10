/**
 * Hook customizado para gerenciar estado da aplicação
 * 
 * Responsabilidades:
 * 1. Solicita estado inicial ao background quando o painel abre
 * 2. Escuta atualizações de estado vindas do background
 * 3. Remove listener quando o painel fecha (cleanup)
 * 
 * @returns Estado atual: { seiSites, currentSiteUrl }
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
      if (response?.seiSites) {
        // Atualiza apenas seiSites, mantendo outras propriedades
        setState(currentState => ({ 
          ...currentState, 
          seiSites: response.seiSites 
        }));
      }
    });
    
    // -------------------------------------------------------------------------
    // LISTENER: Escuta atualizações contínuas do background
    // -------------------------------------------------------------------------
    const messageHandler = (message: Message) => {
      if (message.type === 'app:state') {
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
