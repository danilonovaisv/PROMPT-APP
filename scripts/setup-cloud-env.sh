#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="${1:-.env.local}"

if [[ -f "$TARGET_FILE" ]]; then
  echo "⚠️  $TARGET_FILE já existe. Nenhuma alteração foi feita."
  echo "   Remova/renomeie o arquivo para regenerar o template."
  exit 0
fi

cat > "$TARGET_FILE" <<'ENV'
# Cloud Sync (Supabase) — obrigatório para enviar tarefas/prompts para a nuvem
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Compatibilidade legada (fallback se VITE_SUPABASE_ANON_KEY não estiver definido)
# VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_LEGACY_PUBLISHABLE_KEY

# Opcional: observabilidade
# VITE_SENTRY_DSN=YOUR_SENTRY_DSN
ENV

echo "✅ Template criado em $TARGET_FILE"
echo "👉 Próximo passo: preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com os valores do seu projeto Supabase."
