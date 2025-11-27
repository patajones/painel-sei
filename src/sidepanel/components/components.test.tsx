import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Welcome } from './Welcome';
import { CurrentSiteBanner } from './CurrentSiteBanner';
import { SitesList } from './SitesList';

// Mock chrome.runtime.getURL usado em App (não aqui, mas manter padrão)
(globalThis as any).chrome = (globalThis as any).chrome || {};
(globalThis as any).chrome.runtime = (globalThis as any).chrome.runtime || { getURL: vi.fn((p: string) => p) };

const sampleSites = [
  {
    url: 'https://sei.example.com',
    name: 'Órgão Exemplo',
    firstDetectedAt: '2025-01-01',
    lastVisitedAt: '2025-01-02',
    lastContextData: {
      siteUrl: 'https://sei.example.com',
      area: null,
      usuario: null
    }
  },
  {
    url: 'https://sei.outro.gov.br',
    firstDetectedAt: '2025-02-01',
    lastVisitedAt: '2025-02-02',
    lastContextData: {
      siteUrl: 'https://sei.outro.gov.br',
      area: null,
      usuario: null
    }
  },
];

describe('Side Panel Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Welcome deve renderizar mensagem de vazio', () => {
    render(<Welcome />);
    expect(screen.getByText(/Nenhum site SEI foi adicionado ainda/i)).toBeInTheDocument();
  });

  it('CurrentSiteBanner mostra ícone, área e usuário quando URL é SEI', () => {
    render(<CurrentSiteBanner url="https://sei.example.com" area="SESINF" usuario="João Silva" currentIsSei={true} />);
    expect(screen.getByText(/Site corrente:/)).toBeInTheDocument();    
    expect(screen.getByText('SESINF')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('CurrentSiteBanner usa URL quando nome não existe', () => {
    render(<CurrentSiteBanner url="https://sei.outro.gov.br" area={null} currentIsSei={true} />);
    expect(screen.getByText('https://sei.outro.gov.br')).toBeInTheDocument();
  });

  it('SitesList não renderiza nada quando lista vazia', () => {
    const { container } = render(<SitesList sites={[]} onNavigate={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('SitesList renderiza itens e dispara onNavigate', () => {
    const onNavigate = vi.fn();
    render(<SitesList sites={sampleSites} onNavigate={onNavigate} />);
    // Deve mostrar nome ou fallback
    expect(screen.getByText('Órgão Exemplo')).toBeInTheDocument();
    expect(screen.getByText('Site SEI')).toBeInTheDocument(); // fallback do segundo
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    fireEvent.click(buttons[0]);
    expect(onNavigate).toHaveBeenCalledWith('https://sei.example.com');
  });
});
