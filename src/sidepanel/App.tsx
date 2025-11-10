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
  const { seiSites, currentSiteUrl, currentArea } = useAppState();

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
      
      {/* Banner do site atualmente ativo (sempre visível quando há URL) */}
      {currentSiteUrl && isSeiUrl(currentSiteUrl) && (
        <CurrentSiteBanner url={currentSiteUrl} sites={seiSites} area={currentArea} />
      )}
      
      {/* Lista de sites SEI: só aparece se o site atual NÃO for SEI */}
      {currentSiteUrl && !isSeiUrl(currentSiteUrl) && seiSites.length > 0 && (
        <>
          <div className="section-title">Sites SEI Detectados</div>
          <SitesList sites={seiSites} onNavigate={navigateTo} />
        </>
      )}
    </div>
  );
}
