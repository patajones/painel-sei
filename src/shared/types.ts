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

  /** Nome do órgão/organização (opcional, legado para compatibilidade de mocks/testes) */
  name?: string;

  /** Último dados de contextos extraídos da aba quando o site foi acessado */
  lastContextData: TabContext;
  
  /** Timestamp ISO da primeira vez que o site foi detectado */
  firstDetectedAt: string;

  /** Timestamp ISO do último acesso ao site */
  lastVisitedAt: string;
};

/**
 * Contexto efêmero armazenado por aba no background (não persistido)
 * Reconstruído conforme o content script detecta informações do SEI
 */
export type TabContext = {
  /** URL base do site SEI da aba (ex: https://sei.exemplo.gov.br) */
  siteUrl: string;
  name?: string;
  /** Nome da área/setor atual (ex: "SESINF") ou null se não detectada */
  area: string | null | undefined;
  /** Nome do usuário logado ou null se não detectado */
  usuario: string | null | undefined;
  /** Número do processo atualmente aberto, se houver */
  processo?: string | null | undefined;
  /** Timestamp da última atualização deste contexto */
  lastUpdatedAt?: string;
  // documento?: string; // ID do documento em visualização
};

/**
 * Estado global da aplicação (compartilhado entre componentes)
 */
export type AppState = {
  /** Lista de todos os sites SEI detectados */
  seiSites: SeiSite[];
  /** Contexto completo da aba ativa */
  currentTab?: TabContext;
  /** Contexto completo do site SEI (se tiver tido um site SEI aberto) */
  currentSeiSiteContextData?: TabContext;
};

/**
 * União de tipos de mensagens trocadas entre componentes da extensão
 * (content script, background, side panel)
 */
export type Message =
  /** Notificação do content script: contexto da página mudou (área, usuário, processo, etc.) */
  | { type: 'context:changed'; siteUrl: string; area: string | null | undefined; usuario: string | null | undefined; processo?: string | null | undefined }
  /** Solicitação do background para o content script atualizar área/usuário */
  | { type: 'context:request' }
  /** Solicitação de estado atual (usado pelo side panel ao abrir) */
  | { type: 'app:getState' }
  /** Comando para navegar a aba ativa para uma URL */
  | { type: 'app:navigateTo'; url: string }
  /** Broadcast de estado atualizado para UI */
  | { type: 'app:state'; state: AppState }
  /** Comando para abrir o painel lateral (enviado pelo botão injetado na barra do SEI) */
  | { type: 'panel:open' }
  /** Comando para ativar a última aba SEI */
  | { type: 'app:activateLastSeiTab' };
