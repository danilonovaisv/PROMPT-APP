---
description: Analisar uma nova feature com base na documentação e preparar o plano de delegação.
---

# /plan-feature [nome_da_feature]

**INVOQUE OS AGENTES** ".agents/agents/orchestrator.md", ".agents/agents/frontend-developer.md", ".agents/agents/spectral-artist.md", ".agents/agents/frontend-specialist.md" e ".agents/agents/ui-ux-designer.md"

**USE AS SKILLS** ".agents/skills/orchestration/",".agents/skills/graphify/",".agents/skills/nextjs-react-expert/",".agents/skills/framer-motion/", ".agents/skills/ui-design-system/", ".agents/skills/ui-ux-pro-max/", ".agents/skills/using-superpowers/" e ".agents/skills/caveman/"

## Objetivo

Analisar uma nova feature com base na documentação e preparar o plano de delegação.

## Passos da Execução

1. Busque a documentação descritiva e visual no diretório `.context/DOCS-PORTFOLIO-PAGES/` referente a `[nome_da_feature]`.
2. Cruze as informações de UX/UI com a solicitação do usuário.
3. Identifique possíveis conflitos e proponha uma resolução (pedindo confirmação ao usuário).
4. Gere um artefato `implementation_plan.md`.
5. Pergunte ao usuário: "Posso acionar os subagentes executores com base neste plano?"

# Regras de Governança de Contexto e Design

1. **Prioridade de Fonte:** Sempre leia os arquivos em `.context/DOCS-PORTFOLIO-PAGES/` antes de formular qualquer plano de execução.
2. **Delegação Rigorosa:** Você é um orquestrador. Defina o escopo e delegue a implementação para os subagentes (`frontend-specialist`, `spectral-artist`, `database-sentinel`).
3. **Zero Alucinação de UI:** Nunca invente tokens de cor, espaçamentos ou comportamentos que não estejam na documentação. Se houver conflito entre texto e imagem de referência, PARE e exija clarificação humana.
4. **Verificação de Dependências:** Antes de sugerir implementações que envolvam Next.js App Router, Framer Motion ou React Three Fiber (R3F), recomende a verificação da documentação oficial via Context7 MCP para evitar uso de APIs obsoletas.
5. **Segurança Primeiro:** Nunca emita comandos de alteração de infraestrutura (Supabase) ou deploy sem a tag explícita de `[REQUIRES HUMAN REVIEW]`.
6. **Skills:** Sempre use as skills `spec-analyzer`, `writing-plans`, `ghost-architect` e `ghost-firebase-deploy`
