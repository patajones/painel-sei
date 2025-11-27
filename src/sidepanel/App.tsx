/**
 * Side Panel - Componente Principal (App)
 * 
 * Componente raiz que orquestra a interface do painel lateral:
 * - Header com logo e título
 * - Welcome (se não houver sites)
 * - Banner do site atual (se houver URL ativa)
 * - Lista de sites SEI detectados
 */

import React from 'react';
import type { Message } from '../shared/types';
import { useAppState } from './hooks/useAppState';
import { Welcome } from './components/Welcome';
import { CurrentSiteBanner } from './components/CurrentSiteBanner';
import { SitesList } from './components/SitesList';
import { isSeiUrl } from '../shared/sei';
import './styles.css';

export default function App() {
  // Obtém estado atualizado do hook customizado
  const { seiSites, currentTab, lastSeiTab } = useAppState();
  // Determina se a aba atual é SEI
  const isCurrentSiteSei = !!(currentTab?.siteUrl && (
    isSeiUrl(currentTab.siteUrl) || seiSites.some(s => s.url === currentTab.siteUrl)
  ));
  const hasLastSiteSei = !!(lastSeiTab?.siteUrl && (
    isSeiUrl(lastSeiTab.siteUrl) || seiSites.some(s => s.url === lastSeiTab.siteUrl)
  ));

  /**
   * Envia comando ao background para navegar a aba ativa
   */
  function navigateTo(url: string) {
    chrome.runtime.sendMessage({ 
      type: 'app:navigateTo', 
      url 
    } as Message);
  }

  return (
    <div className="app-container">
      {/* Cabeçalho fixo com logo e título */}
      <header className="sei-header">
        <img
          src={chrome.runtime.getURL('icons/icon.png')}
          alt="Painel SEI"
          className="sei-logo-img"
        />
        <div className="sei-header-logo">Painel SEI</div>
      </header>
      
      {/* Estado vazio: nenhum site detectado ainda */}
      {seiSites.length === 0 && <Welcome />}
      
      {/* Banner do site SEI atual ou último contexto SEI salvo */}
      {(isCurrentSiteSei && currentTab?.siteUrl) ? (
        <CurrentSiteBanner 
          url={currentTab.siteUrl} 
          sites={seiSites} 
          area={currentTab.area}
          usuario={currentTab.usuario}
          currentIsSei={true}
        />
      ) : (lastSeiTab && lastSeiTab.siteUrl) ? (
        <CurrentSiteBanner 
          url={lastSeiTab.siteUrl}
          sites={seiSites}
          area={lastSeiTab.area}
          usuario={lastSeiTab.usuario}
          currentIsSei={false}
        />
      ) : null}
      
      {/* Lista de sites SEI: só aparece se o site atual NÃO for SEI */}
      {currentTab?.siteUrl && !isCurrentSiteSei && seiSites.length > 0 && (
        <>
          <div className="section-title">Sites SEI Detectados</div>
          <SitesList sites={seiSites} onNavigate={navigateTo} />
        </>
      )}
    </div>
  );
}
