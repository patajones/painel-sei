# Painel SEI

**Painel SEI** é uma extensão de Browser que adiciona um painel lateral inteligente ao Sistema Eletrônico de Informações (SEI). A extensão detecta automaticamente quando você navega em sites SEI e oferece acesso rápido e resumos contextuais dos processos. 

## Instalação

Para instalar, clone o repositório, execute:

```shell
 npm install
 npm run build
 ```

 depois abra `chrome://extensions` no Chrome, ative o "Modo do desenvolvedor", clique em "Carregar sem compactação" e selecione a pasta `dist` gerada — o painel lateral estará disponível ao clicar no ícone da extensão ou automaticamente ao visitar um site SEI (se ativado no menu da extensão).

## Arquitetura

A extensão é composta por três componentes principais que se comunicam via mensagens Chrome:

### 1. Content Script (`src/content/index.ts`)
- Executa dentro das páginas web SEI
- Detecta sites SEI e injeta botão na barra superior
- Extrai área/setor atual do DOM (`extractCurrentArea()`) e usuário (`extractCurrentUser()`)
- Envia mensagem `context:changed` para o background

### 2. Background Service Worker (`src/background/index.ts`)
- Orquestra a lógica principal da extensão
- Mantém **`tabContextMap`**: Map em memória que armazena o contexto de cada aba
	- Chave: `tabId` (ID da aba)
	- Valor: `TabContext { siteUrl, area, usuario, lastUpdatedAt }`
- Sincroniza estado entre componentes via `updateAndSendAppState()`
- Gerencia storage persistente de sites detectados

### 3. Side Panel (`src/sidepanel/`)
- Interface React que exibe sites detectados e contexto atual
- Hook `useAppState()` solicita estado inicial e escuta atualizações
- Renderiza área/setor atual quando disponível

### Fluxo de Dados: Detecção de Contexto

**Diagrama detalhado**: consulte [`docs/architecture/APP-STATE.md`](docs/architecture/APP-STATE.md)
