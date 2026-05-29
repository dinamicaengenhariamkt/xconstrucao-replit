#!/usr/bin/env bash
# Stop hook: roda `npm run check` apenas se houver mudanças não-commitadas em .ts/.tsx.
# - Se passar (ou nada mudou): exit 0 silencioso.
# - Se falhar: exit 2 com stderr — o Claude recebe os erros e precisa corrigir antes de encerrar.

set -u
cd "$(dirname "$0")/../.." || exit 0

if ! command -v git >/dev/null 2>&1; then
  exit 0
fi

# Só age se há .ts/.tsx modificado/criado/staged.
if ! git status --porcelain 2>/dev/null | grep -qE '\.(ts|tsx)$'; then
  exit 0
fi

OUT_FILE="$(mktemp -t tsc-out.XXXXXX)"
trap 'rm -f "$OUT_FILE"' EXIT

if npm run check >"$OUT_FILE" 2>&1; then
  exit 0
fi

{
  echo "[hook] TypeScript check falhou. Corrija antes de encerrar."
  echo "---"
  tail -50 "$OUT_FILE"
} >&2

exit 2
