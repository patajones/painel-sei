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
        
        return (
          <li key={site.url} className="site-item">
            <div className="site-info">
              <div className="site-name">{site.name || 'Site SEI'}</div>
              <div className="site-url">{site.url}</div>
              <div className="site-dates">Último acesso: {lastVisited}</div>
            </div>
            <button 
              className="navigate-btn" 
              onClick={() => onNavigate(site.url)}
              aria-label={`Navegar para ${site.name || site.url}`}
            >
              Acessar
            </button>
          </li>
        );
      })}
    </ul>
  );
}
