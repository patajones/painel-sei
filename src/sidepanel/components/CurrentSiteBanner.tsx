/**
 * Componente CurrentSiteBanner
 * 
 * Banner exibindo o site atualmente ativo na aba
 * 
 * Mostra:
 * - ✅ se for site SEI
 * - 🔃 se for site não-SEI
 * - Nome do site (se disponível) ou URL completa
 */

import React from 'react';
import type { SeiSite } from '../../shared/types';
import { isSeiUrl } from '../../shared/sei';

interface CurrentSiteBannerProps {
  url: string;
  sites: SeiSite[];
}

export function CurrentSiteBanner({ url, sites }: CurrentSiteBannerProps) {
  const isSei = isSeiUrl(url);
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
    </div>
  );
}
