---
description: # Fluxo de auditoria remota via squirrelscan e correção automatizada no repositório local do PROMPT-APP.
---

---

name: squirrel-audit-fix
description: Fluxo de auditoria remota via squirrelscan e correção automatizada no repositório local do PROMPT-APP
---

# Workflow: PROMPT-APP Remote Audit & Local Fix

## Preconditions

- O repositório local deve estar limpo (`git status` sem alterações pendentes) e sincronizado com a produção.
- CLI `squirrelscan` acessível no PATH.
- Skill carregada de `.agents/skills/audit-website`.

## Execution Steps

### Phase 1: Recon & Audit (Strict Execution)

1. Invoque a skill `audit-website` mirando estritamente a URL de produção:
   `/audit-website https://prompt-app-dan.netlify.app/`
2. Gere um relatório estruturado focando apenas em erros de severidade HIGH e MEDIUM. Ignore warnings visuais triviais nesta passagem.

### Phase 2: Plan Mode (Cognitive Mapping)

1. **CRÍTICO**: Entre em `Plan Mode`. NÃO escreva código ainda.
2. Analise o output do `squirrelscan`.
3. Faça o mapeamento reverso: Para cada erro encontrado no DOM de produção, utilize `grep` ou busca semântica para localizar o arquivo exato correspondente no diretório `src/` (ex: componentes React, arquivos de roteamento, arquivos CSS/Tailwind).
4. Crie um `docs/AUDIT_PLAN.md` contendo:
   - O erro original.
   - O arquivo local alvo da correção.
   - A estratégia de refatoração.

### Phase 3: Parallel Subagent Delegation

Prossiga para a implementação instanciando subagentes paralelos por domínio para evitar poluição de contexto:

- **Subagent A (Acessibilidade & UI)**: Corrija tags ARIA, contrastes e problemas de DOM semântico.
- **Subagent B (SEO & Meta)**: Resolva tags ausentes, hierarquia de cabeçalhos (H1-H6) e Open Graph.
- **Subagent C (Performance)**: Aplique lazy loading, otimização de imagens ou deduplicação de dependências apontadas pelo relatório.

### Phase 4: Validation & Rollback Gate

1. Após a conclusão dos subagentes, execute a suíte de lint e o build local do projeto (`npm run build` ou equivalente).
2. Se o build quebrar, reverta as alterações (`git restore .`) e sinalize falha.
3. Se passar, consolide as mudanças em um commit com a tag `chore(audit): squirrelscan fixes applied`.
