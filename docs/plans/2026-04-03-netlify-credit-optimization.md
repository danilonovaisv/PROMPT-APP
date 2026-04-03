# Netlify Credit Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduzir consumo de créditos Netlify com configuração de build enxuta, gatilhos controlados e auditoria automatizada.

**Architecture:** Ajustar `netlify.toml` para SPA Vite + React com cache e skip de processamento, adicionar workflow dedicado para deploy em branch principal com concurrency e path filters, e criar script Bash para auditoria operacional via API/CLI Netlify.

**Tech Stack:** Vite, React, pnpm, GitHub Actions, Netlify API, Bash.

---

### Task 1: Diagnóstico de stack

**Files:**
- Modify: `package.json`
- Modify: `netlify.toml`

**Step 1:** Verificar framework, scripts e package manager.

**Step 2:** Confirmar pasta de saída de build (`dist`).

**Step 3:** Definir comandos de build/deploy aderentes ao stack detectado.

### Task 2: Reescrever configuração Netlify

**Files:**
- Modify: `netlify.toml`

**Step 1:** Configurar `build.command`, `build.publish`, ambiente e `ignore`.

**Step 2:** Configurar cache headers para assets estáticos e HTML.

**Step 3:** Configurar `skip_processing`, redirects e functions.

### Task 3: Pipeline GitHub Actions de deploy

**Files:**
- Create: `.github/workflows/deploy-netlify.yml`

**Step 1:** Criar trigger apenas para `main`/`master` com `paths-ignore`.

**Step 2:** Adicionar setup de Node + pnpm cache.

**Step 3:** Adicionar deploy com `nwtgck/actions-netlify@v3`, timeout e fallback.

### Task 4: Script de auditoria de uso Netlify

**Files:**
- Create: `scripts/netlify-audit.sh`

**Step 1:** Validar variáveis obrigatórias (`NETLIFY_TOKEN`, `TEAM_ID`).

**Step 2:** Coletar sites da equipe e classificar inativos/duplicados.

**Step 3:** Opcionalmente pausar builds de branches secundárias.

**Step 4:** Gerar relatório JSON consolidado.

### Task 5: Revisão de qualidade

**Files:**
- Modify: `netlify.toml`
- Create: `.github/workflows/deploy-netlify.yml`
- Create: `scripts/netlify-audit.sh`

**Step 1:** Revisar diff para segurança e consistência.

**Step 2:** Validar sintaxe básica dos arquivos.

**Step 3:** Commit com mensagem objetiva.
