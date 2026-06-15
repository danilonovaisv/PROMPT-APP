---
description: # WORKFLOW DE ALINHAMENTO E CALIBRAGEM DE CONTEXTO - PPT-CREATOR
---

# 🔄 WORKFLOW: Calibragem e Validação de Contexto (Project Boot)

**Gatilho:** `/calibrate` ou `init_session`
**Agentes Responsáveis:** `@router-orchestrator` (The Commander), `@narrative-architect` (Writer), `@creative-visual-specialist` (Designer), `@gas-automation-worker` (Coder)

**USE AS SKILLS** "/.agents/skills/architect-first", "/.agents/skills/file-organizer", "/.agents/skills/templates", "/.agents/skills/scientific-slides", "/.agents/skills/checklist-runner", "/.agents/skills/using-superpowers/superpower:write-plans", "/.agents/skills/caveman" e "/.agents/skills/graphify"

## 1. Setup & Context

- **MCP Required:** `context7` (para documentação de APIs do Slides/Apps Script), `gas-fakes` (para emulador local de testes).
- **Context:** Inicialização rigorosa do ambiente Antigravity. Deve validar a estrutura física do PPT-CREATOR, carregar regras de negócio da pasta `.context/` e confirmar a disponibilidade dos adaptadores e workers.

## 2. Steps (Skill-Based Execution)

### Step 1: Injeção de Contexto e Regras (Deep Read)

**Goal:** Carregar as "Leis" do projeto antes de qualquer execução.

- **Instruction:** Carregar e memorizar o conteúdo crítico dos seguintes caminhos:
  1. `.context/DESIGN.md` (Governança estética e paletas de cores oficiais).
  2. `.context/KNOWLEDGE-BASE.md` (Repositório de conhecimento).
  3. `AGENTS.md` (Constituição e schemas de dados InputPresentationRequest/OutputPresentationArtifact).
  4. `mission.md` (Objetivos atuais).
- **Validation:** Confirme se os arquivos existem. Se faltar algum, pare e reporte.
- **Skill:** `use a skill skill-context-optimization` (ou leitura direta via MCP/filesystem).

### Step 2: Validação Estrutural (Path Integrity)

**Goal:** Verificar se os Agentes e Workflows estão nos caminhos corretos.

- **Instruction:** Liste e ative os arquivos nos diretórios para confirmar onde a arquitetura está instalada:
  - Verificar e ativar existência de `.agent/agents/` ou `.agents/agents/`.
  - Verificar e ativar existência de `.agent/workflows/` ou `.agents/workflows/`.
  - Validar as configurações do `AGENTS.md` e `GEMINI.md` e todos os caminhos encontrados.
- **Critical Check:** Se houver duplicidade de pastas, sugira uma consolidação ou utilize a configurada em `GEMINI.md` (`.agent/`).
- **Skill:** `use a skill skill-file-system-navigation`.

### Step 3: Stack & MCP Health Check

**Goal:** Garantir que o ambiente técnico suporta o projeto (Node.js + Express + Clasp + gas-fakes + Python).

- **Instruction:**
  1. Leia `package.json` e valide dependências críticas: `@mcpher/gas-fakes`, `@modelcontextprotocol/sdk`, `express`, `zod`.
  2. Teste a conexão com MCPs configurados:
     - **Context7 MCP**: Buscar documentação de `SlidesApp` ou similar.
     - **gas-fakes MCP**: Emular execução do script local.
- **Skill:** `use a skill skill-concise-planning`.

### Step 4: Endpoint and Tools Mapping

**Goal:** Entender a estrutura de scripts utilitários e APIs serverless.

- **Instruction:**
  1. Mapeie os scripts utilitários da pasta `src/tools/` (ex: `audit_roteiro.py`, `build_deck_package.py`, `generate_images.ts`, `deploy_google_slides.ts`).
  2. Mapeie os endpoints serverless da pasta `api/` (ex: `api/health.js`, `api/diagnostics.js`, `api/transcribe-video.js`).
- **Skill:** `use a skill skill-file-system-navigation`.

### Step 5: Teste de Sanidade (Self-Correction)

**Goal:** Simular micro-tarefa para garantir que o LLM está seguindo as convenções de commits e codificação.

- **Instruction:** Gere internamente (sem salvar) um exemplo de *Commit Message* para uma alteração fictícia no emulador GAS, seguindo estritamente as convenções do `AGENTS.md`:
  - Ex: `feat(gas): optimize slides text formatting [Story 1.2]`
- **Validation:** Se o commit não seguir o padrão, falhe a calibração.
- **Skill:** `use a skill skill-commit`.

## 3. Completion Protocol

- **Validation:** `use a skill skill-verification-before-completion`
- **Output:** Gere um relatório de calibragem Markdown no formato especificado.

---

### 🏁 RELATÓRIO DE CALIBRAGEM (Output Template)

**🟢 SISTEMA ANTIGRAVITY: ONLINE**

| Módulo | Status | Detalhes |
| :--- | :--- | :--- |
| **Contexto** | [Status] | `DESIGN.md`, `KNOWLEDGE-BASE.md`, `AGENTS.md`, `mission.md` lidos. |
| **Arquitetura** | [Status] | Agentes e workflows encontrados em: `[Caminhos]` |
| **Engine** | [Status] | Node [Ver] + Express [Ver] + Python [Ver] |
| **MCPs** | [Status] | Context7: [OK/Fail] \| gas-fakes: [OK/Fail] |
| **Endpoints & Tools** | [Status] | Mapeados scripts de build, audit, images, deploy e Vercel APIs. |

**Próxima Ação Recomendada:** [Inserir próxima tarefa prioritária baseada no `mission.md`]
