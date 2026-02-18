# Relatório de Transição PNPM

## 🔍 Debug: Configurações de Gerenciador de Pacotes (pnpm vs npm)

### 1. Sintoma

O comando `npm install` falhou com erro `EUNSUPPORTEDPROTOCOL` (referente a `workspace:`), enquanto o `pnpm install` funcionou corretamente. A documentação (`README.md`, `DEPLOY.md`, `netlify.toml`) ainda referenciava `npm`, causando confusão e potenciais falhas em builds de CI/CD (como Netlify).

### 2. Informações Coletadas

- **Erro:** `npm error Unsupported URL Type "workspace:"`
- **Arquivos Identificados:** `pnpm-lock.yaml` e `pnpm-workspace.yaml` presentes na raiz.
- **Configuração Atual:** O projeto utiliza recursos de workspaces e links simbólicos que são nativos do `pnpm` e incompatíveis com o `npm` padrão sem configurações extras.

### 3. Hipóteses

1. 🎯 **O projeto foi inicializado ou migrado para `pnpm`**, mas a documentação e scripts de build (`netlify.toml`) não foram atualizados.
2. ❓ Existem dependências usando o protocolo `workspace:`, que o `npm` não reconhece.

### 4. Investigação

**Testando Gerenciadores:**

- `pnpm install` → ✅ Sucesso (324ms).
- `npm install` → ❌ Falha (Erro de protocolo).

**Verificando Arquivos:**

- Presença de `pnpm-lock.yaml` confirma o uso de `pnpm` como fonte da verdade para dependências.

### 5. Causa Raiz

🎯 **Inconsistência entre o ferramental real do projeto (pnpm) e a documentação/configuração de build (npm).** O uso do protocolo `workspace:` no ambiente local ou em dependências internas impede o uso do `npm` tradicional.

### 6. Soluções Aplicadas

#### A. Atualização do `netlify.toml`

Alteração do comando de build para usar `pnpm`.

#### B. Padronização da Documentação

Substituição global de `npm` por `pnpm` em:

- `README.md`
- `DEPLOY.md`
- `SUPABASE_SETUP.md`

#### C. Correção de Scripts de CI/CD

Ajuste nos exemplos de GitHub Actions e guias de deploy para garantir o uso do `pnpm`.

### 7. Prevenção

🛡️ Manter apenas um lockfile no repositório. O `pnpm-lock.yaml` deve ser o único. Scripts de pré-commit ou checks de CI podem ser adicionados para impedir a criação de `package-lock.json`.
