#!/bin/bash
set -e

echo "[post-merge] Instalando dependências..."
npm install --legacy-peer-deps

echo "[post-merge] Aplicando migrações do banco..."
# --force suprime prompts interativos (ex: confirmação de UNIQUE constraint)
npx drizzle-kit push --force

echo "[post-merge] Concluído."
