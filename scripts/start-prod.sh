#!/bin/bash
# Startup de produção — resolve o binário do node em ordem de confiabilidade:
#   1. node_modules/node/bin/node  (pacote npm "node", embutido na imagem — não depende do Nix)
#   2. .node-path                  (path capturado durante o build)
#   3. node no PATH                (dev local)
# Se tudo falhar, imprime diagnóstico completo do container nos logs.

set -e

NODE_BIN=""

# 1. Node embutido via pacote npm (mais confiável em produção)
if [ -x "node_modules/node/bin/node" ]; then
  NODE_BIN="node_modules/node/bin/node"
fi

# 2. Fallback: path capturado no build
if [ -z "$NODE_BIN" ] && [ -f .node-path ]; then
  CANDIDATE=$(tr -d '[:space:]' < .node-path)
  if [ -x "$CANDIDATE" ]; then
    NODE_BIN="$CANDIDATE"
  fi
fi

# 3. Fallback: PATH (ambiente de desenvolvimento)
if [ -z "$NODE_BIN" ] && command -v node &>/dev/null; then
  NODE_BIN=$(command -v node)
fi

if [ -z "$NODE_BIN" ]; then
  echo "[start-prod] ERRO: nenhum node encontrado. Diagnóstico do container:" >&2
  echo "--- PATH: $PATH" >&2
  echo "--- pwd: $(pwd)" >&2
  echo "--- ls node_modules/node/bin: $(ls node_modules/node/bin 2>&1 | head -5)" >&2
  echo "--- cat .node-path: $(cat .node-path 2>&1)" >&2
  echo "--- ls /nix/store (primeiros 5): $(ls /nix/store 2>&1 | head -5)" >&2
  exit 1
fi

echo "[start-prod] node: $NODE_BIN — $("$NODE_BIN" --version)"
PORT="${PORT:-5000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

echo "[start-prod] Iniciando Next.js standalone em ${HOSTNAME}:${PORT}..."

exec env PORT="$PORT" HOSTNAME="$HOSTNAME" "$NODE_BIN" .next/standalone/server.js
