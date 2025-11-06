import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest(async () => ({
  manifest_version: 3,
  name: 'Painel SEI',
  description: 'Painel lateral inteligente para SEI: detecção automática de sites SEI e visão rápida.',
  version: '0.1.0',
  permissions: ['storage', 'tabs', 'sidePanel', 'scripting'],
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
