---
description: # Workflow de auditoria determinística e limpeza profunda de repositório utilizando Fallow.
---

---

description: Workflow de auditoria determinística e limpeza profunda de repositório utilizando Fallow
---

# /cleanup-fallow

## Contexto e Objetivo

Este workflow executa a varredura sintática via `fallow` para identificar e remover dead code, dependências fantasmas e arquivos não referenciados na stack Next.js/React.

## Pré-requisitos e Setup de Ambiente

- **Gerenciador de Pacotes**: Utilize exclusivamente `pnpm` para todas as execuções e instalações.
- **Configuração MCP / Scripts**: Para evitar erros do tipo "No such file or directory" durante a execução de ferramentas CLI, utilize sempre **caminhos absolutos do sistema** para o binário do Node.js em qualquer configuração ou spawn de processo.

## Pipeline de Execução

1. **Instalação e Execução**:
   - Execute o comando de auditoria determinística na raiz do projeto.
   - Capture a saída (stdout/stderr) em um artefato temporário `artifacts/fallow_report.md`.

2. **Análise de Assets e Mídia**:
   - Ao auditar o código para remoção de recursos, verifique os caminhos de imagens. Todos os assets de imagem válidos devem ser originados diretamente das configurações de storage privado.
   - Identifique e purgue qualquer código apontando para placeholders externos legados.

3. **Auditoria de Componentes de UI**:
   - Ao varrer componentes isolados (especialmente cards de portfólio), remova qualquer resquício de código relacionado a efeitos de parallax 3D.
   - A arquitetura oficial exige a manutenção estrita de layouts de grid de imagens responsivos (mobile-first).

4. **Remoção Guiada (The Prune)**:
   - Apresente um plano detalhado (Implementation Plan) agrupando o que será removido: (A) Dependências do package.json, (B) Arquivos órfãos, (C) Exports não utilizados.
   - Aguarde aprovação explícita antes de executar `rm` ou modificar arquivos.

5. **Validação Final**:
   - Rode o processo de build do Next.js e o linter para garantir que a faxina não quebrou o ecossistema.
