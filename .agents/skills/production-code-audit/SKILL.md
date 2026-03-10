---
name: production-code-audit
description: Realiza uma auditoria profunda de qualidade, segurança e performance no código.
---

# Production Code Audit Skill

## Quando usar

Use esta skill quando o usuário pedir "Audite o projeto", "Verifique erros", "Code Review" ou "Prepare para produção".

## Procedimento de Execução

1. **Análise Estática (Deep Scan):**
    - Leia o `package.json`. Identifique dependências não utilizadas ou obsoletas.
    - Varra a pasta `/src` ou `/app`. Identifique componentes com alta complexidade ciclomática (>10).
    - Verifique acessibilidade (a11y) em todos os arquivos `.tsx` (tags `img` sem `alt`, botões sem labels).

2. **Verificação de Segurança:**
    - Procure por `dangerouslySetInnerHTML` no React.
    - Verifique se há exposição de dados sensíveis no client-side.

3. **Relatório de Saída:**
    - Gere um arquivo `AUDIT_REPORT.md` na raiz.
    - O relatório deve conter uma tabela com 3 colunas: `Arquivo`, `Severidade (Alta/Média/Baixa)`, `Ação Recomendada`.
    - Não corrija nada automaticamente nesta etapa. Aguarde aprovação do relatório.
