/**
 * Testes para funções utilitárias de detecção e normalização de URLs do SEI
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSeiUrl, extractSeiBaseUrl, extractCurrentArea, extractCurrentUser } from './sei';

describe('isSeiUrl', () => {
  describe('deve retornar true para URLs SEI válidas', () => {
    it('com path /sei/', () => {
      expect(isSeiUrl('https://sei.example.gov.br/sei/controlador.php')).toBe(true);
      expect(isSeiUrl('https://sei.example.gov.br/sei/')).toBe(true);
      expect(isSeiUrl('http://example.gov.br/sei/modulos/usuarios')).toBe(true);
    });

    it('com path /sip/', () => {
      expect(isSeiUrl('https://sei.example.gov.br/sip/login.php')).toBe(true);
      expect(isSeiUrl('https://example.gov.br/sip/')).toBe(true);
    });

    it('com controlador.php no início do path', () => {
      expect(isSeiUrl('https://sei.example.gov.br/controlador.php?acao=teste')).toBe(true);
      expect(isSeiUrl('http://example.gov.br/controlador.php')).toBe(true);
    });

    it('case insensitive (maiúsculas/minúsculas)', () => {
      expect(isSeiUrl('https://example.gov.br/SEI/controlador.php')).toBe(true);
      expect(isSeiUrl('https://example.gov.br/SIP/login.php')).toBe(true);
      expect(isSeiUrl('https://example.gov.br/CONTROLADOR.PHP')).toBe(true);
    });

    it('com query parameters complexos', () => {
      const url = 'https://sei.example.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id=123&teste=abc';
      expect(isSeiUrl(url)).toBe(true);
    });

    it('com portas específicas', () => {
      expect(isSeiUrl('https://sei.example.gov.br:8080/sei/controlador.php')).toBe(true);
      expect(isSeiUrl('http://localhost:3000/sei/teste')).toBe(true);
    });
  });

  describe('deve retornar false para URLs não-SEI', () => {
    it('sites comuns (Google, GitHub, etc)', () => {
      expect(isSeiUrl('https://www.google.com')).toBe(false);
      expect(isSeiUrl('https://github.com/user/repo')).toBe(false);
      expect(isSeiUrl('https://stackoverflow.com/questions')).toBe(false);
    });

    it('sites .gov.br que não são SEI', () => {
      expect(isSeiUrl('https://www.gov.br/noticias')).toBe(false);
      expect(isSeiUrl('https://www.planalto.gov.br')).toBe(false);
    });

    it('paths que contêm "sei" mas não são SEI', () => {
      expect(isSeiUrl('https://example.com/noticias/sei-la-o-que')).toBe(false);
      expect(isSeiUrl('https://example.com/seita')).toBe(false);
    });

    it('URLs inválidas', () => {
      expect(isSeiUrl('not-a-url')).toBe(false);
      expect(isSeiUrl('ftp://invalid')).toBe(false);
      expect(isSeiUrl('')).toBe(false);
    });

    it('paths com controlador.php mas não no início', () => {
      expect(isSeiUrl('https://example.com/teste/controlador.php')).toBe(false);
      expect(isSeiUrl('https://example.com/docs/controlador.php.html')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('URL com fragmento (#)', () => {
      expect(isSeiUrl('https://sei.example.gov.br/sei/controlador.php#section')).toBe(true);
    });

    it('URL com user info', () => {
      expect(isSeiUrl('https://user:pass@sei.example.gov.br/sei/')).toBe(true);
    });

    it('localhost', () => {
      expect(isSeiUrl('http://localhost/sei/controlador.php')).toBe(true);
      expect(isSeiUrl('http://127.0.0.1/sei/teste')).toBe(true);
    });
  });
});

describe('extractSeiBaseUrl', () => {
  describe('deve extrair corretamente a URL base', () => {
    it('de URLs SEI com path /sei/', () => {
      expect(extractSeiBaseUrl('https://sei.example.gov.br/sei/controlador.php')).toBe('https://sei.example.gov.br');
      expect(extractSeiBaseUrl('http://sei.example.gov.br/sei/modulos/teste')).toBe('http://sei.example.gov.br');
    });

    it('de URLs com query parameters', () => {
      const url = 'https://sei.example.gov.br/sei/controlador.php?acao=teste&id=123';
      expect(extractSeiBaseUrl(url)).toBe('https://sei.example.gov.br');
    });

    it('de URLs com portas', () => {
      expect(extractSeiBaseUrl('https://sei.example.gov.br:8080/sei/teste')).toBe('https://sei.example.gov.br:8080');
      expect(extractSeiBaseUrl('http://localhost:3000/sei/controlador.php')).toBe('http://localhost:3000');
    });

    it('de URLs com fragmento (#)', () => {
      expect(extractSeiBaseUrl('https://sei.example.gov.br/sei/teste#section')).toBe('https://sei.example.gov.br');
    });

    it('preservando protocolo (http vs https)', () => {
      expect(extractSeiBaseUrl('https://sei.example.gov.br/sei/')).toBe('https://sei.example.gov.br');
      expect(extractSeiBaseUrl('http://sei.example.gov.br/sei/')).toBe('http://sei.example.gov.br');
    });

    it('de URLs com subdomínios', () => {
      expect(extractSeiBaseUrl('https://sei.sub.example.gov.br/sei/teste')).toBe('https://sei.sub.example.gov.br');
      expect(extractSeiBaseUrl('https://app.sei.example.gov.br/sei/')).toBe('https://app.sei.example.gov.br');
    });
  });

  describe('deve retornar null para URLs inválidas', () => {
    it('strings vazias ou inválidas', () => {
      expect(extractSeiBaseUrl('')).toBe(null);
      expect(extractSeiBaseUrl('not-a-url')).toBe(null);
      expect(extractSeiBaseUrl('just text')).toBe(null);
    });

    it('aceita qualquer protocolo válido (não valida http/https)', () => {
      // Nota: A função não valida protocolo, apenas extrai a base de qualquer URL válida
      expect(extractSeiBaseUrl('ftp://sei.example.gov.br/sei/')).toBe('ftp://sei.example.gov.br');
    });
  });

  describe('edge cases', () => {
    it('URL apenas com domínio (sem path)', () => {
      expect(extractSeiBaseUrl('https://sei.example.gov.br')).toBe('https://sei.example.gov.br');
      expect(extractSeiBaseUrl('https://sei.example.gov.br/')).toBe('https://sei.example.gov.br');
    });

    it('URL com user info', () => {
      expect(extractSeiBaseUrl('https://user:pass@sei.example.gov.br/sei/teste')).toBe('https://sei.example.gov.br');
    });

    it('localhost e IPs', () => {
      expect(extractSeiBaseUrl('http://localhost/sei/teste')).toBe('http://localhost');
      expect(extractSeiBaseUrl('http://127.0.0.1/sei/controlador.php')).toBe('http://127.0.0.1');
      expect(extractSeiBaseUrl('http://192.168.1.100:8080/sei/')).toBe('http://192.168.1.100:8080');
    });
  });

  describe('casos práticos reais', () => {
    it('URLs do SEI do TRF1', () => {
      const url = 'https://sei.trf1.jus.br/sei/controlador.php?acao=procedimento_controlar';
      expect(extractSeiBaseUrl(url)).toBe('https://sei.trf1.jus.br');
    });

    it('URLs do SEI do CJF', () => {
      const url = 'https://sei.cjf.jus.br/sei/controlador.php?acao=painel_controle_visualizar';
      expect(extractSeiBaseUrl(url)).toBe('https://sei.cjf.jus.br');
    });

    it('URLs do SEI do Governo Federal', () => {
      const url = 'https://sei.economia.gov.br/sei/controlador.php';
      expect(extractSeiBaseUrl(url)).toBe('https://sei.economia.gov.br');
    });
  });
});

describe('extractCurrentArea', () => {
  beforeEach(() => {
    // Cria um DOM limpo para cada teste
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Limpa o DOM após cada teste
    document.body.innerHTML = '';
  });

  describe('deve extrair a área do elemento lnkInfraUnidade', () => {
    it('quando há texto no link', () => {
      document.body.innerHTML = '<a id="lnkInfraUnidade">SESINF</a>';
      expect(extractCurrentArea()).toBe('SESINF');
    });

    it('quando há texto no atributo title', () => {
      document.body.innerHTML = '<a id="lnkInfraUnidade" title="Seção de Suporte à Infraestrutura"></a>';
      expect(extractCurrentArea()).toBe('Seção de Suporte à Infraestrutura');
    });

    it('preferindo texto do link sobre title', () => {
      document.body.innerHTML = '<a id="lnkInfraUnidade" title="Nome Completo">SESINF</a>';
      expect(extractCurrentArea()).toBe('SESINF');
    });

    it('normalizando espaços múltiplos', () => {
      document.body.innerHTML = '<a id="lnkInfraUnidade">  Seção  de   Suporte  </a>';
      expect(extractCurrentArea()).toBe('Seção de Suporte');
    });

    it('limitando tamanho a 120 caracteres', () => {
      const longText = 'A'.repeat(150);
      document.body.innerHTML = `<a id="lnkInfraUnidade">${longText}</a>`;
      expect(extractCurrentArea()?.length).toBe(120);
    });
  });

  describe('deve usar heurísticas alternativas quando lnkInfraUnidade não existe', () => {
    it('buscando por classe infraAcaoBarraConjugada com title', () => {
      document.body.innerHTML = '<a class="infraAcaoBarraConjugada" title="Seção Administrativa">Link</a>';
      expect(extractCurrentArea()).toBe('Seção Administrativa');
    });

    it('buscando por elementos com id contendo "Unidade"', () => {
      document.body.innerHTML = '<div id="divInfraUnidade" title="Departamento Fiscal">Teste</div>';
      expect(extractCurrentArea()).toBe('Departamento Fiscal');
    });
  });

  describe('deve retornar null quando não encontrar informação', () => {
    it('quando DOM está vazio', () => {
      expect(extractCurrentArea()).toBe(null);
    });

    it('quando elementos existem mas não têm texto/title', () => {
      document.body.innerHTML = '<a id="lnkInfraUnidade"></a>';
      expect(extractCurrentArea()).toBe(null);
    });

    it('ignorando títulos vazios', () => {
      document.body.innerHTML = '<a class="infraAcaoBarraConjugada" title="">Link</a>';
      expect(extractCurrentArea()).toBe(null);
    });

    it('truncando títulos muito longos (>120 chars)', () => {
      const veryLongText = 'A'.repeat(121);
      document.body.innerHTML = `<a class="infraAcaoBarraConjugada" title="${veryLongText}">Link</a>`;
      // Deve ser truncado para 120 caracteres
      expect(extractCurrentArea()?.length).toBe(120);
    });
  });

  describe('casos práticos do SEI', () => {
    it('estrutura HTML real do CJF (versão desktop)', () => {
      document.body.innerHTML = `
        <div id="divInfraBarraSistemaPadraoD">
          <a id="lnkInfraUnidade" href="#" 
             class="form-control infraAcaoBarraConjugada" 
             title="Seção de Suporte à Infraestrutura" 
             tabindex="54">SESINF</a>
        </div>
      `;
      expect(extractCurrentArea()).toBe('SESINF');
    });

    it('estrutura HTML real do CJF (versão mobile)', () => {
      document.body.innerHTML = `
        <div id="divInfraBarraSistemaMovel">
          <a id="lnkInfraUnidade" href="#" 
             class="form-control infraAcaoBarraConjugada" 
             title="Seção de Suporte à Infraestrutura" 
             tabindex="66">SESINF</a>
        </div>
      `;
      expect(extractCurrentArea()).toBe('SESINF');
    });

    it('siglas comuns de setores', () => {
      const siglas = ['SESINF', 'DIPRO', 'COJEF', 'GABIN', 'SECEX'];
      siglas.forEach(sigla => {
        document.body.innerHTML = `<a id="lnkInfraUnidade">${sigla}</a>`;
        expect(extractCurrentArea()).toBe(sigla);
      });
    });

    it('nomes completos de setores', () => {
      const nomes = [
        'Seção de Tecnologia da Informação',
        'Departamento de Recursos Humanos',
        'Coordenadoria de Gestão Administrativa'
      ];
      nomes.forEach(nome => {
        document.body.innerHTML = `<a id="lnkInfraUnidade" title="${nome}">SIGLA</a>`;
        expect(extractCurrentArea()).toBe('SIGLA');
      });
    });
  });
});

describe('extractCurrentUser', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('extrai do atributo title antes do parênteses', () => {
    document.body.innerHTML = `
      <a id="lnkUsuarioSistema" title="Ricardo Bernardes dos Santos (ricardo.santos/CJF)">Qualquer</a>
    `;
    expect(extractCurrentUser()).toBe('Ricardo Bernardes dos Santos');
  });

  it('quando title não tem parênteses, retorna título completo normalizado', () => {
    document.body.innerHTML = `
      <a id="lnkUsuarioSistema" title="Maria  da   Silva">Qualquer</a>
    `;
    expect(extractCurrentUser()).toBe('Maria da Silva');
  });

  it('fallback para textContent quando não há title', () => {
    document.body.innerHTML = `
      <a id="lnkUsuarioSistema">  João   P.  Souza! </a>
    `;
    // Pontuação deve ser removida por normalizeUserText
    expect(extractCurrentUser()).toBe('João P Souza');
  });

  it('retorna null quando elemento não existe', () => {
    expect(extractCurrentUser()).toBe(null);
  });
});
