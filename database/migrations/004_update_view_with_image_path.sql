-- =========================================================
--  BJFF Book Locator — Migration 004
--  Update vw_complete_structure view to include image_path
-- =========================================================

USE `bjff_book_locator`;

-- Recreate the view to include image_path
DROP VIEW IF EXISTS `vw_complete_structure`;
CREATE VIEW `vw_complete_structure` AS
SELECT
  m.module_id,
  m.module_number,
  m.module_name,
  mp.module_part_id,
  mp.part_name        AS part_identifier,
  mp.part_number      AS part_order,
  u.shelving_unit_id,
  u.unit_name         AS unit_identifier,
  u.unit_number       AS unit_order,
  s.shelf_id,
  s.shelf_number      AS shelf_order,
  s.image_path        AS shelf_image_path,

  -- Rango de la capa fina (shelf)
  s.range_start       AS shelf_range_start,
  s.range_end         AS shelf_range_end,
  s.key_start         AS shelf_key_start,
  s.key_end           AS shelf_key_end,

  -- Texto amigable
  CONCAT(
    'Module ', COALESCE(m.module_number,'?'),
    ' - ',     COALESCE(mp.part_name,'?'),
    ' - Unit ',COALESCE(u.unit_name, u.unit_number),
    ' - Shelf ',COALESCE(s.shelf_number,'?')
  ) AS location_text,

  -- Estado
  s.is_active,
  s.is_deleted

FROM Modules m
  INNER JOIN Module_parts    mp ON mp.module_id         = m.module_id
  INNER JOIN Shelving_units  u  ON u.module_part_id     = mp.module_part_id
  INNER JOIN Shelves         s  ON s.shelving_unit_id   = u.shelving_unit_id

WHERE m.is_deleted = 0
  AND mp.is_deleted = 0
  AND s.is_deleted = 0
ORDER BY
  m.module_number,
  mp.part_number,
  u.unit_number,
  s.shelf_number;
