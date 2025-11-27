/**
 * Componente CurrentSiteBanner
 * 
 * Banner exibindo o site atualmente ativo na aba
 * 
 * Mostra:
 * - ✅ se for site SEI
 * - 🔃 se for site não-SEI
 * - Nome do site (se disponível) ou URL completa
 * - Área/setor atual (se disponível)
 */

import React from 'react';
import type { SeiSite } from '../../shared/types';
import { isSeiUrl } from '../../shared/sei';

interface CurrentSiteBannerProps {
  url: string;
  area?: string | null;
  usuario?: string | null;
  processo?: string | null;
  currentIsSei: boolean;
}

export function CurrentSiteBanner({ url, area, usuario, processo, currentIsSei }: CurrentSiteBannerProps) {  
  
  // Handler para ativar a última aba SEI
  function handleActivateLastSeiTab(e: React.MouseEvent) {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'app:activateLastSeiTab' });
  }

  return (
    <div className="current-site-banner">
      <span className="current-site-label">
        {currentIsSei ? (
          <>✅ Site corrente:</>
        ) : (
          <><a href="#" onClick={handleActivateLastSeiTab} style={{ textDecoration: 'underline', color: '#004C97', cursor: 'pointer' }} title="Ir para o último SEI aberto">🔃</a> Site corrente:</>
        )}
      </span>
      <span className="current-site-url">
        {url}
      </span>
      {area && (
        <span style={{ display: 'inline-block', marginRight: 12 }}>
          <span className="current-site-label">📍 Área:</span>
          <span className="current-site-area" style={{ marginLeft: 4 }}>{area}</span>
        </span>
      )}
      {usuario && (
        <span style={{ display: 'inline-block', marginRight: 12 }}>
          <span className="current-site-label">👤 Usuário:</span>
          <span className="current-site-user" style={{ marginLeft: 4 }}>{usuario}</span>
        </span>
      )}
      {processo && (
        <span style={{ display: 'inline-block', marginRight: 12 }}>
          <span className="current-site-label">📄 Processo:</span>
          <span className="current-site-processo" style={{ marginLeft: 4 }}>{processo}</span>
        </span>
      )}
    </div>
  );
}
