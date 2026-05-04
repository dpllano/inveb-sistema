# Migrations SQL — INVEB Envases-OT FastAPI

Esta carpeta contiene scripts SQL versionados que crean/modifican tablas
en la BD MySQL del refactor FastAPI.

## Por qué scripts SQL manuales (no Alembic)

Decisión arquitectónica del 2026-05-03 (ver `aibo/output/inveb-h1/documento/decision-arquitectonica-opcion-c-h3.md`):

- El backend usa pymysql crudo en 37 archivos (no SQLAlchemy ORM completo).
- Solo 6 modelos SQLModel para tablas nuevas (greenfield).
- Configurar Alembic + autogenerate + manual mixto NO se justifica para 2 tablas nuevas.
- Scripts SQL versionados son simples, sin tooling extra, y dejan a INVEB control total del cuándo ejecutar.

**Alembic queda evaluado para H3 post-cutover** si INVEB lo solicita.

## Convención de nombres

```
NNN_descripcion.sql
```

Donde `NNN` es un número correlativo de 3 dígitos (001, 002, 003, ...).

## Orden de ejecución en cutover

INVEB ejecuta los scripts en orden numérico ascendente sobre la BD productiva:

```bash
mysql -u <user> -p <database> < 001_create_muestra_salas_corte.sql
mysql -u <user> -p <database> < 002_create_work_order_cinta_details.sql
# ... siguientes en orden ...
```

## Convenciones por script

Cada script SQL debe contener:

1. **Cabecera** con: número, fecha, autor, propósito, validación origen, dependencias
2. **Sentencias DDL idempotentes** (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)
3. **Sentencias DML de migración de datos** si aplica (poblar tabla nueva desde columnas legacy)
4. **Verificación** al final (`SELECT COUNT(*)` con resultado esperado)
5. **Rollback comentado** al final (`-- ROLLBACK: DROP TABLE ...`) — INVEB lo descomenta si necesita revertir

## Inventario actual

| # | Archivo | Tabla afectada | Origen | Estado |
|---|---|---|---|---|
| 001 | `001_create_muestra_salas_corte.sql` | `muestra_salas_corte` (nueva, N:M) | Val 22 brecha P0 #2 | 🟡 Pendiente |
| 002 | `002_create_work_order_cinta_details.sql` | `work_order_cinta_details` (nueva, 1:0..1) | Val 19 mejora schema | 🟡 Pendiente |

## Política de modificaciones

- **NO modificar** scripts ya ejecutados en producción. Crear nuevo script de "fix" o "alter" con número siguiente.
- **NO eliminar** scripts antiguos. Quedan como histórico del schema.
- **Sí permitido:** corregir scripts que aún NO se han ejecutado en ningún ambiente.

## Referencias

- Decisión arquitectónica: `aibo/output/inveb-h1/documento/decision-arquitectonica-opcion-c-h3.md`
- AML v2.0 §13: `aibo/output/inveb-h1/documento/AML_v2.0_TecnoAndina_2026-05.md`
- Val 22 (brecha P0 #2): `aibo/output/inveb-h1/documento/brecha-filtro-sala-corte-tecnico-muestras.md`
- Val 19 (cinta cascada): `aibo/output/inveb-h1/documento/hack-cinta-cascada-decision.md`
