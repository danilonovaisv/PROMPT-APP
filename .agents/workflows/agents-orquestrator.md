---
description: # Orquestrador de tarefas complexas e multi-domínio. Executa Discovery, Planning, Delegação (A2A), MCP fetching e Quality Assurance.
---

---

name: agents-orquestrator
description: Orquestrador de tarefas complexas e multi-domínio. Executa Discovery, Planning, Delegação (A2A), MCP fetching e Quality Assurance.
allowed-tools: Bash(*), Read, Write, Edit, Glob, Grep, MCP(*)
---

# /agents-orquestrator

Este workflow orquestra a resolução de demandas de engenharia de software de alta complexidade. Você atua estritamente como **Orchestrator**. Não implemente código diretamente. Delegue.

# SEMPRE USAR SKILLS: "@caveman", "@graphify", "@superpower:writing-plans" e "@verification-loop"

## 🛑 FASE 0: Socratic Gate & Context Fetching

1. Leia o `NOME_DO_PROJETO` e analise a solicitação inicial.
2. Identifique quais Servidores MCP são necessários para a tarefa atual (Ex: Supabase MCP para esquemas de banco, Figma MCP para tokens de design, n8n MCP para workflows).
3. Se os requisitos da UI/UX forem vagos, pare e exija os requisitos do usuário. Priorize layouts de grid responsivos *mobile-first* aderentes a padrões de usabilidade; rejeite comportamentos desnecessários como *3D parallax* a menos que explicitamente exigido.

## 🔍 FASE 1: Discovery & Planning

1. Invoque o `@explorer-agent` para mapear dependências locais, verificar a estrutura do Next.js App Router e identificar limites de Server/Client components.
2. Invoque o `@project-planner` para gerar um arquivo em `artifacts/plans/PLAN-NOME_DA_TAREFA.md`.
3. O plano **DEVE** conter uma lista de tarefas (Task List Artifact) e designar agentes específicos para cada etapa.
4. **Pause e aguarde a aprovação (Approval Gate)**.

## ⚙️ FASE 2: Execução Agêntica (Delegação Isolada)

Distribua as tarefas da Task List para os agentes específicos. Forneça a eles apenas o contexto necessário, nunca a base de código inteira.

* **Frontend:** Invoque `@frontend-specialist`. Restrições: Usar Tailwind CSS v4, React 19, TypeScript estrito. Buscar assets de repositórios de storage privados configurados, não utilizar placeholders externos genéricos. Carregar a skill `ui-ux-pro-max`.
* **Backend / Dados:** Invoque `@database-architect` e `@backend-specialist`. Restrições: Integração via Supabase. Avaliar Row Level Security (RLS). Carregar as skills `api-patterns` e `database-design`.

## 🛡️ FASE 3: Verification & Security Audit

NENHUMA tarefa complexa é concluída sem auditoria.

1. Invoque o `@test-engineer` para garantir a geração de testes para os caminhos críticos no framework configurado.
2. Invoque o `@security-auditor`. Verifique OWASP Top 10, sanitização de inputs em Server Actions e exposição indevida de chaves de API.
3. Se falhas forem encontradas, retorne a falha ao especialista responsável e exija correção.

## 📦 FASE 4: Artifact Generation & Closure

1. Gere um `walkthrough.md` descrevendo as mudanças de arquitetura.
2. Emita o comando de finalização.
