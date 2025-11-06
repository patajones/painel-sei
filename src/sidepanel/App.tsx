import React, { useEffect, useState } from 'react';
import type { AppState, Message, SeiSite } from '../shared/types';
import './styles.css';

function useAppState(): AppState {
  const [state, setState] = useState<AppState>({ seiSites: [] });

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'app:getState' } as Message, (resp) => {
      if (resp?.seiSites) {
        setState(s => ({ ...s, seiSites: resp.seiSites }));
      }
    });
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

export default function App() {
  const { seiSites, currentSiteUrl } = useAppState();

  function navigateTo(url: string) {
    chrome.runtime.sendMessage({ type: 'app:navigateTo', url } as Message);
  }

  return (
    <div className="app-container">
      <header className="sei-header">
        <div className="sei-header-logo">⚡ Painel SEI</div>
      </header>
      
      {!seiSites.length && <Welcome />}
      
      {currentSiteUrl && (
        <div className="current-site-banner">
          <span className="current-site-label">📍 Site atual:</span>
          <span className="current-site-url">
            {seiSites.find(s => s.url === currentSiteUrl)?.name || currentSiteUrl}
          </span>
        </div>
      )}
      
      {seiSites.length > 0 && (
        <>
          <div className="section-title">Sites SEI Detectados</div>
          <SitesList sites={seiSites} onNavigate={navigateTo} />
        </>
      )}
    </div>
  );
}
