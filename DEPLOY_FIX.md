# Deploy Fix — Correção de Auto-Deploy Descontrolado no Netlify

**Data:** 2026-04-15
**Site ID:** `2628e92e-47d5-40bb-abaa-be25612b2d56`
**Branch:** `claude/fix-netlify-auto-deploy-kQmhS`

---

## 1. Causa Raiz

Foram identificadas **três fontes simultâneas de deploy** em cada push para `main`:

1. **Netlify GitHub App** — auto-publish nativo (via integração oficial).
2. **`.github/workflows/deploy-netlify.yml`** — deploy em produção via `nwtgck/actions-netlify@v3`.
3. **`.github/workflows/ci-cd.yml`** (jobs `deploy-preview` + `deploy-production`) — deploy via `netlify/actions/cli`.

Resultado: **3× build** + **3× bandwidth** por push. Cota de plano esgotada → site pausado com
a mensagem _"This site was paused as it reached its usage limits"_.

A regra `ignore` do `netlify.toml` só funciona no fluxo #1. Os fluxos #2 e #3 fazem build
direto no runner do GitHub Actions e depois enviam o `dist/` pronto via API, ignorando
totalmente a regra.

---

## 2. Correções Aplicadas no Repositório

| Arquivo | Alteração |
|---|---|
| `.github/workflows/deploy-netlify.yml` | Removido gatilho `on: push`. Agora é **exclusivamente manual** (`workflow_dispatch`). |
| `.github/workflows/ci-cd.yml` | Removidos jobs `deploy-preview` e `deploy-production`. Mantido apenas `quality-check` (tsc + tests + build + codecov). |
| `netlify.toml` | Regra `ignore` reforçada: pula build quando o diff só altera `docs/`, `tests/`, `.github/`, `.md`, `.lock`, `logs/`, `scripts/`, `customization/`, `backup-superpower/`, etc. |
| `netlify.toml` | Adicionadas seções `[context.production]`, `[context.deploy-preview]`, `[context.branch-deploy]` para documentar que previews e branch deploys devem ser desligados no painel. |

Com estas mudanças, **o único deploy automático remanescente é o nativo do Netlify**
(fluxo #1), que agora respeita a regra `ignore` do `netlify.toml`.

---

## 3. Ações Manuais Necessárias no Painel Netlify

> **IMPORTANTE:** Estas ações **não podem ser feitas via commit/PR**. Execute-as no
> painel web ou via `netlify` CLI autenticado.

Acesse: `https://app.netlify.com/sites/<seu-site>/settings/deploys`

### 3.1. Reativar o site (após o pause)

1. Verifique em **Billing** → se atingiu o limite do plano Free/Starter, aguarde o próximo
   ciclo de faturamento OU faça upgrade temporário.
2. Se o plano permite, clique em **Resume builds** no topo da página.

### 3.2. Desabilitar Deploy Previews de Pull Requests

**Site configuration → Build & deploy → Continuous deployment → Deploy Previews**

- Altere para: **"None. Deploy previews are disabled."**
- Motivo: cada PR gerava 1 build extra via `ci-cd.yml` + 1 build via Netlify nativo = 2 builds/PR.

### 3.3. Desabilitar Branch Deploys

**Site configuration → Build & deploy → Continuous deployment → Branch deploys**

- Altere para: **"None. Only production branch deploys."**
- Motivo: evita deploys de branches `claude/*`, `develop`, `feature/*` etc.

### 3.4. Confirmar Production Branch

**Site configuration → Build & deploy → Continuous deployment → Production branch**

- Defina: `main`
- Não usar `master` (legado).

### 3.5. Revisar Build Hooks

**Site configuration → Build & deploy → Build hooks**

- Liste todos os hooks existentes.
- **Delete qualquer build hook não usado** — eles disparam builds quando acionados por
  serviços externos (ex.: CMS, cron) e podem estar causando builds inesperados.

### 3.6. (Opcional, recomendado) Limitar Build Minutes

**Team settings → Usage → Build minutes**

- Configure **alertas** para 50%, 75% e 90% da cota.
- Se suportado pelo plano, defina um **hard cap** para pausar builds automaticamente ao
  atingir o limite.

### 3.7. Verificar GitHub App Permissions

**Site configuration → Build & deploy → Continuous deployment → GitHub App**

- Confirme que a instalação do Netlify GitHub App está ativa apenas no repositório
  `danilonovaisv/prompt-app`, não em toda a organização.

---

## 4. Script de Auditoria

O repositório já possui `scripts/netlify-audit.sh` para auditoria via API. Para usar:

```bash
export NETLIFY_TOKEN="<seu-personal-access-token>"
export TEAM_ID="<seu-team-id>"
./scripts/netlify-audit.sh
```

O relatório é salvo em `reports/netlify-audit-*.json` e inclui:
- Sites inativos (candidatos a arquivamento)
- Sites duplicados
- Build minutes aproximados dos últimos 100 builds
- Bandwidth aproximado

Para **pausar builds automáticos em todos os sites** de uma vez (use com cautela):

```bash
AUTO_DISABLE_BRANCH_BUILDS=true ./scripts/netlify-audit.sh
```

---

## 5. Fluxo de Deploy Pós-Correção

```
Push em main
    │
    ├─> GitHub Actions: quality-check (tsc + tests + build + codecov)
    │       └─> NÃO faz deploy. Apenas valida o build.
    │
    └─> Netlify GitHub App (auto-publish nativo)
            │
            ├─> Lê netlify.toml → aplica regra ignore
            │       └─> Se diff irrelevante: pula build (0 minutos consumidos)
            │
            └─> Se diff relevante: executa build + deploy prod
                    └─> 1 único deploy, sem concorrência.
```

### Deploy de Emergência (manual)

Caso o auto-publish do Netlify esteja desativado ou com problema:

1. Vá em **GitHub → Actions → Deploy Netlify (Manual) → Run workflow**.
2. Escolha a branch e selecione `production: true` (ou `false` para draft).
3. Execute.

---

## 6. Checklist de Validação

Após aplicar as mudanças do repositório **e** as ações manuais do item 3:

- [ ] Site reativado no Netlify (não mais pausado).
- [ ] Deploy Previews = None.
- [ ] Branch Deploys = None.
- [ ] Production Branch = `main`.
- [ ] Build hooks desnecessários removidos.
- [ ] Alertas de uso configurados.
- [ ] Push de teste em `main` alterando apenas `README.md` → **não deve disparar build**
      (regra ignore deve pular).
- [ ] Push de teste em `main` alterando `src/App.tsx` → **deve disparar exatamente 1 build**
      (somente o nativo do Netlify).
- [ ] Aba GitHub Actions após o push → apenas job `quality-check`, sem job de deploy.

---

## 7. Rollback

Se algo der errado após o merge deste PR:

```bash
git revert <commit-hash-do-merge>
git push origin main
```

Ou, para restaurar apenas os workflows antigos:

```bash
git checkout main~1 -- .github/workflows/deploy-netlify.yml .github/workflows/ci-cd.yml
git commit -m "revert: restaurar workflows anteriores"
git push origin main
```
