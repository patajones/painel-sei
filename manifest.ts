import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest(async () => ({
  manifest_version: 3,
  name: 'Painel SEI',
  description: 'Painel lateral inteligente para SEI: detecção automática de sites SEI e visão rápida.',
  version: '0.1.0',
  icons: {
    16: 'icons/icon.png',
    48: 'icons/icon.png',
    128: 'icons/icon.png',
  },
  action: {
    default_title: 'Painel SEI'
  },
  commands: {
    '_execute_action': {
      suggested_key: {
        default: 'Ctrl+Shift+S'
      }
    }
  },
  permissions: ['storage', 'tabs', 'sidePanel', 'scripting', 'contextMenus'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/index.ts'
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts']
    }
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html'
  }
}));
