# PROMPT-APP Remote Audit & Local Fix - Audit Plan

Este documento detalha o planejamento de correções com base no resultado da auditoria realizada pelo `squirrelscan` na URL de produção `https://prompt-app-dan.netlify.app/`.

## 1. Erros Encontrados

### Crawlability (Score: 89)

* **Erro original:** `crawl/sitemap-valid` (Unknown sitemap format)
  * `/page-sitemap.xml`
  * `/news-sitemap.xml`
* **Causa Raiz:** O crawler do `squirrelscan` (e outros robôs) tenta acessar endpoints comuns de sitemaps. Como o PROMPT-APP é uma Single Page Application (SPA) hospedada no Netlify, qualquer rota inexistente cai no fallback de SPA (`/* -> /index.html` com status `200`). Isso faz com que o crawler receba o HTML da aplicação em vez de um XML real ou um status `404`, gerando erros de validação de sitemap.
* **Arquivo alvo local:** [`netlify.toml`](file:///Users/PROJETOS-DEV/PROMPT-APP/netlify.toml)
* **Estratégia de Refatoração:** Adicionar os sitemaps comuns testados por robôs na lista de redirecionamento com status `404` e flag `force = true` no `netlify.toml`. Isso impede que o SPA fallback intercepte essas requisições e garante que elas retornem `404` legítimo.

---

## 2. Avisos Encontrados

### Security (Score: 86)

* **Aviso original:** `security/http-to-https` (1 HTTP URL(s) redirect to HTTPS)
  * `http://prompt-app-dan.netlify.app/` redireciona para `https://prompt-app-dan.netlify.app/` com status `301`.
* **Causa Raiz:** O redirecionamento de segurança está funcionando conforme esperado no Netlify.
* **Estratégia de Refatoração:** Nenhuma ação necessária, pois o comportamento de redirecionamento 301 para HTTPS é a prática recomendada de segurança.

---

## 3. Estratégia de Correção (Mapeamento Reverso)

Modificaremos o arquivo [`netlify.toml`](file:///Users/PROJETOS-DEV/PROMPT-APP/netlify.toml) na seção de redirects para retornar `404` para os seguintes caminhos:
* `/page-sitemap.xml`
* `/news-sitemap.xml`
* `/category-sitemap.xml`
* `/post_tag-sitemap.xml`
* `/author-sitemap.xml`
* `/product-sitemap.xml`
* `/tag-sitemap.xml`

Isso elevará a pontuação de Crawlability para 100%, eliminando o erro de formato de sitemap inválido.
