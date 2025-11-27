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
 * Retorna true se a URL for reconhecida como SEI por heurística OU já estiver em seiSites.
 */
export function isRecognizedSeiUrl(url: string, seiSites: { url: string }[]): boolean {
  return isSeiUrl(url) || seiSites.some(s => s.url === url);
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
export function extractCurrentArea(): string | null | undefined {

  // Heurística 1: Link padrão com ID lnkInfraUnidade
  // Aparece na Página principal do SEI
  const unidadeLink = document.querySelector('#lnkInfraUnidade') as HTMLAnchorElement | undefined;
  if (unidadeLink) {
    const text = unidadeLink.textContent?.trim();
    if (text) {
      return normalizeAreaText(text);
    } else {
      //encontrou o elemento, mas não tem texto
      return null;
    }    
  }  
  //se não encontrou os elementos, retorna undefined, 
  // que quer dizer que não foi posível determinar a área
  console.info('[Painel SEI][SEI] extractCurrentArea: não foi possível determinar a área/setor atual');
  return undefined;
}

/**
 * Extrai o número do processo SEI atualmente aberto na aba
 * Retorna todo o conteúdo do div de localização se a URL indicar processo aberto
 */
export function extractCurrentProcessNumber(): string | null | undefined {
  if (location.search.includes('acao=procedimento_trabalhar')) {
    const divProc = document.querySelector('#divInfraBarraLocalizacao.infraBarraLocalizacao');
    if (divProc && divProc.textContent) {
      return divProc.textContent.trim();
    } else {
      return null;
    }
  } else if (location.search.includes('acao=procedimento_visualizar')) {
    // Busca apenas dentro do menu de árvore
    const topMenu = document.querySelector('#topmenu.infraArvore');
    if (topMenu) {
      const anchors = Array.from(topMenu.querySelectorAll('a'));
      for (const a of anchors) {
        if (a.querySelector('img')) continue; // pula se tem imagem
        const span = a.querySelector('span');
        if (span && span.textContent && span.textContent.trim()) {
          return span.textContent.trim();
        }
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

/**
 * Extrai o nome do usuário logado no SEI
 * Usa múltiplas heurísticas para encontrar a informação:
 * 1. Link com id "lnkInfraUsuario" (padrão mais comum)
 * 2. Elemento com id "lnkUsuarioSistema" (versão antiga)
 * 3. Elementos na barra superior com informações do usuário
 * 
 * @returns String com o nome do usuário ou null se não encontrado
 */
export function extractCurrentUser(): string | null | undefined {
  // Heurística 1: Link com ID lnkUsuarioSistema (mais comum)  
  const userLink = document.querySelector('#lnkUsuarioSistema') as HTMLAnchorElement | null;
  if (userLink) { 
    // Prioriza o atributo title que contém o nome completo
    const title = userLink.getAttribute('title')?.trim();
    const text = userLink.textContent?.trim();
    if (title) {
      // Extrai apenas o nome antes do parênteses
      // Ex: "Ricardo Bernardes dos Santos (ricardo.santos/CJF)" → "Ricardo Bernardes dos Santos"
      const match = title.match(/^([^(]+)/);
      if (match && match[1]) {
        return normalizeUserText(match[1]);
      }
    } else if (text) {
      return normalizeUserText(text);
    } else {
      return null;
    }
  }  
  
  return undefined;
}

/**
 * Normaliza o texto do nome do usuário
 * - Remove espaços extras
 * - Limita o tamanho
 * - Remove caracteres especiais desnecessários
 */
function normalizeUserText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Colapsa múltiplos espaços em um só
    .replace(/[^\w\sÀ-ÿ]/g, '') // Remove caracteres especiais, mantém acentos
    .substring(0, 100); // Limita tamanho máximo
}
