/**
 * Módulo de Configurações (Settings)
 * 
 * Gerencia preferências do usuário armazenadas no chrome.storage.local.
  */

/**
 * Tipo das configurações da extensão
 */
export type Settings = {  
  
};

// Chave usada no chrome.storage.local
const SETTINGS_KEY = 'settings';

/**
 * Valores padrão das configurações (usados na primeira instalação)
 */
const DEFAULTS: Settings = {

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
