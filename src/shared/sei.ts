/**
 * Funções utilitárias compartilhadas para detecção/normalização de URLs do SEI
 */

/**
 * Verifica se a URL parece ser de um site SEI
 * Heurística baseada em padrões comuns de URLs SEI
 */
export function isSeiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();

    return (
      path.includes('/sei/') ||
      path.includes('/sip/') ||
      path.startsWith('/controlador.php') ||
      path.startsWith('/sei/')
    );
  } catch {
    return false;
  }
}

/**
 * Extrai a URL base de um site SEI
 * Ex: https://sei.example.com/sei/controlador.php?acao=xxx → https://sei.example.com
 */
export function extractSeiBaseUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return null;
  }
}

/**
 * Extrai a área/setor (unidade) atual do DOM de uma página SEI
 * Usa múltiplas heurísticas para encontrar a informação:
 * 1. Link com id "lnkInfraUnidade" (padrão mais comum)
 * 2. Elementos com texto indicativo (rótulos "Unidade:", "Setor:", etc.)
 * 
 * @returns String com o nome da área/setor ou null se não encontrado
 */
export function extractCurrentArea(): string | null {
  // Heurística 1: Link padrão com ID lnkInfraUnidade
  // Busca tanto na versão desktop quanto mobile
  const unidadeLink = document.querySelector('#lnkInfraUnidade') as HTMLAnchorElement | null;
  if (unidadeLink) {
    const text = unidadeLink.textContent?.trim();
    if (text) {
      return normalizeAreaText(text);
    }
    
    // Se não houver texto, tenta obter do título
    const title = unidadeLink.title?.trim();
    if (title) {
      return normalizeAreaText(title);
    }
  }
  
  // Heurística 2: Elementos com classe ou estrutura conhecida do SEI
  // Busca por elementos que possam conter o nome da unidade
  const candidates = [
    '.infraAcaoBarraConjugada[title]',
    '[id*="Unidade"][title]',
    '.infraBarraSistema [title*="Setor"]',
    '.infraBarraSistema [title*="Seção"]',
  ];
  
  for (const selector of candidates) {
    const el = document.querySelector(selector);
    if (el) {
      const title = el.getAttribute('title')?.trim();
      if (title && title.length > 0) {
        return normalizeAreaText(title);
      }
    }
  }
  
  return null;
}

/**
 * Normaliza o texto da área/setor
 * - Remove espaços extras
 * - Limita o tamanho
 * - Remove caracteres especiais desnecessários
 */
function normalizeAreaText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Colapsa múltiplos espaços em um só
    .substring(0, 120); // Limita tamanho máximo
}
