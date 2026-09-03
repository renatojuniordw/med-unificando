#!/usr/bin/env bash
# check-backup-freshness.sh — verifica se o backup mais recente não está velho.
# Uso: check-backup-freshness.sh [DIR_BACKUPS] [IDADE_MAX_DIAS]
#   - DIR_BACKUPS: diretório dos backups (padrão /backups)
#   - IDADE_MAX_DIAS: idade máxima aceita em dias (padrão 8)
# Exit 0 = OK; exit 1 = backup ausente ou velho (pronto para acionar alerta no cron).
set -euo pipefail

BACKUP_DIR="${1:-/backups}"
MAX_AGE_DAYS="${2:-8}"

LATEST="$(ls -t "$BACKUP_DIR"/medicamentos-*.sql.gz 2>/dev/null | head -1 || true)"

if [ -z "$LATEST" ]; then
  echo "ERRO: nenhum backup encontrado em $BACKUP_DIR" >&2
  exit 1
fi

MTIME="$(stat -c '%Y' "$LATEST")"
NOW="$(date +%s)"
AGE_DAYS=$(( (NOW - MTIME) / 86400 ))

if [ "$AGE_DAYS" -gt "$MAX_AGE_DAYS" ]; then
  echo "ERRO: backup $LATEST tem $AGE_DAYS dia(s) (> $MAX_AGE_DAYS)" >&2
  exit 1
fi

echo "OK: $LATEST ($AGE_DAYS dia(s) — limite $MAX_AGE_DAYS)"
exit 0