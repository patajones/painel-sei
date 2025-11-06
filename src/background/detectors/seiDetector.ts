/**
 * Detector de sites SEI
 * Exporta funções para verificar se uma URL/página é um site SEI
 */

/**
 * Verifica se a URL parece ser de um site SEI
 * Heurística baseada em padrões comuns de URLs SEI
 */
export function isSeiUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Padrões comuns de URLs SEI
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
 * Interface para informações detectadas de um site SEI
 */
export interface SeiDetectionInfo {
  url: string;
  baseUrl: string;
  name?: string;
  detectedAt: string;
}

/**
 * Cria informações de detecção a partir de uma URL e nome opcional
 */
export function createSeiDetectionInfo(url: string, name?: string): SeiDetectionInfo | null {
  if (!isSeiUrl(url)) {
    return null;
  }

  const baseUrl = extractSeiBaseUrl(url);
  if (!baseUrl) {
    return null;
  }

  return {
    url: baseUrl,
    baseUrl,
    name,
    detectedAt: new Date().toISOString(),
  };
}
