#!/usr/bin/env bash
# e2e-server.sh — sobe o dev server para os testes E2E e pré-compila rotas-chave.
#
# Motivo do warm-up: o `next dev` compila rotas on-demand. Na primeira rodada da
# suíte com vários workers, a rota dinâmica /medicamento/[id] é compilada sob carga
# e a navegação client-side para ela pode estourar o timeout do teste (cold compile).
# Aqui forçamos a compilação dessas rotas ANTES do Playwright iniciar, tornando a
# suíte estável. Em CI (build de produção pré-compilado) isso não é necessário,
# mas o script funciona igual (as rotas já estão compiladas).
set -euo pipefail

PORT="${E2E_PORT:-11009}"
BASE="http://localhost:${PORT}"

npx next dev -p "$PORT" &
NEXT_PID=$!

# Espera o servidor responder (a home é estática e responde cedo).
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "$BASE/"; then
    break
  fi
  sleep 2
done

# Warm-up: dispara uma requisição em cada rota dinâmica/pesada para forçar a
# compilação. Falhas individuais são esperadas se o banco estiver indisponível
# (404/erro) — o objetivo aqui é apenas compilar, não validar resposta.
curl -sf -o /dev/null "$BASE/medicamento/13429" || true
curl -sf -o /dev/null "$BASE/buscar-avancado?query=sulpirida" || true
curl -sf -o /dev/null "$BASE/compare" || true
curl -sf -o /dev/null "$BASE/referencias" || true

wait "$NEXT_PID"