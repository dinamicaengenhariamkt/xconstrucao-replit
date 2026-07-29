#!/bin/bash
# Garante que o PATH do Nix está disponível no container de produção.
# O run command do Replit executa em um shell sem o profile do Nix carregado,
# então 'node' e 'npm' não ficam acessíveis por padrão.

set -e

# Carrega o profile do Nix se disponível
if [ -f /etc/profile ]; then
  # shellcheck disable=SC1091
  source /etc/profile
fi

# Fallback: adiciona diretórios comuns do Nix ao PATH
for nix_bin in \
  /nix/var/nix/profiles/default/bin \
  ~/.nix-profile/bin \
  /run/current-system/sw/bin; do
  if [ -d "$nix_bin" ]; then
    export PATH="$nix_bin:$PATH"
  fi
done

# Verifica se o node está disponível
if ! command -v node &>/dev/null; then
  # Último recurso: procura node diretamente no nix store
  NIX_NODE=$(find /nix/store -maxdepth 3 -name "node" -type f 2>/dev/null | grep "nodejs.*bin/node$" | head -1)
  if [ -n "$NIX_NODE" ]; then
    export PATH="$(dirname "$NIX_NODE"):$PATH"
    echo "[start-prod] node encontrado em: $NIX_NODE"
  else
    echo "[start-prod] ERRO: node não encontrado. Abortando." >&2
    exit 1
  fi
fi

echo "[start-prod] node: $(command -v node) — $(node --version)"
echo "[start-prod] Iniciando Next.js..."

exec node_modules/.bin/next start -p 5000 -H 0.0.0.0
