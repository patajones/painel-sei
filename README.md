# Painel SEI

Extensão Chrome (Manifest V3) com Side Panel em React para melhorar a experiência no Sistema Eletrônico de Informações (SEI). Este projeto atende ao PBI-01: Detecção Automática de Sites SEI (Issue #1).

## Desenvolver

Requisitos: Node 18+ e npm.

Instalar dependências e rodar em modo dev:

```powershell
npm install
npm run dev
```

Build para carregar no Chrome:

```powershell
npm run build
```

No Chrome: abrir chrome://extensions, ativar Developer mode e Load unpacked apontando para a pasta `dist`.

## Estrutura

- `src/background/index.ts`: Service Worker. Orquestra estado e comunicação.
- `src/content/index.ts`: Content script. Detecta páginas SEI e notifica o background.
- `src/sidepanel/`: UI em React; mostra site atual, lista de sites e permite navegar.
- `src/shared/`: Tipos e utilitários (storage).
- `manifest.ts`: Manifest MV3 (via @crxjs/vite-plugin).

## Critérios de Aceite (Issue #1)

1. Sem sites: mostra mensagem de boas-vindas.
2. Site atual: exibe URL/nome detectado.
3. Troca de site: painel reflete alteração automaticamente.
4. Persistência: lista de sites detectados anteriormente (chrome.storage.local).
5. Navegação: permite navegar para um site da lista.

## Testes

```powershell
npm test
```

Executa testes com Vitest (ex.: utilitário de storage).

## Notas

- Permissões e host_permissions estão amplas em dev (`<all_urls>`). Ajuste antes de publicar.
- O Side Panel usa `side_panel.default_path`. Abrir o painel manualmente no Chrome.
Painel SEI - Extensão de navegador para incrementar a experiência de um usuário SEI
