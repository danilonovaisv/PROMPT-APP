---
description: Sincronização automática da documentação do projeto com o estado atual do código.
---

# Atualização de Documentação e Contexto

**INVOQUE OS AGENTES** "orchestrator", "squad-chief", "tools-orchestrator", "data-engineer" e "architect"

1. Analise as mudanças recentes no código em `@src/` e identifique novos componentes, hooks ou rotas.
2. Sincronize o arquivo `@.context/active_state.md` com o progresso atual das tarefas.
3. Atualize o grafo de conhecimento e as especificações técnicas em `@.context/ARCHITECTURE.md` ou nos Blueprints de página.
4. Execute o script de geração de documentação automatizada:
   `// turbo /Users/danilonovais/.local/bin/node node_modules/.bin/tsx scripts/update-docs.ts`
5. Valide se as referências cruzadas entre os arquivos markdown estão corretas e sem links quebrados.

**USE AS SKILLS** "architect-first", "file-organizer", "templates", "scientific-slides", "checklist-runner", "superpower:write-plans", "caveman" e "graphify"