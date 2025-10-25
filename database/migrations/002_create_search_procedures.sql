-- =====================================================================
-- STORED PROCEDURES PARA BÚSQUEDA DE LIBROS
-- =====================================================================
-- Archivo: 002_create_search_procedures.sql
-- Descripción: Define procedimientos almacenados para buscar la ubicación
--              física de libros usando códigos de clasificación.
-- Autor: BJFF Book Locator Team
-- Fecha: 2024-10-24
-- =====================================================================

USE `bjff_book_locator`;

DELIMITER $$

-- =====================================================================
-- PROCEDIMIENTO: find_book_location
-- =====================================================================
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
--
-- Ejemplo de uso:
--   CALL find_book_location('005.133 M152p2', 'DAA005133000M152000P02');
--   CALL find_book_location('CR863 L318p7', 'LCR863000000L318000P07');
--
-- Notas:
--   - La búsqueda usa comparación lexicográfica de claves comparables
--   - Si no se encuentra ubicación, retorna result set vacío
--   - Las claves comparables deben ser calculadas previamente por el parser
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

-- =====================================================================
-- PROCEDIMIENTO: search_books_in_range
-- =====================================================================
-- Propósito:
--   Busca todos los estantes que contienen códigos dentro de un rango
--   específico. Útil para buscar grupos de libros relacionados.
--
-- Parámetros:
--   IN p_start_key CHAR(22) - Clave comparable de inicio del rango
--   IN p_end_key CHAR(22)   - Clave comparable de fin del rango
--
-- Retorna:
--   Result set con todos los estantes que intersectan con el rango buscado
--
-- Ejemplo de uso:
--   -- Buscar todos los estantes de programación (005-006)
--   CALL search_books_in_range('DAA0050000000000000000', 'DAA0069999999999999Z99');
--
-- =====================================================================

DROP PROCEDURE IF EXISTS search_books_in_range$$

CREATE PROCEDURE search_books_in_range(
    IN p_start_key CHAR(22),
    IN p_end_key CHAR(22)
)
BEGIN
    SELECT
        m.module_name,
        mp.part_name AS face_identifier,
        su.unit_name AS unit_identifier,
        s.shelf_number AS shelf_level,
        s.range_start,
        s.range_end,
        s.key_start,
        s.key_end

    FROM Shelves s
    INNER JOIN Shelving_units su ON s.shelving_unit_id = su.shelving_unit_id
    INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
    INNER JOIN Modules m ON mp.module_id = m.module_id

    -- Encontrar estantes cuyo rango intersecta con el rango buscado
    WHERE s.key_start <= p_end_key
      AND s.key_end >= p_start_key

    ORDER BY m.module_id, mp.face_identifier, su.unit_identifier, s.shelf_level;

END$$

-- =====================================================================
-- PROCEDIMIENTO: get_module_summary
-- =====================================================================
-- Propósito:
--   Obtiene un resumen de todos los módulos de la biblioteca con sus
--   rangos de códigos y cantidad de estantes.
--
-- Parámetros:
--   Ninguno
--
-- Retorna:
--   Result set con información resumida de todos los módulos
--
-- Ejemplo de uso:
--   CALL get_module_summary();
--
-- =====================================================================

DROP PROCEDURE IF EXISTS get_module_summary$$

CREATE PROCEDURE get_module_summary()
BEGIN
    SELECT
        m.module_id,
        m.module_name,
        m.module_number,
        mt.type_name AS module_type_name,
        m.range_start,
        m.range_end,
        m.key_start,
        m.key_end,
        COUNT(DISTINCT mp.module_part_id) AS total_faces,
        COUNT(DISTINCT su.shelving_unit_id) AS total_units,
        COUNT(DISTINCT s.shelf_id) AS total_shelves

    FROM Modules m
    LEFT JOIN Module_types mt ON m.module_type_id = mt.module_type_id
    LEFT JOIN Module_parts mp ON m.module_id = mp.module_id
    LEFT JOIN Shelving_units su ON mp.module_part_id = su.module_part_id
    LEFT JOIN Shelves s ON su.shelving_unit_id = s.shelving_unit_id

    GROUP BY m.module_id, m.module_name, m.module_number, mt.type_name,
             m.range_start, m.range_end, m.key_start, m.key_end

    ORDER BY m.module_id;

END$$

DELIMITER ;

-- =====================================================================
-- TESTING DE PROCEDIMIENTOS
-- =====================================================================
-- Descomentar para probar los procedimientos después de la creación:

-- Test 1: Buscar ubicación de un libro específico de programación
-- CALL find_book_location('510.5 A500a', 'DAA510500000A500000A00');

-- Test 2: Buscar todos los estantes de matemáticas (510-519)
-- CALL search_books_in_range('DAA5100000000000000000', 'DAA519999000Z999000Z99');

-- Test 3: Ver resumen de todos los módulos
-- CALL get_module_summary();

-- =====================================================================
-- FIN DEL ARCHIVO
-- =====================================================================
