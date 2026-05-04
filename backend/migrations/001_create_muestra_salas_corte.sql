-- =====================================================================
-- Script: 001_create_muestra_salas_corte.sql
-- Fecha:  2026-05-03
-- Autor:  Tecno Andina (Daniela Llano)
-- Origen: Val 22 / Brecha P0 #2 — Filtro Técnico Muestras por sala_corte
-- Doc:    aibo/output/inveb-h1/documento/brecha-filtro-sala-corte-tecnico-muestras.md
--
-- PROPÓSITO
-- ---------
-- Crear tabla N:M `muestra_salas_corte` que normaliza los 8 campos
-- `sala_corte_*` que el legacy mantiene como columnas en la tabla `muestras`:
--   sala_corte_vendedor, sala_corte_diseñador, sala_corte_laboratorio,
--   sala_corte_1, sala_corte_2, sala_corte_3, sala_corte_4, sala_corte_diseñador_revision
--
-- Esta tabla es la fuente de verdad del filtro de Técnico Muestras
-- (rol_id IN (13, 14)) implementado en routers/work_orders.py.
--
-- DEPENDENCIAS
-- ------------
-- - Tabla `muestras` debe existir (legacy) — id es BIGINT UNSIGNED
-- - Tabla `salas_cortes` debe existir (legacy) — id es INT signed
--   IMPORTANTE: el nombre real es `salas_cortes` (plural), NO `salas_corte`
--
-- IDEMPOTENCIA
-- ------------
-- Usa CREATE TABLE IF NOT EXISTS — seguro re-ejecutar.
--
-- HISTORIA DE EJECUCION EN PROD (Railway MySQL)
-- ----------------------------------------------
-- Primera versión falló por tipos incompatibles con tablas legacy:
--   - muestra_id era INT UNSIGNED, debe ser BIGINT UNSIGNED (matchear muestras.id)
--   - sala_corte_id era INT UNSIGNED, debe ser INT signed (matchear salas_cortes.id)
--   - Tabla referenciada era 'salas_corte', el nombre real es 'salas_cortes'
-- Versión corregida ejecutada 2026-05-04T22:50 UTC contra Railway prod.
-- =====================================================================

CREATE TABLE IF NOT EXISTS muestra_salas_corte (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    muestra_id      BIGINT UNSIGNED NOT NULL,
    role            VARCHAR(50)     NOT NULL COMMENT 'vendedor | diseñador | laboratorio | cliente_1 | cliente_2 | cliente_3 | cliente_4 | diseñador_revision',
    sala_corte_id   INT             NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Una sala por role por muestra (no duplicar el rol "vendedor" para la misma muestra)
    UNIQUE KEY uniq_muestra_role (muestra_id, role),

    -- FK explícitas (a diferencia del legacy que NO declara FKs)
    CONSTRAINT fk_muestra_salas_corte_muestra
        FOREIGN KEY (muestra_id) REFERENCES muestras (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_muestra_salas_corte_sala
        FOREIGN KEY (sala_corte_id) REFERENCES salas_cortes (id)
        ON DELETE RESTRICT,

    -- Índice para acelerar el filtro Técnico Muestras (WHERE sala_corte_id = ?)
    KEY idx_sala_corte_id (sala_corte_id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci
COMMENT='Tabla N:M que normaliza los 8 campos sala_corte_* de muestras (val 22)';

-- =====================================================================
-- MIGRACIÓN DE DATOS LEGACY → tabla nueva
-- (responsabilidad INVEB en cutover, descomentar y ejecutar)
-- =====================================================================
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'vendedor', sala_corte_vendedor
-- FROM muestras WHERE sala_corte_vendedor IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'diseñador', sala_corte_diseñador
-- FROM muestras WHERE sala_corte_diseñador IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'laboratorio', sala_corte_laboratorio
-- FROM muestras WHERE sala_corte_laboratorio IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'cliente_1', sala_corte_1
-- FROM muestras WHERE sala_corte_1 IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'cliente_2', sala_corte_2
-- FROM muestras WHERE sala_corte_2 IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'cliente_3', sala_corte_3
-- FROM muestras WHERE sala_corte_3 IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'cliente_4', sala_corte_4
-- FROM muestras WHERE sala_corte_4 IS NOT NULL;
--
-- INSERT INTO muestra_salas_corte (muestra_id, role, sala_corte_id)
-- SELECT id, 'diseñador_revision', sala_corte_diseñador_revision
-- FROM muestras WHERE sala_corte_diseñador_revision IS NOT NULL;

-- =====================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- =====================================================================
-- Esperado: tabla creada con 0 filas (hasta que INVEB ejecute INSERT migración)
--
-- SELECT
--     COUNT(*) AS total_filas,
--     COUNT(DISTINCT muestra_id) AS muestras_con_sala,
--     COUNT(DISTINCT sala_corte_id) AS salas_distintas
-- FROM muestra_salas_corte;

-- =====================================================================
-- ROLLBACK (descomentar para revertir)
-- =====================================================================
-- DROP TABLE IF EXISTS muestra_salas_corte;
