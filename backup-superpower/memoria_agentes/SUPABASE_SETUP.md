# ☁️ Guia de Configuração Supabase — Prompt App

Este guia fornece os passos e os códigos SQL necessários para configurar sua nuvem no Supabase e habilitar a sincronização automática.

## 1. Configuração do Projeto

1. Crie um novo projeto no [Supabase](https://supabase.com).
2. No menu **Project Settings > API**, copie a `Project URL` e a `anon key`.
3. Gere um arquivo local de ambiente com:

```bash
pnpm run setup:cloud-env
```

Depois preencha as chaves no `.env.local`:

```env
NEXT_SUPABASE_URL=sua_url_aqui
NEXT_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

> URL já conhecida do projeto em produção: `https://dpejskjpghoozbpfxkpf.supabase.co`.
> A `NEXT_SUPABASE_ANON_KEY` deve ser obtida no painel Supabase em **Project Settings > API > anon public key** e configurada no ambiente (não commitar em código).

### Netlify (produção)

No Netlify, configure as mesmas variáveis em **Site configuration → Environment variables**:

- `NEXT_SUPABASE_URL`
- `NEXT_SUPABASE_ANON_KEY`

## 2. Tabelas do Banco de Dados (SQL)

Execute o script abaixo no **SQL Editor** do seu painel Supabase.

Este script cria as tabelas com suporte a JSONB para os campos complexos e abilita **Row Level Security (RLS)**, garantindo que cada usuário veja apenas seus próprios dados.

```sql
-- ==========================================
-- 1. TABELA DE CATEGORIAS
-- ==========================================
create table categories (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  icon text,
  color text,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 2. TABELA DE MENUS DE CONTEXTO
-- ==========================================
create table context_menus (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users not null default auth.uid(),
  menu_id text not null,
  menu_name text not null,
  description text,
  options jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, menu_id)
);

-- ==========================================
-- 3. TABELA DE PROMPTS
-- ==========================================
create table prompts (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users not null default auth.uid(),
  category_id bigint references categories(id) on delete set null,
  title text not null,
  system_role text,
  task text,
  context text,
  menus jsonb default '{}'::jsonb,
  context_menus jsonb default '{}'::jsonb,
  enabled_menu_ids jsonb default '[]'::jsonb,
  constraints jsonb default '[]'::jsonb,
  negative_prompt jsonb default '[]'::jsonb,
  output_schema jsonb default '{}'::jsonb,
  few_shot_examples jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ==========================================
-- 4. SEGURANÇA (RLS)
-- ==========================================
alter table categories enable row level security;
alter table context_menus enable row level security;
alter table prompts enable row level security;

-- Políticas para Categorias
create policy "Usuários gerenciam suas próprias categorias"
  on categories for all
  using (auth.uid() = user_id);

-- Políticas para Menus
create policy "Usuários gerenciam seus próprios menus"
  on context_menus for all
  using (auth.uid() = user_id);

-- Políticas para Prompts
create policy "Usuários gerenciam seus próprios prompts"
  on prompts for all
  using (auth.uid() = user_id);
```

## 3. Próximos Passos

- **Autenticação**: Habilite os provedores de login (Email, Google, GitHub) no menu **Authentication > Providers**.
- **Instalação**: Execute `pnpm add @supabase/supabase-js`.
- **Sincronização**: O sistema já está preparado para usar as funções em `src/services/syncService.ts`.

---

_Configurado por Antigravity usando Supabase Best Practices._
