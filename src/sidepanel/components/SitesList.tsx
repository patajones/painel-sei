/**
 * Componente SitesList
 * 
 * Lista de sites SEI detectados com botões de navegação
 * 
 * Para cada site exibe:
 * - Nome do órgão (se disponível)
 * - URL base
 * - Data do último acesso
 * - Botão "Acessar" para navegar
 */

import React from 'react';
import type { SeiSite } from '../../shared/types';

interface SitesListProps {
  sites: SeiSite[];
  onNavigate: (url: string) => void;
}

export function SitesList({ sites, onNavigate }: SitesListProps) {
  if (sites.length === 0) {
    return null;
  }
  
  return (
    <ul className="sites-list">
      {sites.map(site => {
        const lastVisited = new Date(site.lastVisitedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        // Prioriza name (órgão), depois nome do contexto, depois fallback
        const displayName = site.name ?? site.lastContextData?.name ?? 'Site SEI';
        return (
          <li key={site.url} className="site-item">
            <div className="site-info">
              <div className="site-name">{displayName}</div>
              <div className="site-url">{site.url}</div>
              <div className="site-dates">Último acesso: {lastVisited}</div>
              <button className="site-navigate" onClick={() => onNavigate(site.url)}>Acessar</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
