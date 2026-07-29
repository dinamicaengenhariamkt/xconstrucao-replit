#!/bin/bash
# O path do node é gravado em .node-path durante o build (build command).
# Isso evita depender do PATH do container de produção, que não carrega
# o profile do Nix automaticamente.

set -e

NODE_BIN=""

# 1. Tenta ler o path capturado no build
if [ -f .node-path ]; then
  NODE_BIN=$(tr -d '[:space:]' < .node-path)
fi

# 2. Fallback: node já está no PATH (ex: rodando localmente)
if [ -z "$NODE_BIN" ] || [ ! -x "$NODE_BIN" ]; then
  if command -v node &>/dev/null; then
    NODE_BIN=$(command -v node)
    echo "[start-prod] aviso: usando node do PATH — $NODE_BIN"
  else
    echo "[start-prod] ERRO: .node-path ausente/inválido e node não encontrado no PATH." >&2
    echo "[start-prod] Rode um novo build para regenerar .node-path" >&2
    exit 1
  fi
fi

echo "[start-prod] node: $NODE_BIN — $("$NODE_BIN" --version)"
echo "[start-prod] Iniciando Next.js na porta 5000..."

exec "$NODE_BIN" node_modules/next/dist/bin/next start -p 5000 -H 0.0.0.0
