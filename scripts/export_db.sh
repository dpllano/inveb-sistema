#!/bin/bash
# Script para exportar la base de datos MySQL para Railway
# Uso: ./export_db.sh

set -e

# Configuración (ajustar según tu entorno)
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_USER="${MYSQL_USER:-root}"
DB_PASS="${MYSQL_PASSWORD:-root}"
DB_NAME="${MYSQL_DATABASE:-invebchile_envases_ot}"

# Nombre del archivo de salida
OUTPUT_FILE="inveb_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "=== Exportando base de datos INVEB ==="
echo "Host: $DB_HOST"
echo "Puerto: $DB_PORT"
echo "Base de datos: $DB_NAME"
echo "Archivo de salida: $OUTPUT_FILE"
echo ""

# Exportar con mysqldump
# --single-transaction: Para tablas InnoDB sin bloquear
# --routines: Incluir stored procedures
# --triggers: Incluir triggers
# --add-drop-table: Agregar DROP TABLE antes de CREATE
mysqldump \
    -h "$DB_HOST" \
    -P "$DB_PORT" \
    -u "$DB_USER" \
    -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    "$DB_NAME" > "$OUTPUT_FILE"

# Comprimir
gzip "$OUTPUT_FILE"

echo ""
echo "✅ Exportación completada: ${OUTPUT_FILE}.gz"
echo ""
echo "Para importar en Railway:"
echo "1. railway connect mysql"
echo "2. gunzip -c ${OUTPUT_FILE}.gz | mysql -h \$MYSQL_HOST -u \$MYSQL_USER -p\$MYSQL_PASSWORD \$MYSQL_DATABASE"
