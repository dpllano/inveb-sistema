#!/bin/bash
# ===========================================
# INVEB - Detener servicios
# ===========================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

MODE=${1:-local}

if [ "$MODE" == "local" ]; then
    COMPOSE_FILE="docker-compose.local.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "Deteniendo servicios INVEB ($MODE)..."

cd "$BASE_DIR/docker"
docker compose -f "$COMPOSE_FILE" down

echo "Servicios detenidos."
