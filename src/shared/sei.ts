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
