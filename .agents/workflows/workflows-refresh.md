---
description: # Prompt para Refatoração de Workflows no Antigravity
---

**Diretiva Principal:**
Você é um Arquiteto de Software e Engenheiro de Plataforma especialista no ecossistema Google Antigravity e na metodologia Spec-Driven Development (SDD). Sua missão é realizar uma auditoria completa nos workflows atuais deste projeto (localizados em `.agents/workflows/`) e refatorá-los para garantir que estejam otimizados, seguros e perfeitamente alinhados com as melhores práticas da plataforma e com a nossa stack tecnológica (Next.js App Router, React Three Fiber, Tailwind CSS e Supabase/Firebase).

**PASSO 1: Leitura de Contexto e Descoberta**

1. Leia a Constituição do projeto e o contexto de arquitetura (se existirem) nos diretórios `.agents/rules/` (como `project-context.md` ou `constitution.md`) e no diretório `.specify/memory/constitution.md` para entender as regras de negócios e padrões de codificação da stack atual.
2. Liste e leia o conteúdo de todos os arquivos Markdown presentes no diretório `.agents/workflows/` e também analise os scripts nas skills locais `.agents/skills/`.

**PASSO 2: Auditoria dos Workflows Atuais**
Analise criticamente cada workflow encontrado com base nos seguintes critérios obrigatórios do Antigravity:

- **Estrutura Básica:** O workflow possui o _frontmatter_ YAML obrigatório no topo contendo a propriedade `description:`?
- **Passos Acionáveis:** O workflow está estruturado em uma lista numerada passo a passo (ex: 1., 2., 3.)?
- **Automação de Terminal:** Os comandos de terminal seguros (como npm install, lint, type check) utilizam o marcador `// turbo` antes do comando para permitir auto-execução quando aplicável?
- **Especificidade da Stack:** Os workflows de testes, build ou otimização fazem sentido para Next.js 15+ e WebGL (React Three Fiber)? Por exemplo, os workflows consideram a validação de Core Web Vitals, testes de hidratação ou otimização de bundle?
- **Uso de MCPs e Sub-rotinas:** O workflow sugere a chamada de ferramentas do Model Context Protocol (MCP) relevantes (ex: MCP de Banco de Dados para Supabase, ou MCP de Chrome DevTools) ou a chamada de outros fluxos internos com `/nome-do-workflow`?

**PASSO 3: Refatoração e Implementação**
Para cada workflow que apresentar falhas, desatualização ou falta de contexto:

1. **Reescreva o arquivo `.md`** correspondente dentro de `.agents/workflows/`.
2. Adicione descrições precisas no _frontmatter_ YAML que orientem outros agentes sobre quando utilizar esse fluxo.
3. Insira referências explícitas usando `@nome-do-arquivo` ou `@pasta/` sempre que o workflow precisar que o agente consulte um contexto específico (ex: `@src/app` para roteamento, ou `@components/3d` para arquivos WebGL).
4. Crie novos workflows complementares caso você perceba lacunas (exemplo: se não houver um workflow de validação pré-commit ou auditoria de performance WebGL, crie um novo chamado `.agents/workflows/pre-flight-check.md`).

**ENTREGÁVEIS:**

1. Atualização direta dos arquivos em `.agents/workflows/`.
2. Ao final, apresente um **Walkthrough** ou **Implementation Plan** no chat resumindo:
   - Quais workflows foram corrigidos.
   - Quais erros de estruturação (como falta de YAML ou comandos `// turbo`) foram resolvidos.
   - Quais novos fluxos foram criados para melhor atender ao projeto.
