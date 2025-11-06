---
applyTo: '**'
---
O Painel SEI é um complemento/extensão de navegador projetado para incrementar a experiência de um usuário do Sistema Eletrônico de Informações (SEI). Ele fornece um painel lateral inteligente que extrai e exibe dados contextuais da página SEI que estiver ativa, oferecendo visões “Num Relance”, dados gerencial e resumos dos processos. Com o uso de IA, o painel transforma longos históricos de trâmites em relatórios e resumos concisos, permitindo que os usuários compreendam o estado e o conteúdo de um ou múltiplos processos. 
## Arquitetura e Decisões Técnicas. 
### Arquitetura do Sistema: 
#### Componentes
Content Script (content.js): Acessa o DOM da página SEI para extrair dados e injetar comandos. Comunica-se exclusivamente com o Background Script.
Background Script (background.js / Service Worker): Orquestra a lógica de negócio, coordena componentes, gerencia estado e comunicação externa. Ouve eventos e envia atualizações para a UI.
AiManager: Abstrai o provedor de IA (Strategy). Lê a configuração do usuário no chrome.storage.local e instancia o serviço de IA correspondente (ex: GeminiService) que implementa a interface IAiService.
IAiService: Interface que todos os serviços de IA devem seguir.
PromptManager: Desacopla e centraliza a construção de prompts, transformando dados em instruções para a IA sem estado ou comunicação externa.
DocManager: Gerencia o ciclo de vida dos documentos: obtenção no SEI, armazenamento e processamento. Interage com o IndexedDB para cache e com o Content Script para downloads.
Side Panel (sidepanel.js): Interface gráfica (UI) com a qual o usuário interage, construída em React. Apenas reflete o estado gerenciado pelo Background Script e delega ações a ele.
Storage (chrome.storage.local): Persiste dados leves (JSON) e estado da aplicação. É assíncrono e acessível no Service Worker (Manifest V3), sendo preferível ao localStorage.
Cache de Documentos (IndexedDB): Cache de alta capacidade para arquivos binários (PDFs), superando os limites do chrome.storage.
## Modelo de Dados e Storage
### 1. chrome.storage.local - Metadados e Estado
Usado para dados leves (JSON) de acesso rápido para controlar a lógica e renderizar a UI.
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
### 2. IndexedDB - Cache de Arquivos PDF
Usado para armazenar arquivos de documentos (Blobs).
Banco de Dados: PainelSEIDB
Object Store: pdfCache
Chave: url do site SEI|seiId do processo|seiId do documento
Valor (Objeto):
```json
{
  "raw": Blob,
  "siteUrl": "...",
  "seiId": "...",
  "processNumber": "...",  
  "plain": "",
  "fetchedAt": "..."
}
```
### Stack de Tecnologia
Node.js (LTS): Ambiente de execução para ferramentas de desenvolvimento e build.
React: Usado para construir a UI componentizada, modular e de fácil manutenção do Side Panel.
Vite: Ferramenta de build para transformar código React (JSX/TSX) em arquivos estáticos (JS, CSS).
### Estratégia de Testes
Adotada estratégia em múltiplas camadas com Vitest como executor principal.
- Testes Unitários: Verificam a menor parte do código de forma isolada. Ferramentas: Vitest.
- Testes de Integração / Componentes: Garantem que diferentes unidades funcionem corretamente em conjunto. O que testar: Componentes React (renderização, eventos, comunicação com mocks) e a colaboração entre os módulos do background (orquestrador e managers). Ferramentas: Vitest, React Testing Library (RTL), Mocks (vi.mock para simular APIs do Chrome).
- Testes End-to-End (E2E): Simulam a jornada completa do usuário no navegador em um ambiente próximo ao de produção. Ferramentas: Playwright para automação de navegador e teste de extensões Chrome.