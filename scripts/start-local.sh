#!/bin/bash
# ===========================================
# INVEB - Iniciar en modo desarrollo local
# ===========================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Iniciando INVEB en modo desarrollo..."

cd "$BASE_DIR/docker"
docker compose -f docker-compose.local.yml up -d

echo ""
echo "Servicios iniciados:"
echo "  - Frontend:  http://localhost:3000"
echo "  - API:       http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo ""
echo "Para ver logs: docker compose -f docker/docker-compose.local.yml logs -f"
