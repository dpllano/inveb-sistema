#!/bin/bash
# ===========================================
# INVEB - Script de Instalacion Automatica
# ===========================================
# Uso: ./scripts/setup.sh [local|prod]
# ===========================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo ""
echo "========================================"
echo "    INVEB - Sistema de Gestion OT"
echo "    Instalacion Automatica v2.0"
echo "========================================"
echo ""

# Verificar argumentos
MODE=${1:-local}
if [[ "$MODE" != "local" && "$MODE" != "prod" ]]; then
    log_error "Modo invalido. Uso: ./setup.sh [local|prod]"
    exit 1
fi

log_info "Modo de instalacion: $MODE"

# Verificar Docker
log_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker no esta instalado. Por favor instale Docker primero."
    echo "Visite: https://docs.docker.com/get-docker/"
    exit 1
fi
log_success "Docker encontrado: $(docker --version)"

# Verificar Docker Compose
log_info "Verificando Docker Compose..."
if ! docker compose version &> /dev/null; then
    log_error "Docker Compose no esta disponible."
    exit 1
fi
log_success "Docker Compose encontrado: $(docker compose version --short)"

# Directorio base
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

log_info "Directorio base: $BASE_DIR"

# Crear estructura de directorios
log_info "Creando estructura de directorios..."
mkdir -p "$BASE_DIR/docker/mysql/init"
mkdir -p "$BASE_DIR/docker/nginx/ssl"
log_success "Directorios creados"

# Configurar .env
ENV_FILE="$BASE_DIR/docker/.env"
if [ ! -f "$ENV_FILE" ]; then
    log_info "Creando archivo .env..."
    cp "$BASE_DIR/docker/.env.example" "$ENV_FILE"

    # Generar JWT secret aleatorio
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

    # Reemplazar valores por defecto
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/CAMBIAR_ESTA_CLAVE_SECRETA_MIN_32_CARACTERES/$JWT_SECRET/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/CAMBIAR_ESTA_CLAVE_SECRETA_MIN_32_CARACTERES/$JWT_SECRET/" "$ENV_FILE"
    fi

    log_success "Archivo .env creado con JWT secret generado"
    log_warning "IMPORTANTE: Revise y modifique las contrasenas en $ENV_FILE"
else
    log_info "Archivo .env ya existe, omitiendo..."
fi

# Copiar dump de BD si existe
if [ -f "$BASE_DIR/database/envases_ot.sql" ]; then
    log_info "Copiando dump de base de datos..."
    cp "$BASE_DIR/database/envases_ot.sql" "$BASE_DIR/docker/mysql/init/01_schema.sql"
    log_success "Dump copiado a docker/mysql/init/"
else
    log_warning "No se encontro dump de BD en database/envases_ot.sql"
fi

# Seleccionar docker-compose segun modo
if [ "$MODE" == "local" ]; then
    COMPOSE_FILE="docker-compose.local.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Construir e iniciar
log_info "Construyendo contenedores (esto puede tomar varios minutos)..."
cd "$BASE_DIR/docker"
docker compose -f "$COMPOSE_FILE" build

log_info "Iniciando servicios..."
docker compose -f "$COMPOSE_FILE" up -d

# Esperar a que los servicios esten listos
log_info "Esperando a que los servicios esten listos..."
sleep 10

# Verificar servicios
log_info "Verificando servicios..."

# MySQL
if docker compose -f "$COMPOSE_FILE" ps | grep -q "mysql.*running"; then
    log_success "MySQL: OK"
else
    log_warning "MySQL: Iniciando..."
fi

# Backend
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend API: OK"
        break
    fi
    if [ $i -eq 30 ]; then
        log_warning "Backend API: Aun iniciando..."
    fi
    sleep 2
done

# Frontend
if [ "$MODE" == "local" ]; then
    FRONTEND_PORT=3000
else
    FRONTEND_PORT=80
fi

if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    log_success "Frontend: OK"
else
    log_warning "Frontend: Aun iniciando..."
fi

# Resumen
echo ""
echo "========================================"
echo "    Instalacion Completada"
echo "========================================"
echo ""

if [ "$MODE" == "local" ]; then
    echo "URLs de acceso:"
    echo "  - Frontend:  http://localhost:3000"
    echo "  - API:       http://localhost:8000"
    echo "  - API Docs:  http://localhost:8000/docs"
    echo "  - MySQL:     localhost:3306"
else
    echo "URLs de acceso:"
    echo "  - Sistema:   http://localhost"
    echo "  - API:       http://localhost/api"
    echo "  - API Docs:  http://localhost/docs"
fi

echo ""
echo "Comandos utiles:"
echo "  Ver logs:     docker compose -f docker/$COMPOSE_FILE logs -f"
echo "  Detener:      docker compose -f docker/$COMPOSE_FILE down"
echo "  Reiniciar:    docker compose -f docker/$COMPOSE_FILE restart"
echo ""
log_success "Instalacion exitosa!"
