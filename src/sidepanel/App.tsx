import React, { useEffect, useState } from 'react';
import type { AppState, Message, SeiSite } from '../shared/types';

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
  return <div style={{ padding: '1rem' }}>Nenhum site SEI foi adicionado ainda. Navegue para um site SEI para começar.</div>;
}

function SitesList({ sites, onNavigate }: { sites: SeiSite[]; onNavigate: (url: string) => void }) {
  if (!sites.length) return null;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: '0 1rem' }}>
      {sites.map(s => (
        <li key={s.url} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
          <span>{s.name ?? s.url}</span>
          <button onClick={() => onNavigate(s.url)} style={{ cursor: 'pointer' }}>Ir</button>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const { seiSites, currentSiteUrl } = useAppState();

  function navigateTo(url: string) {
    chrome.runtime.sendMessage({ type: 'app:navigateTo', url } as Message);
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>
      <header style={{ background: '#1b4b7a', color: 'white', padding: '0.5rem 1rem', fontWeight: 'bold' }}>
        Painel SEI
      </header>
      {!seiSites.length && <Welcome />}
      {currentSiteUrl && (
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #ddd' }}>
          Site atual detectado: <strong>{currentSiteUrl}</strong>
        </div>
      )}
      <div style={{ padding: '0.5rem 1rem', fontWeight: 'bold' }}>Sites SEI detectados</div>
      <SitesList sites={seiSites} onNavigate={navigateTo} />
    </div>
  );
}
