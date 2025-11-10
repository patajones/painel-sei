# GitHub Copilot Instructions for Painel SEI

## Project Overview
O Painel SEI é um complemento/extensão de navegador projetado para incrementar a experiência de um usuário do Sistema Eletrônico de Informações (SEI). Ele fornece um painel lateral inteligente que extrai e exibe dados contextuais da página SEI que estiver ativa, oferecendo visões "Num Relance", dados gerencial e resumos dos processos. Com o uso de IA, o painel transforma longos históricos de trâmites em relatórios e resumos concisos, permitindo que os usuários compreendam o estado e o conteúdo de um ou múltiplos processos.

## Technology Stack
- Node.js (LTS): Ambiente de execução para ferramentas de desenvolvimento e build
- React 18.2.0: UI componentizada, modular e de fácil manutenção do Side Panel
- Vite 5.0.0: Ferramenta de build para transformar código React (JSX/TSX) em arquivos estáticos (JS, CSS)
- TypeScript 5.3.3: Tipagem estática e desenvolvimento mais seguro
- Vitest 1.0.0: Framework de testes unitários e de integração
- Browser Extension APIs (Manifest V3): chrome.sidePanel, chrome.storage, chrome.tabs, chrome.runtime

## Coding Guidelines

### Arquitetura do Sistema

#### Componentes
- **Content Script** (`src/content/index.ts`): Ler/manipular DOM do SEI ou injetar botões/estilos. Detecta páginas SEI e envia mensagens ao background (`sei:detected`, `panel:open`). Inclui verificação de `chrome.runtime?.id` para lidar com recarregamento da extensão.

- **Background Service Worker** (`src/background/index.ts`): Orquestração, storage, eventos do navegador e mensageria. Escuta navegação/ativação de abas e trata mensagens. Delega ao `panelService` habilitar o Side Panel por site, atualizar badge e transmitir estado para a UI.

- **Side Panel** (`src/sidepanel/*`): UI do painel e interações iniciadas pelo usuário. Componentes React (`Welcome`, `CurrentSiteBanner`, `SitesList`) e hook `useAppState`. 
  - Crie componentes em `src/sidepanel/components/` e hooks em `src/sidepanel/hooks/`
  - Textos para o usuário em português; nomes técnicos genéricos em inglês
  - Use renderização condicional para manter a UI contextual e objetiva

- **Contrato de mensageria**:
  - Defina tipos em `src/shared/types.ts` (nomes em kebab-case, ex.: `painel:abrir`, `process:buscar`)
  - Documente payloads esperados (inputs), respostas (outputs) e erros tratados
  - Implemente o handler no background (switch central) e, quando necessário, propague estado via `panelService.broadcastAppState()`

- **Dados e storage**:
  - Use `chrome.storage.local` para metadados pequenos; normalize URLs com `extractSeiBaseUrl()` e valide com `isSeiUrl()`
  - Prefira operações idempotentes (ex.: `upsert`) com timestamps (`firstDetectedAt`, `lastVisitedAt`)
  - Se o formato mudar, registre no CHANGELOG e trate migração simples na leitura/gravação

#### Modelo de Dados e Storage

**1. chrome.storage.local - Metadados e Estado**
Usado para dados leves (JSON) de acesso rápido:
```json
{
  "seiSites": [{"url": "...", "name": "..."}],
  "cache": {
    "siteUrl": {
      "usuario": {
        "setor": {    
          "dashboard": {"...", "lastSync": "..."},
          "process": [{"processNumber": {"...", "lastSync": "..."}}],
          "documents": [{"seiId": {"...", "lastSync": "..."}}]
        }
      }
    }
  }
}
```

**2. IndexedDB - Cache de Arquivos PDF**
- Banco de Dados: `PainelSEIDB`
- Object Store: `pdfCache`
- Chave: `url do site SEI|seiId do processo|seiId do documento`
- Valor: `{"raw": Blob, "siteUrl": "...", "seiId": "...", "processNumber": "...", "plain": "", "fetchedAt": "..."}`

### General Principles
- Write clean, maintainable, and well-documented code
- Follow modern JavaScript/TypeScript best practices
- Ensure cross-browser compatibility when developing extension features
- Keep security in mind when handling user data and permissions

### Code Style
- Use 2 spaces for indentation
- Use meaningful variable and function names (prefer Portuguese for domain-specific terms and user-facing elements, English for generic technical terms)
- Add comments for complex logic or non-obvious implementations in Portuguese
- Follow ESLint rules if configured in the project

### Browser Extension Best Practices
- Minimize permissions requested from users
- Handle asynchronous operations properly with async/await or Promises
- Use content scripts appropriately to interact with web pages
- Ensure background scripts are efficient and don't consume excessive resources
- Follow the Manifest V3 guidelines when applicable

### Testing
Estratégia de testes em múltiplas camadas com Vitest como executor principal:

- **Testes Unitários**: Verificam a menor parte do código de forma isolada
  - Ferramentas: Vitest
  - Unitários para utilitários puros (`src/shared/*`)
  - Unitários com mocks para APIs do Chrome (storage, tabs, runtime)

- **Testes de Integração/Componentes**: Garantem que diferentes unidades funcionem corretamente em conjunto
  - Ferramentas: Vitest, React Testing Library (RTL), Mocks (vi.mock para simular APIs do Chrome)
  - Componentes React (renderização, eventos, comunicação com mocks)
  - Integração/UI com RTL quando houver componentes React
  
- **Testes E2E (opcional)**: Com Playwright para fluxos completos
  - Simulam a jornada completa do usuário no navegador
  - Test the extension in multiple browsers if possible
  - Verify that features work with different versions of the SEI system
  - Test edge cases and error handling

### Security Considerations
- Valide e sanitize entradas; nunca confie no DOM externo sem checagens
- Respeite CSP; evite eval e permissões amplas
- Never commit API keys, tokens, or sensitive credentials
- Follow the principle of least privilege for extension permissions
- Be cautious when injecting scripts into web pages
- Lembre-se: algumas APIs (ex.: `sidePanel.open`) exigem gesto de usuário

### Performance e ciclo de vida
- O Service Worker hiberna: persista o essencial e reidrate ao acordar
- Debounce/throttle em eventos de navegação/ativação; evite loops custosos no content script
- Ensure background scripts are efficient and don't consume excessive resources

### Documentation
- Update README.md when adding new features or when impacting user experience
- Atualize `CHANGELOG.md` com um item breve da mudança
- Keep comments up to date with code changes
- Comente em português trechos não óbvios do código

## SEI-Specific Context
- The extension targets the Brazilian government's electronic information system (SEI)
- Consider the Portuguese language for user-facing text and documentation
- Be aware of the specific workflows and interfaces of the SEI system

## Contribution Workflow
1. Create feature branches for new work
2. Write meaningful commit messages in Portuguese (preferred for consistency)
3. Test thoroughly before submitting pull requests
4. Keep changes focused and atomic

### Checklist de PR
- Descrição clara (o que/por que/como testar) e screenshots se afetar a UI
- CI verde (testes e build), lint sem erros
- Permissões revisadas e justificadas
- Mensagens do background adicionadas ao switch e tipadas em `src/shared/types.ts`
- Screenshots/GIFs quando houver mudança de UI
