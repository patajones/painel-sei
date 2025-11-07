/**
 * Módulo de Configurações (Settings)
 * 
 * Gerencia preferências do usuário armazenadas no chrome.storage.local.
 * Atualmente controla a configuração de abertura automática do side panel.
 */

/**
 * Tipo das configurações da extensão
 */
export type Settings = {
  /** Se true, o side panel abre automaticamente ao detectar um site SEI */
  autoOpenSidePanel: boolean;
};

// Chave usada no chrome.storage.local
const SETTINGS_KEY = 'settings';

/**
 * Valores padrão das configurações (usados na primeira instalação)
 */
const DEFAULTS: Settings = {
  // Por padrão, abre o painel automaticamente em sites SEI
  autoOpenSidePanel: true,
};

/**
 * Recupera as configurações atuais do usuário
 * Mescla valores padrão com configurações salvas (valores salvos têm prioridade)
 * 
 * @returns Configurações completas (com defaults aplicados)
 */
export async function getSettings(): Promise<Settings> {
  const res = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULTS, ...(res[SETTINGS_KEY] ?? {}) } as Settings;
}

/**
 * Atualiza configurações do usuário (patch parcial)
 * Mescla as mudanças com valores existentes
 * 
 * @param patch - Objeto com as configurações a serem alteradas
 * @returns Configurações completas atualizadas
 */
export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch } as Settings;
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

/**
 * Alterna o estado da configuração de abertura automática
 * Inverte o valor atual de autoOpenSidePanel (true <-> false)
 * 
 * @returns Configurações atualizadas
 */
export async function toggleAutoOpen(): Promise<Settings> {
  const s = await getSettings();
  return setSettings({ autoOpenSidePanel: !s.autoOpenSidePanel });
}
