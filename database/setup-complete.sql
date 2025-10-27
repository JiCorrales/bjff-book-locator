-- =========================================================
-- Setup completo de la base de datos BJFF Book Locator
-- =========================================================
--
-- Este script ejecuta todas las migraciones y seeds necesarias
-- para configurar la base de datos desde cero.
--
-- Uso:
--   mysql -u root -p < database/setup-complete.sql
--
-- =========================================================

-- 1. Crear el esquema y las tablas
SOURCE database/migrations/001_create_library_structure.sql;
-- Crear tablas de Users/Roles desde el modelo (no usadas antes)
SOURCE database/model/sqlCreation.sql;

-- 2. Insertar datos de ejemplo (incluye Module_types)
SOURCE database/seeds/001_insert_sample_data.sql;

-- 2.1 Insertar usuarios, roles y relaciones
SOURCE database/seeds/002_insert_users.sql;

-- 3. Verificar que todo se insertó correctamente
SELECT
    '=== RESUMEN DE DATOS INSERTADOS ===' as '';

SELECT
    (SELECT COUNT(*) FROM Module_types) as module_types,
    (SELECT COUNT(*) FROM Modules) as modules,
    (SELECT COUNT(*) FROM Module_parts) as parts,
    (SELECT COUNT(*) FROM Shelving_units) as units,
    (SELECT COUNT(*) FROM Shelves) as shelves;

SELECT
    '=== ESTRUCTURA ESPERADA ===' as '';

SELECT
    '1 Module_type' as module_types,
    '2 Modules' as modules,
    '4 Module_parts (2 caras × 2 módulos)' as parts,
    '32 Shelving_units (8 units × 4 caras)' as units,
    '160 Shelves (5 shelves × 32 units)' as shelves;

SELECT
    '' as '',
    '⚠️  NOTA: Las claves comparables (key_start, key_end) están vacías' as mensaje,
    'Ejecuta el script de actualización de claves para calcularlas' as accion;
