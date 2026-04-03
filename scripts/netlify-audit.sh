#!/usr/bin/env bash
set -euo pipefail

# Auditoria operacional de consumo Netlify
# Requisitos:
#   export NETLIFY_TOKEN="{{NETLIFY_TOKEN}}"
#   export TEAM_ID="{{TEAM_ID}}"
# Dependências: curl, jq

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[ERRO] Comando obrigatório não encontrado: $1" >&2
    exit 1
  }
}

require_env() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    echo "[ERRO] Variável obrigatória ausente: $var_name" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq
require_env NETLIFY_TOKEN
require_env TEAM_ID

API_BASE="https://api.netlify.com/api/v1"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
REPORT_DIR="reports"
REPORT_FILE="${REPORT_DIR}/netlify-audit-${TIMESTAMP//:/-}.json"

mkdir -p "$REPORT_DIR"

api_get() {
  local endpoint="$1"
  curl -fsSL \
    -H "Authorization: Bearer ${NETLIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    "${API_BASE}${endpoint}"
}

api_patch() {
  local endpoint="$1"
  local payload="$2"
  curl -fsSL -X PATCH \
    -H "Authorization: Bearer ${NETLIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "${API_BASE}${endpoint}"
}

echo "[INFO] Coletando sites do time ${TEAM_ID}..."
SITES_JSON="$(api_get "/accounts/${TEAM_ID}/sites")"

SITE_COUNT="$(jq 'length' <<<"$SITES_JSON")"
INACTIVE_SITES="$(jq '[.[] | select((.published_deploy == null) or (.state != "current" and .state != "ready"))]' <<<"$SITES_JSON")"
DUPLICATE_NAMES="$(jq '[group_by(.name)[] | select(length > 1) | {name: .[0].name, sites: map({id, url, admin_url})}]' <<<"$SITES_JSON")"

# Opcional: pausa builds automáticos em branches secundárias.
# Ative com: AUTO_DISABLE_BRANCH_BUILDS=true ./scripts/netlify-audit.sh
AUTO_DISABLE_BRANCH_BUILDS="${AUTO_DISABLE_BRANCH_BUILDS:-false}"
DISABLED_BUILDS="[]"

if [[ "$AUTO_DISABLE_BRANCH_BUILDS" == "true" ]]; then
  echo "[INFO] Desativando builds automáticos em branches secundárias..."
  mapfile -t SITE_IDS < <(jq -r '.[].id' <<<"$SITES_JSON")

  DISABLED_TMP="[]"
  for SITE_ID in "${SITE_IDS[@]}"; do
    PATCH_PAYLOAD='{"build_settings":{"stop_builds":true}}'
    if RESPONSE="$(api_patch "/sites/${SITE_ID}" "$PATCH_PAYLOAD" 2>/dev/null)"; then
      DISABLED_TMP="$(jq --arg id "$SITE_ID" --argjson response "$RESPONSE" '. + [{site_id: $id, status: "updated", response: $response}]' <<<"$DISABLED_TMP")"
    else
      DISABLED_TMP="$(jq --arg id "$SITE_ID" '. + [{site_id: $id, status: "failed"}]' <<<"$DISABLED_TMP")"
    fi
  done
  DISABLED_BUILDS="$DISABLED_TMP"
fi

echo "[INFO] Coletando builds recentes..."
BUILDS_JSON="$(api_get "/accounts/${TEAM_ID}/builds?per_page=100")"

TOTAL_MINUTES_APPROX="$(jq '[.[] | (.deploy_time // 0)] | add / 60' <<<"$BUILDS_JSON")"
BANDWIDTH_APPROX_MB="$(jq '[.[] | (.deploy_ssl_url // empty)] | length * 0' <<<"$BUILDS_JSON")"

jq -n \
  --arg generated_at "$TIMESTAMP" \
  --arg team_id "$TEAM_ID" \
  --argjson sites "$SITES_JSON" \
  --argjson site_count "$SITE_COUNT" \
  --argjson inactive_sites "$INACTIVE_SITES" \
  --argjson duplicate_names "$DUPLICATE_NAMES" \
  --argjson builds "$BUILDS_JSON" \
  --argjson total_minutes_approx "$TOTAL_MINUTES_APPROX" \
  --argjson bandwidth_approx_mb "$BANDWIDTH_APPROX_MB" \
  --arg auto_disable "$AUTO_DISABLE_BRANCH_BUILDS" \
  --argjson disabled_builds "$DISABLED_BUILDS" \
  '{
    generated_at: $generated_at,
    team_id: $team_id,
    summary: {
      total_sites: $site_count,
      inactive_sites_count: ($inactive_sites | length),
      duplicate_site_names_count: ($duplicate_names | length),
      recent_builds_count: ($builds | length),
      total_build_minutes_approx: $total_minutes_approx,
      total_bandwidth_mb_approx: $bandwidth_approx_mb
    },
    inactive_sites: $inactive_sites,
    duplicate_site_names: $duplicate_names,
    builds_recent: $builds,
    auto_disable_branch_builds: $auto_disable,
    branch_build_updates: $disabled_builds
  }' > "$REPORT_FILE"

echo "[OK] Relatório salvo em: $REPORT_FILE"
echo "[OK] Sites analisados: $SITE_COUNT"
