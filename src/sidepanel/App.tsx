/**
 * Side Panel - Componente Principal (App)
 * 
 * Componente raiz que orquestra a interface do painel lateral:
 * - Header com logo e título
 * - Welcome (se não houver sites)
 * - Banner do site atual (se houver URL ativa)
 * - Lista de sites SEI detectados
 */


import type { Message, SeiSite } from '../shared/types';
import { useAppState } from './hooks/useAppState';
import { Welcome } from './components/Welcome';
import { CurrentSiteBanner } from './components/CurrentSiteBanner';
import { SitesList } from './components/SitesList';
import { isRecognizedSeiUrl } from '../shared/sei';
import './styles.css';

export default function App() {
  const { seiSites, currentTab, currentSeiSiteContextData } = useAppState();
  const isCurrentSiteSei = !!(currentTab?.siteUrl && isRecognizedSeiUrl(currentTab.siteUrl, seiSites));
  const hasSiteSei = !!(currentSeiSiteContextData?.siteUrl && isRecognizedSeiUrl(currentSeiSiteContextData?.siteUrl, seiSites));

  function navigateTo(url: string) {
    chrome.runtime.sendMessage({
      type: 'app:navigateTo',
      url
    } as Message);
  }

  console.debug('[Painel SEI][App] Render', {
    seiSites,
    currentTab, 
    currentSeiSiteContextData,
    isCurrentSiteSei,
    hasSiteSei,
  });

  return (
    <div className="app-container">
      <header className="sei-header">
        <img
          src={chrome.runtime.getURL('icons/icon.png')}
          alt="Painel SEI"
          className="sei-logo-img"
        />
        <div className="sei-header-logo">Painel SEI</div>
      </header>

      {seiSites.length === 0 && <Welcome />}

      {/* Banner do site SEI atual ou último contexto SEI salvo, usando dados do storage */}
      {isCurrentSiteSei && currentSeiSiteContextData?.siteUrl ? (
        <CurrentSiteBanner
          url={currentSeiSiteContextData.siteUrl}
          area={currentSeiSiteContextData?.area ?? null}
          usuario={currentSeiSiteContextData?.usuario ?? null}
          processo={currentSeiSiteContextData?.processo ?? null}
          currentIsSei={true}
        />
      ) : hasSiteSei && currentSeiSiteContextData?.siteUrl ? (
        <CurrentSiteBanner
          url={currentSeiSiteContextData.siteUrl}
          area={currentSeiSiteContextData?.area ?? null}
          usuario={currentSeiSiteContextData?.usuario ?? null}
          processo={currentSeiSiteContextData?.processo ?? null}
          currentIsSei={false}
        />
      ) : null}

      {/* Lista de sites SEI: só aparece se o site atual NÃO for SEI */}
      {!isCurrentSiteSei && !hasSiteSei && seiSites.length > 0 && (
        <>
          <div className="section-title">Sites SEI Detectados</div>
          <SitesList sites={seiSites} onNavigate={navigateTo} />
        </>
      )}
    </div>
  );
}
