-- =====================================================================
-- ACTUALIZACIÓN DE STORED PROCEDURES CON IMAGE_PATH
-- =====================================================================
-- Archivo: 005_update_search_procedures_with_image_path.sql
-- Descripción: Actualiza el procedimiento find_book_location para incluir
--              el campo image_path en los resultados de búsqueda.
-- Autor: BJFF Book Locator Team
-- Fecha: 2025-10-29
-- =====================================================================

USE `bjff_book_locator`;

DELIMITER $$

-- =====================================================================
-- PROCEDIMIENTO ACTUALIZADO: find_book_location
-- =====================================================================
-- Cambios:
--   - Agregado campo s.image_path en el SELECT
--   - Permite obtener la ruta de la imagen del estante junto con la ubicación
--
-- Propósito:
--   Busca la ubicación física completa de un libro dado su código
--   de clasificación (Dewey o LATAM) y una clave comparable pre-calculada.
--
-- Parámetros:
--   IN p_classification_code VARCHAR(30)  - Código de clasificación original
--   IN p_comparable_key CHAR(22)          - Clave comparable de 22 chars
--
-- Retorna:
--   Result set con información completa de ubicación física:
--   - Información del módulo (nombre, rango)
--   - Información de la cara/parte del módulo
--   - Información de la unidad de estantería
--   - Información del estante específico
--   - Ruta de la imagen de visualización del estante
--
-- Ejemplo de uso:
--   CALL find_book_location('510.5 A500a', 'DAA510500000A500000A00');
--   CALL find_book_location('CR863 L318p7', 'LCR863000000L318000P07');
-- =====================================================================

DROP PROCEDURE IF EXISTS find_book_location$$

CREATE PROCEDURE find_book_location(
    IN p_classification_code VARCHAR(30),
    IN p_comparable_key CHAR(22)
)
BEGIN
    -- Buscar el estante que contiene el código
    SELECT
        -- Información del módulo
        m.module_id,
        m.module_name AS module_name,
        m.range_start AS module_range_start,
        m.range_end AS module_range_end,
        mt.type_name AS module_type,
        m.module_number AS module_number,

        -- Información de la cara/parte del módulo
        mp.module_part_id,
        mp.part_name AS face_name,
        mp.range_start AS face_range_start,
        mp.range_end AS face_range_end,

        -- Información de la unidad de estantería
        su.shelving_unit_id,
        su.unit_name AS unit_name,
        su.range_start AS unit_range_start,
        su.range_end AS unit_range_end,

        -- Información del estante específico
        s.shelf_id,
        s.shelf_number AS shelf_level,
        s.range_start AS shelf_range_start,
        s.range_end AS shelf_range_end,

        -- *** NUEVO: Ruta de la imagen del estante ***
        s.image_path,

        -- Código buscado
        p_classification_code AS searched_code,
        p_comparable_key AS searched_key

    FROM Shelves s

    -- JOIN con unidad de estantería
    INNER JOIN Shelving_units su
        ON s.shelving_unit_id = su.shelving_unit_id

    -- JOIN con cara/parte del módulo
    INNER JOIN Module_parts mp
        ON su.module_part_id = mp.module_part_id

    -- JOIN con módulo
    INNER JOIN Modules m
        ON mp.module_id = m.module_id

    -- JOIN con tipo de módulo
    LEFT JOIN Module_types mt
        ON m.module_type_id = mt.module_type_id

    -- Condición de búsqueda: el código debe estar dentro del rango del estante
    WHERE p_comparable_key >= s.key_start
      AND p_comparable_key <= s.key_end

    -- Ordenar por nivel de estante (de arriba hacia abajo)
    ORDER BY s.shelf_number ASC

    -- Limitar a un solo resultado (el primer estante que contenga el libro)
    LIMIT 1;

END$$

DELIMITER ;

-- =====================================================================
-- TESTING DEL PROCEDIMIENTO ACTUALIZADO
-- =====================================================================
-- Descomentar para probar:

-- Test: Verificar que el procedimiento devuelve el image_path
-- CALL find_book_location('510.5 A500a', 'DAA510500000A500000A00');

-- El resultado debe incluir un campo adicional:
-- image_path: output_final/module1/front/s1_r1.jpg (o similar)

-- =====================================================================
-- FIN DEL ARCHIVO
-- =====================================================================
