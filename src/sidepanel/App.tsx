/**
 * Side Panel - Componente Principal da UI (App)
 * 
 * Interface React que exibe:
 * - Lista de sites SEI detectados
 * - Site SEI atualmente ativo
 * - Opções de navegação rápida
 */

import React, { useEffect, useState } from 'react';
import type { AppState, Message, SeiSite } from '../shared/types';
import './styles.css';

/**
 * Hook personalizado para gerenciar estado da aplicação
 * Sincroniza com o background script para manter dados atualizados
 * 
 * @returns Estado atual da aplicação (lista de sites e site ativo)
 */
function useAppState(): AppState {
  const [state, setState] = useState<AppState>({ seiSites: [] });

  useEffect(() => {
    // Solicita estado inicial ao abrir o painel
    chrome.runtime.sendMessage({ type: 'app:getState' } as Message, (resp) => {
      if (resp?.seiSites) {
        setState(s => ({ ...s, seiSites: resp.seiSites }));
      }
    });
    
    // Ouve atualizações de estado enviadas pelo background
    const handler = (msg: Message) => {
      if (msg.type === 'app:state') {
        setState(msg.state);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  return state;
}

/**
 * Componente de boas-vindas exibido quando nenhum site SEI foi detectado ainda
 */
function Welcome() {
  return (
    <div className="welcome-message">
      <div className="empty-state-icon">📋</div>
      <div className="empty-state-text">
        Nenhum site SEI foi adicionado ainda.<br />
        Navegue para um site SEI para começar.
      </div>
    </div>
  );
}

/**
 * Lista de sites SEI com botões de navegação
 * 
 * @param sites - Array de sites SEI a serem exibidos
 * @param onNavigate - Callback chamado ao clicar no botão "Acessar"
 */
function SitesList({ sites, onNavigate }: { sites: SeiSite[]; onNavigate: (url: string) => void }) {
  if (!sites.length) return null;
  
  return (
    <ul className="sites-list">
      {sites.map(s => {
        const lastVisited = new Date(s.lastVisitedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        return (
          <li key={s.url} className="site-item">
            <div className="site-info">
              <div className="site-name">{s.name || 'Site SEI'}</div>
              <div className="site-url">{s.url}</div>
              <div className="site-dates">Último acesso: {lastVisited}</div>
            </div>
            <button className="navigate-btn" onClick={() => onNavigate(s.url)}>
              Acessar
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Componente principal do Side Panel
 * Renderiza cabeçalho, site atual, lista de sites e estados vazios
 */
export default function App() {
  const { seiSites, currentSiteUrl } = useAppState();

  /**
   * Envia comando ao background para navegar a aba ativa para uma URL
   */
  function navigateTo(url: string) {
    chrome.runtime.sendMessage({ type: 'app:navigateTo', url } as Message);
  }

  return (
    <div className="app-container">
      {/* Cabeçalho com logo da extensão */}
      <header className="sei-header">
        <img
          src={chrome.runtime.getURL('icons/icon.png')}
          alt="Painel SEI"
          className="sei-logo-img"
        />
        <div className="sei-header-logo">Painel SEI</div>
      </header>
      
      {/* Mensagem de boas-vindas quando não há sites */}
      {!seiSites.length && <Welcome />}
      
      {/* Banner exibindo o site SEI atualmente ativo */}
      {currentSiteUrl && (
        <div className="current-site-banner">
          <span className="current-site-label">📍 Site atual:</span>
          <span className="current-site-url">
            {seiSites.find(s => s.url === currentSiteUrl)?.name || currentSiteUrl}
          </span>
        </div>
      )}
      
      {/* Lista de todos os sites SEI detectados */}
      {seiSites.length > 0 && (
        <>
          <div className="section-title">Sites SEI Detectados</div>
          <SitesList sites={seiSites} onNavigate={navigateTo} />
        </>
      )}
    </div>
  );
}
