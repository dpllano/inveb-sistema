-- =====================================================================
-- Script: 002_create_work_order_cinta_details.sql
-- Fecha:  2026-05-03
-- Autor:  Tecno Andina (Daniela Llano)
-- Origen: Val 19 — Hack cinta cascada (mejora schema "cuando se puede")
-- Doc:    aibo/output/inveb-h1/documento/hack-cinta-cascada-decision.md
--
-- PROPÓSITO
-- ---------
-- Crear tabla `work_order_cinta_details` que extrae los 8 campos de cinta
-- que el legacy mantiene como columnas en `work_orders`:
--   corte_liner, tipo_cinta, distancia_cinta_1..6
--
-- Estos campos solo tienen sentido cuando work_orders.cinta = 1.
-- En el legacy son NULL la mayoría del tiempo, ensuciando la tabla principal.
-- La extracción a 1:0..1 normaliza el schema sin romper paridad de API
-- (Pydantic mantiene el formato plano legacy para el cliente).
--
-- DEPENDENCIAS
-- ------------
-- - Tabla `work_orders` debe existir (legacy) — id es BIGINT UNSIGNED
--
-- IDEMPOTENCIA
-- ------------
-- Usa CREATE TABLE IF NOT EXISTS — seguro re-ejecutar.
--
-- HISTORIA DE EJECUCION EN PROD (Railway MySQL)
-- ----------------------------------------------
-- Primera versión falló por:
--   - work_order_id era INT UNSIGNED, debe ser BIGINT UNSIGNED (matchear work_orders.id)
--   - work_orders usa engine MyISAM (NO InnoDB) por lo que NO soporta FK constraints.
--     La FK fue removida; integridad referencial queda a cargo del código de aplicación
--     (mismo enfoque que el resto del legacy).
-- Versión corregida ejecutada 2026-05-04T22:52 UTC contra Railway prod.
-- =====================================================================

CREATE TABLE IF NOT EXISTS work_order_cinta_details (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    work_order_id       BIGINT UNSIGNED NOT NULL,
    corte_liner         INT             NULL,
    tipo_cinta          INT             NULL,
    distancia_cinta_1   INT             NULL,
    distancia_cinta_2   INT             NULL,
    distancia_cinta_3   INT             NULL,
    distancia_cinta_4   INT             NULL,
    distancia_cinta_5   INT             NULL,
    distancia_cinta_6   INT             NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Una sola fila de detalles por work_order (relación 1:0..1)
    UNIQUE KEY uniq_work_order (work_order_id),

    -- INDEX en lugar de FK (work_orders es MyISAM, no soporta FKs)
    KEY idx_work_order_id (work_order_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
COMMENT='Detalles de cinta extraídos de work_orders (val 19) — solo presentes cuando cinta=1';

-- =====================================================================
-- MIGRACIÓN DE DATOS LEGACY → tabla nueva
-- (responsabilidad INVEB en cutover, descomentar y ejecutar)
-- =====================================================================
--
-- INSERT INTO work_order_cinta_details (
--     work_order_id, corte_liner, tipo_cinta,
--     distancia_cinta_1, distancia_cinta_2, distancia_cinta_3,
--     distancia_cinta_4, distancia_cinta_5, distancia_cinta_6
-- )
-- SELECT
--     id, corte_liner, tipo_cinta,
--     distancia_cinta_1, distancia_cinta_2, distancia_cinta_3,
--     distancia_cinta_4, distancia_cinta_5, distancia_cinta_6
-- FROM work_orders
-- WHERE cinta = 1;

-- =====================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- =====================================================================
-- Esperado: tabla creada con 0 filas (hasta que INVEB ejecute INSERT migración).
-- Después de INSERT, comparar:
--
-- SELECT
--     (SELECT COUNT(*) FROM work_orders WHERE cinta = 1) AS legacy_con_cinta,
--     (SELECT COUNT(*) FROM work_order_cinta_details)    AS detalles_migrados;
--
-- Ambos números deben ser iguales.

-- =====================================================================
-- POLÍTICA POST-CUTOVER
-- =====================================================================
-- Las 8 columnas legacy en work_orders (corte_liner, tipo_cinta,
-- distancia_cinta_*) NO se eliminan automáticamente. Quedan como
-- redundancia controlada para rollback. Su eliminación se programa
-- en H3 post-cutover una vez confirmada la estabilidad del nuevo flujo.

-- =====================================================================
-- ROLLBACK (descomentar para revertir)
-- =====================================================================
-- DROP TABLE IF EXISTS work_order_cinta_details;
