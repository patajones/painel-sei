/**
 * Definições de Tipos Compartilhados
 * 
 * Este arquivo centraliza todos os tipos TypeScript usados em diferentes partes da extensão.
 */

/**
 * Representa um site SEI detectado e armazenado
 */
export type SeiSite = {
  /** URL base do site SEI (ex: https://sei.exemplo.gov.br) */
  url: string;
  /** Nome do órgão/organização (opcional, extraído do logo) */
  name?: string;
  /** Timestamp ISO da primeira vez que o site foi detectado */
  firstDetectedAt: string;
  /** Timestamp ISO do último acesso ao site */
  lastVisitedAt: string;
};

/**
 * Estado global da aplicação (compartilhado entre componentes)
 */
export type AppState = {
  /** Lista de todos os sites SEI detectados */
  seiSites: SeiSite[];
  /** URL do site SEI atualmente ativo (opcional) */
  currentSiteUrl?: string;
};

/**
 * União de tipos de mensagens trocadas entre componentes da extensão
 * (content script, background, side panel)
 */
export type Message =
  /** Notificação do content script: site SEI foi detectado */
  | { type: 'sei:detected'; site: { url: string; name?: string } }
  /** Solicitação de estado atual (usado pelo side panel ao abrir) */
  | { type: 'app:getState' }
  /** Comando para navegar a aba ativa para uma URL */
  | { type: 'app:navigateTo'; url: string }
  /** Broadcast de estado atualizado para UI */
  | { type: 'app:state'; state: AppState }
  /** Notificação de configurações atualizadas */
  | { type: 'settings:updated'; settings: { autoOpenSidePanel: boolean } }
  /** Comando para alternar configuração de auto-open */
  | { type: 'settings:toggleAutoOpen' };
