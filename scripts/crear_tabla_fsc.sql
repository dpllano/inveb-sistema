-- Script para crear tabla FSC en Railway
-- Fuente: Laravel migracion 2021_09_15_105008_create_table_fsc.php
-- Modelo: app/Fsc.php
-- Ejecutar en MySQL de Railway si la tabla no existe

-- Verificar si la tabla ya existe
SELECT 'Verificando existencia de tabla fsc...' AS status;

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS fsc (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    codigo TINYINT NOT NULL,
    active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_fsc_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos solo si la tabla esta vacia
INSERT INTO fsc (descripcion, codigo, active, created_at, updated_at)
SELECT * FROM (
    SELECT 'No' as descripcion, 0 as codigo, 1 as active, NOW() as created_at, NOW() as updated_at
    UNION ALL SELECT 'Si', 1, 1, NOW(), NOW()
    UNION ALL SELECT 'Sin FSC', 2, 1, NOW(), NOW()
    UNION ALL SELECT 'Logo FSC solo EEII', 3, 1, NOW(), NOW()
    UNION ALL SELECT 'Logo FSC cliente y EEII', 4, 1, NOW(), NOW()
    UNION ALL SELECT 'Logo FSC solo cliente', 5, 1, NOW(), NOW()
    UNION ALL SELECT 'FSC solo facturacion', 6, 1, NOW(), NOW()
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM fsc LIMIT 1);

-- Verificar resultado
SELECT 'Tabla fsc creada/verificada exitosamente' AS resultado;
SELECT * FROM fsc ORDER BY codigo;
