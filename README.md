# 🧠 Prompt App

> **Engenharia de Prompts Profissional** — Crie, organize e exporte prompts estruturados para LLMs com menus de contexto hierárquicos e exportação em formato JSON cognitivo.

![Version](https://img.shields.io/badge/version-2.0.0-blueviolet)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)
[![Netlify Status](https://api.netlify.com/api/v1/badges/2628e92e-47d5-40bb-abaa-be25612b2d56/deploy-status)](https://app.netlify.com/projects/prompt-app-dan/deploys)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Tech Stack](#-tech-stack)
- [Funcionalidades](#-funcionalidades)
- [Início Rápido](#-início-rápido)
- [Arquitetura](#-arquitetura)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Guia de Uso](#-guia-de-uso)
- [Schema JSON de Exportação](#-schema-json-de-exportação)
- [Menus de Contexto Hierárquicos](#-menus-de-contexto-hierárquicos)
- [Deploy](#-deploy)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Personalização](#-personalização)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🌐 Visão Geral

O **Prompt App** é uma ferramenta local-first para engenharia de prompts profissional. Ele permite:

- ✅ Criar prompts estruturados com **system role**, **task**, **context**, **constraints** e **negative prompt**
- ✅ Organizar prompts em **categorias** personalizáveis com ícones e cores
- ✅ Configurar **menus de contexto hierárquicos** (Tom, Público, Idioma, Estilo) com sub-opções
- ✅ Exportar em **formato JSON cognitivo** — otimizado para alimentar LLMs
- ✅ Importar/exportar prompts em lote com backup completo
- ✅ Funcionar 100% offline — todos os dados ficam no **IndexedDB** do navegador

---

## ⚡ Tech Stack

| Camada             | Tecnologia                 | Versão |
| :----------------- | :------------------------- | :----- |
| **Framework**      | React                      | 19.x   |
| **Linguagem**      | TypeScript                 | 5.9    |
| **Build Tool**     | Vite                       | 7.3    |
| **Banco de Dados** | IndexedDB (via Dexie.js)   | 4.x    |
| **Roteamento**     | React Router DOM           | 7.x    |
| **Ícones**         | Lucide React               | 0.563+ |
| **Tipografia**     | Inter (Google Fonts)       | —      |
| **Estilização**    | Vanilla CSS (sem Tailwind) | —      |

> **Nota:** Nenhum backend é necessário. Todos os dados são persistidos localmente no navegador via IndexedDB.

---

## ✨ Funcionalidades

### 🏠 Dashboard (Home)

- Visão geral de todas as categorias com contador de prompts
- Cards com ícones e cores personalizáveis
- Navegação rápida para categorias e editor

### 📁 Gerenciador de Categorias

- CRUD completo de categorias
- 32 emojis disponíveis como ícones
- 16 cores na paleta de seleção
- Exclusão com confirmação (remove prompts associados)

### ✏️ Editor de Prompts

O coração da aplicação. Campos disponíveis:

| Campo                 | Descrição                                           |
| :-------------------- | :-------------------------------------------------- |
| **Título**            | Nome identificador do prompt                        |
| **System Role**       | Instrução de personalidade para o LLM               |
| **Tarefa**            | O que o modelo deve fazer                           |
| **Contexto**          | Informações de background relevantes                |
| **Menus de Contexto** | Seleção hierárquica de Tom, Público, Idioma, Estilo |
| **Restrições**        | Lista de regras que o modelo DEVE seguir            |
| **Negative Prompt**   | O que o modelo NÃO deve fazer                       |
| **Schema de Saída**   | Formato (texto/json/markdown) e estrutura esperada  |
| **Exemplos Few-Shot** | Pares de entrada/saída para guiar o modelo          |

### 🧩 Menus de Contexto Hierárquicos (v2)

- Menus totalmente customizáveis pelo usuário
- Opções de **nível 1** (ex: Formal, Informal, Técnico)
- Sub-opções de **nível 2** (ex: Formal → Corporativo, Acadêmico, Jurídico)
- UI com chevrons animados para expandir/colapsar sub-opções
- Badges visuais indicando quantidade de sub-opções selecionadas

### 📤 Importar / Exportar

- **Exportar individual:** Download `.json` de um único prompt
- **Exportar todos:** Backup completo em formato `BulkExport` (inclui categorias, menus e prompts)
- **Importar:** Lê arquivos `.json` — detecta automaticamente formato individual ou bulk
- **Copiar JSON:** Copia o prompt formatado direto para a área de transferência
- **Preview JSON:** Visualização inline do JSON antes de exportar

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js** ≥ 18.x
- **pnpm** ≥ 9.x (ou equivalente: npm, yarn, bun)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/danilonovaisv/PROMPT-APP.git
cd prompt-app

# 2. Instale as dependências
pnpm install

# 3. Inicie o servidor de desenvolvimento
pnpm run dev
```

A aplicação estará disponível em **<http://localhost:5173/>**

### Build de Produção

```bash
# Compila TypeScript + gera bundle otimizado
pnpm run build

# Preview local do build de produção
pnpm run preview
```

O output é gerado na pasta `dist/`.

---

## 🏗️ Arquitetura

```text
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│  ┌────────────────────────────────────────────┐  │
│  │              React 19 SPA                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │  Pages   │  │Components│  │ Context  │  │  │
│  │  │          │  │          │  │ (Toast)  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  │
│  │       │              │              │       │  │
│  │       └──────────────┼──────────────┘       │  │
│  │                      │                       │  │
│  │  ┌───────────────────┼───────────────────┐  │  │
│  │  │           Dexie.js ORM                │  │  │
│  │  │  ┌──────────┐ ┌───────┐ ┌──────────┐ │  │  │
│  │  │  │categories│ │prompts│ │contextMenus│ │  │  │
│  │  │  └──────────┘ └───────┘ └──────────┘ │  │  │
│  │  └───────────────────┼───────────────────┘  │  │
│  │                      │                       │  │
│  │              ┌───────┴────────┐              │  │
│  │              │   IndexedDB    │              │  │
│  │              │  (PromptAppDB) │              │  │
│  │              └────────────────┘              │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Padrões Adotados

- **Local-First:** Zero dependência de servidor/API
- **Strict TypeScript:** `noUnusedLocals`, `noUnusedParameters`, `strict: true`
- **Path Aliases:** `@/` resolve para `src/` (configurado em `vite.config.ts` e `tsconfig.app.json`)
- **CSS Utilitário:** Classes reutilizáveis em `index.css` — sem Tailwind, sem inline styles
- **Database Versioning:** Migrações automáticas via `db.version()` do Dexie.js

---

## 📂 Estrutura de Pastas

```text
prompt-app/
├── index.html                   # Entry point HTML
├── vite.config.ts               # Configuração do Vite (plugins, aliases)
├── tsconfig.json                # TypeScript config (referências)
├── tsconfig.app.json            # TS config da app (strict, paths)
├── tsconfig.node.json           # TS config do Node (scripts)
├── package.json                 # Dependências e scripts
├── netlify.toml                 # Configuração de deploy Netlify
│
├── public/                      # Assets estáticos (favicon, etc.)
│
└── src/
    ├── main.tsx                 # Bootstrap do React
    ├── App.tsx                  # Roteamento principal
    ├── index.css                # Design system (variáveis, componentes, utilitários)
    ├── vite-env.d.ts            # Tipos do Vite
    │
    ├── models/
    │   └── types.ts             # Interfaces e tipos (Category, Prompt, ContextMenu, etc.)
    │
    ├── db/
    │   └── database.ts          # Dexie.js — schema, migrações, seed data
    │
    ├── context/
    │   └── ToastContext.tsx      # Provider de notificações toast
    │
    ├── components/
    │   ├── Layout.tsx            # Shell da app (sidebar + conteúdo)
    │   ├── SEO.tsx               # Componente de Meta Tags e SEO
    │   └── ImportExportModal.tsx # Modal de importar/exportar prompts
    │
    ├── pages/
    │   ├── HomePage.tsx          # Dashboard com categorias
    │   ├── CategoryPage.tsx      # Lista de prompts de uma categoria
    │   ├── CategoryManagerPage.tsx # CRUD de categorias
    │   ├── EditorPage.tsx        # Editor completo de prompts
    │   └── MenuManagerPage.tsx   # CRUD de menus de contexto hierárquicos
    │
    └── utils/
        ├── constants.ts         # Ícones e paleta de cores
        ├── backupManager.ts     # Sistema de backup automático e manual
        ├── exportJson.ts        # Exportação JSON (individual e bulk)
        └── importJson.ts        # Importação JSON (individual e bulk)

├── .context/                    # Memória do Agente (Ghost System Memory)
│   ├── knowledge-graph.md       # Mapa de arquitetura e dependências
│   ├── design-tokens.md         # Definições visuais extraídas
│   └── logs/                    # Histórico de ajustes do sistema
```

---

## 📖 Guia de Uso

### 1. Criar uma Categoria

1. Navegue até **Gerenciar Categorias** no sidebar
2. Clique em **+ Nova Categoria**
3. Escolha um nome, ícone (emoji) e cor
4. Clique em **Salvar**

### 2. Criar um Prompt

1. Navegue até uma categoria
2. Clique em **+ Novo Prompt**
3. Preencha os campos do editor:
   - **System Role:** Define a personalidade do LLM
   - **Tarefa:** O objetivo principal
   - **Contexto:** Informações relevantes
   - **Menus de Contexto:** Selecione opções de Tom, Público, Idioma e Estilo
   - **Restrições:** Regras obrigatórias
   - **Negative Prompt:** O que evitar
   - **Schema de Saída:** Formato e estrutura esperados
   - **Exemplos Few-Shot:** Pares de entrada/saída
4. Clique em **Salvar Prompt**

### 3. Exportar Prompts

- **Prompt individual:** No editor, clique em **Baixar** (ícone de download)
- **Copiar JSON:** Clique em **Copiar** para copiar direto para a clipboard
- **Exportar tudo:** No sidebar, clique em **Exportar Todos**

### 4. Importar Prompts

1. No sidebar, clique em **Importar Prompts**
2. Selecione um arquivo `.json` (individual ou bulk export)
3. A app detecta automaticamente o formato e importa os dados

### 5. Gerenciar Menus de Contexto

1. No sidebar, clique em **Menus de Contexto**
2. Visualize os menus existentes com sua estrutura em árvore
3. Clique em **+ Novo Menu** para criar um novo
4. Adicione opções e sub-opções conforme necessário
5. Clique em **Salvar Menu**

---

## 📊 Schema JSON de Exportação

### Prompt Individual (`PromptExportFormat`)

```json
{
  "system_role": "Você é um especialista em copywriting...",
  "task": "Escreva um email de vendas...",
  "input_data": {
    "context": "A empresa X vende software B2B...",
    "menus_selecionados": {
      "tom": {
        "opcao": "formal",
        "sub_opcoes": ["corporativo"]
      },
      "publico": {
        "opcao": "executivos",
        "sub_opcoes": []
      },
      "idioma": {
        "opcao": "pt-br",
        "sub_opcoes": []
      },
      "estilo": {
        "opcao": "detalhado",
        "sub_opcoes": ["com_exemplos"]
      }
    }
  },
  "constraints": ["Máximo de 500 palavras", "Incluir CTA no final"],
  "negative_prompt": ["Não usar jargões técnicos", "Evitar tom agressivo"],
  "output_schema": {
    "formato": "texto",
    "estrutura": "Assunto, Saudação, Corpo (3 parágrafos), CTA, Assinatura"
  },
  "few_shot_examples": [
    {
      "input": "Empresa de SaaS, público: CTOs",
      "output": "Assunto: Reduza 40% do tempo de deploy..."
    }
  ]
}
```

### Exportação em Lote (`BulkExport`)

```json
{
  "app": "Prompt App",
  "version": "2.0.0",
  "exportedAt": "2026-02-10T19:00:00.000Z",
  "contextMenus": [
    {
      "menuId": "tom",
      "menuName": "Tom",
      "description": "Define o tom de comunicação do prompt",
      "options": [
        {
          "label": "Formal",
          "value": "formal",
          "subOptions": [
            { "label": "Corporativo", "value": "corporativo" },
            { "label": "Acadêmico", "value": "academico" }
          ]
        }
      ]
    }
  ],
  "prompts": [
    {
      "title": "Email de Vendas",
      "category": "Copywriting",
      "prompt": { "...PromptExportFormat" }
    }
  ]
}
```

---

## 🧩 Menus de Contexto Hierárquicos

A v2.0 introduziu um sistema de menus totalmente customizáveis:

### Menus Pré-configurados

| Menu        | Opções                                                                          | Sub-opções (exemplos)                        |
| :---------- | :------------------------------------------------------------------------------ | :------------------------------------------- |
| **Tom**     | Formal, Informal, Técnico, Didático, Persuasivo, Neutro                         | Formal → Corporativo, Acadêmico, Jurídico    |
| **Público** | Desenvolvedores, Executivos, Estudantes, Público Geral, Especialistas, Crianças | Desenvolvedores → Júnior, Sênior, Full Stack |
| **Idioma**  | Português (BR), Inglês, Espanhol, Francês, Alemão                               | Inglês → Americano, Britânico                |
| **Estilo**  | Conciso, Detalhado, Passo a passo, Lista, Narrativo, Comparativo                | Narrativo → Storytelling, Metáforas          |

### Modelo de Dados

```typescript
interface ContextMenu {
  id?: number;
  menuId: string; // slug único ("tom", "frameworks", etc.)
  menuName: string; // nome legível ("Tom", "Frameworks")
  description: string; // propósito do menu
  options: ContextMenuOption[];
  createdAt: Date;
  updatedAt: Date;
}

interface ContextMenuOption {
  label: string; // rótulo visível
  value: string; // valor interno
  subOptions: ContextMenuSubOption[];
}

interface ContextMenuSubOption {
  label: string;
  value: string;
}
```

### Como funciona no Editor

1. O **Editor** carrega todos os menus do banco `contextMenus`
2. As opções de nível 1 são exibidas como **tags** clicáveis
3. Ao selecionar uma opção, um **chevron** aparece para expandir as sub-opções
4. As sub-opções são exibidas abaixo como tags menores
5. Um **badge** numérico indica quantas sub-opções foram selecionadas
6. Todas as seleções são salvas no campo `contextMenus` do prompt como `MenuSelectionsMap`

---

## 🚢 Deploy

### Netlify (Recomendado)

O projeto já inclui `netlify.toml` pré-configurado:

```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Passos:**

1. Conecte o repositório GitHub ao [Netlify](https://app.netlify.com)
2. O build é detectado automaticamente
3. Cada push na branch principal dispara um novo deploy

**Ou via CLI:**

```bash
# Instalar CLI do Netlify
pnpm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Vercel

```bash
# Instalar CLI do Vercel
pnpm install -g vercel

# Deploy
vercel --prod
```

> A configuração SPA será detectada automaticamente. Caso contrário, adicione um `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### GitHub Pages

```bash
# Build
pnpm run build

# Deploy manual (ou usar github-pages action)
npx gh-pages -d dist
```

> **Nota:** Para GitHub Pages com path prefix, configure `base` no `vite.config.ts`:

```ts
export default defineConfig({
  base: "/prompt-app/",
  plugins: [react()],
  // ...
});
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
docker build -t prompt-app .
docker run -p 3000:80 prompt-app
```

---

## 📜 Scripts Disponíveis

| Script         | Comando            | Descrição                                  |
| :------------- | :----------------- | :----------------------------------------- |
| **Dev**        | `pnpm run dev`     | Servidor de desenvolvimento com HMR (Vite) |
| **Build**      | `pnpm run build`   | Type-check + bundle de produção            |
| **Preview**    | `pnpm run preview` | Serve o build de produção localmente       |
| **Type Check** | `npx tsc --noEmit` | Verifica tipos sem emitir arquivos         |

---

## 🎨 Personalização

### Design Tokens

As variáveis CSS estão definidas em `src/index.css` sob `:root`:

| Token                    | Descrição              | Default                     |
| :----------------------- | :--------------------- | :-------------------------- |
| `--color-primary`        | Cor primária de ação   | `#0048ff`                   |
| `--color-bg-void`        | Fundo principal (void) | `#040013`                   |
| `--color-bg-card`        | Fundo de cards         | `rgba(255, 255, 255, 0.03)` |
| `--color-border`         | Bordas                 | `rgba(255, 255, 255, 0.08)` |
| `--color-text-primary`   | Texto principal        | `#f0f0f0`                   |
| `--color-text-secondary` | Texto secundário       | `#8b8b9e`                   |
| `--color-success`        | Feedback positivo      | `#00d68f`                   |
| `--color-danger`         | Feedback negativo      | `#ff4466`                   |
| `--radius-md`            | Border radius padrão   | `12px`                      |
| `--transition-fast`      | Transição rápida       | `0.15s ease`                |

### Categorias Iniciais

Você pode modificar as categorias seed em `src/db/database.ts` na função `seedDatabase()`. As categorias são criadas apenas se o banco estiver vazio.

### Menus de Contexto Iniciais

Os menus seed (Tom, Público, Idioma, Estilo) também estão em `src/db/database.ts`. Depois do primeiro acesso, podem ser editados diretamente pela UI em `/menus`.

---

## 🛠️ Desenvolvimento

### Requisitos

```bash
node --version   # ≥ 18.x
pnpm --version    # ≥ 9.x
```

### Configuração do Editor

**VS Code (recomendado):**

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Path Aliases

O alias `@/` está configurado em dois lugares:

```ts
// vite.config.ts
resolve: {
    alias: {
        '@': '/src',
    },
},
```

```json
// tsconfig.app.json
"paths": {
    "@/*": ["src/*"]
}
```

### Banco de Dados

O IndexedDB é gerenciado pelo [Dexie.js](https://dexie.org/). As tabelas são:

| Tabela         | Campos Indexados                                | Descrição                   |
| :------------- | :---------------------------------------------- | :-------------------------- |
| `categories`   | `++id, name, createdAt`                         | Categorias de prompts       |
| `prompts`      | `++id, categoryId, title, createdAt, updatedAt` | Prompts completos           |
| `menuOptions`  | `++id, menuKey, value`                          | Opções de menu (v1, legado) |
| `contextMenus` | `++id, menuId, menuName, createdAt`             | Menus hierárquicos (v2)     |

**Migrações:** Ao alterar o schema, crie uma nova versão em `database.ts`:

```ts
db.version(3)
  .stores({
    // ... schema atualizado
  })
  .upgrade(async (tx) => {
    // ... lógica de migração
  });
```

---

## 🤝 Contribuição

1. **Fork** o repositório
2. Crie uma branch de feature: `git checkout -b feature/minha-feature`
3. Faça commit das mudanças: `git commit -m 'feat: minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um **Pull Request**

### Convenções

- **Commits:** Seguir [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Código:** TypeScript strict, sem inline styles, CSS utility classes em `index.css`
- **Componentes:** Um arquivo por componente, exports default

---

## 📄 Licença

MIT © [Danilo Novais](https://github.com/danilonovaisv)

---

<p align="center">
  <strong>Prompt App v2.0</strong> — Feito com 🧠 e ☕ para engenheiros de IA
</p>
