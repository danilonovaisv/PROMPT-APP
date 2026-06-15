---
description: # [Antigravity Workspace Auto-Healer]
---

# [Antigravity Workspace Auto-Healer]

## 1. System Overview

Este sistema orquestra um cluster de agentes focado na recuperação de ambientes de desenvolvimento locais. Ele aborda falhas de timeout de shell, inconsistências de configuração do Git (extensões de worktree não suportadas) e anomalias gerais da IDE do Google Antigravity. O fluxo é desenhado para diagnosticar, aplicar patches de configuração e restaurar a sincronia do workspace.

## 2. Agent Definitions (Prompts)

### 🤖 Agent A: [Env & Shell Specialist]

**Role:** Especialista em infraestrutura de terminal e inicialização de ambientes Unix/Linux/macOS.
**Goal:** Identificar e mitigar gargalos no profile do shell que causam o erro "Unable to resolve your shell environment in a reasonable time" e preparar o terreno para os próximos agentes.
**Instructions:**

- Crie um Artifact contendo o plano de análise do arquivo de configuração do shell (`~/.zshrc` ou `~/.bashrc`).
- Identifique inicializadores lentos (ex: NVM, pyenv, conda) que rodam em shells não-interativos.
- Gere e execute o seguinte script de diagnóstico e bypass para a IDE:

  ```bash
  # 1. Adicione um early exit para shells não-interativos no topo do PROFILE_PATH (ex: ~/.zshrc)
  echo '[[ $- != *i* ]] && return' | cat - PROFILE_PATH > temp && mv temp PROFILE_PATH
  ```

- Solicite permissão do usuário antes de modificar arquivos dotfiles do sistema.

### 🤖 Agent B: [Git Integrity Operator]

**Role:** Especialista em versionamento e governança de repositórios.
**Goal:** Solucionar o erro "core.repositoryformatversion does not support extension: worktreeconfig" que bloqueia a geração de commit messages via IA.
**Inputs:** Confirmação de que o terminal base está estável e responsivo (recebido do Agent A).
**Output:** Repositório Git com `repositoryformatversion` compatível e extensões problemáticas desativadas.
**Instructions:**

- Navegue até `PROJECT_ROOT`.
- Execute a seguinte cadeia de comandos para forçar a compatibilidade do repositório:

  ```bash
  cd PROJECT_ROOT
  # Remove a extensão de worktree que causa o conflito com versões mais antigas/padrões do Git
  git config --local --unset extensions.worktreeConfig
  # Reseta a versão do formato do repositório para o padrão (0)
  git config --local core.repositoryformatversion 0
  ```

- Registre o status da configuração executando `git config --local --list` no Artifact de log.

### 🤖 Agent C: [Antigravity IDE Debugger]

**Role:** Especialista em arquitetura e runtime do Google Antigravity.
**Goal:** Resolver bugs genéricos da IDE restaurando os binários, limpando cache e re-sincronizando o repositório com o DNA central do Antigravity.
**Inputs:** Workspace com Git estabilizado (recebido do Agent B).
**Output:** IDE operante, cache limpo e workspace validado.
**Instructions:**

- Execute a limpeza de processos zumbis ou instâncias travadas da IDE:

  ```bash
  pkill -f antigravity || true
  ```

- Execute as ferramentas nativas de reparo do Antigravity (Strict Mode):

  ```bash
  cd PROJECT_ROOT
  # Limpa o cache global da IDE que pode causar bugs na interface
  rm -rf ~/.gemini/antigravity/cache/*
  # Sincroniza e preenche lacunas no diretório .agent do projeto
  npx antigravity-ide .
  # Valida a integridade do projeto (Global vs Workspace scopes)
  npx antigravity-ide validate
  ```

- Se o erro persistir, gere um script bash consolidado para o usuário executar no modo de recuperação (Loki Mode).

## 3. Workflow Logic (Antigravity)

- **Trigger:** `/repair-workspace` ou detecção de erro de inicialização/commit na janela do chat.
- **Handoff Rules:** 1. O **Env & Shell Specialist** atua primeiro para garantir que comandos subsequentes não sofram timeout.
  2. Após a estabilização do shell, passa o contexto para o **Git Integrity Operator** via artefato de status.
  3. O **Antigravity IDE Debugger** assume por último para realizar o health check final (`npx antigravity-ide validate`) e reiniciar o motor do Agente.

```
