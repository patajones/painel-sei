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
  sites: SeiSite[];
  area?: string | null;
  usuario?: string | null;
}

export function CurrentSiteBanner({ url, sites, area, usuario }: CurrentSiteBannerProps) {
  // Considera SEI se a URL atual passa na heurística OU já foi registrada em seiSites
  const isSei = isSeiUrl(url) || sites.some(s => s.url === url);
  const icon = isSei ? '✅' : '🔃';
  const siteName = sites.find(s => s.url === url)?.name || url;
  
  return (
    <div className="current-site-banner">
      <span className="current-site-label">
        {icon} Site corrente:
      </span>
      <span className="current-site-url">
        {siteName}
      </span>
      {area && (
        <>
          <span className="current-site-label">
            📍 Área:
          </span>
          <span className="current-site-area">
            {area}
          </span>
        </>
      )}
      {usuario && (
        <>
          <span className="current-site-label">
            👤 Usuário:
          </span>
          <span className="current-site-user">
            {usuario}
          </span>
        </>
      )}
    </div>
  );
}
