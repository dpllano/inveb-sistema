#!/bin/bash
# ===========================================
# INVEB - Backup de Base de Datos
# ===========================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Cargar variables de entorno
if [ -f "$BASE_DIR/docker/.env" ]; then
    source "$BASE_DIR/docker/.env"
fi

# Configuracion
CONTAINER_NAME=${1:-inveb-mysql-local}
DB_NAME=${DB_NAME:-envases_ot}
BACKUP_DIR="$BASE_DIR/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

echo "==================================="
echo "  INVEB - Backup de Base de Datos"
echo "==================================="
echo ""
echo "Contenedor: $CONTAINER_NAME"
echo "Base de datos: $DB_NAME"
echo "Archivo: $BACKUP_FILE"
echo ""

# Verificar que el contenedor esta corriendo
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "ERROR: Contenedor $CONTAINER_NAME no esta corriendo"
    exit 1
fi

# Realizar backup
echo "Creando backup..."
docker exec "$CONTAINER_NAME" mysqldump -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Comprimir
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"

    # Mostrar info del archivo
    SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo ""
    echo "Backup completado exitosamente!"
    echo "Archivo: $BACKUP_FILE"
    echo "Tamano: $SIZE"

    # Limpiar backups antiguos (mantener ultimos 7)
    echo ""
    echo "Limpiando backups antiguos..."
    cd "$BACKUP_DIR"
    ls -t backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm
    echo "Backups actuales:"
    ls -lh backup_*.sql.gz 2>/dev/null
else
    echo "ERROR: Fallo al crear backup"
    exit 1
fi
