#!/usr/bin/env bash
# Inicia o Document Management System (backend + frontend) no Linux/Codespace.
# Uso: ./start-dms.sh
# Encerre com Ctrl+C (os dois processos são finalizados juntos).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Instala as dependências apenas se ainda não existirem.
[ -d "$ROOT/backend/node_modules" ] || (cd "$ROOT/backend" && npm install)
[ -d "$ROOT/frontend/node_modules" ] || (cd "$ROOT/frontend" && npm install)

cleanup() {
  echo ""
  echo "Encerrando o DMS..."
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$ROOT/backend" && npm start) &
BACKEND_PID=$!

(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173 (use a porta encaminhada pelo Codespace)"
echo "Pressione Ctrl+C para encerrar."

wait
