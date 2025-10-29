-- =========================================================
--  BJFF Book Locator — Migration 003
--  Add image_path column to Shelves table
--  Purpose: Link each shelf to its visualization image
-- =========================================================

USE `bjff_book_locator`;

-- Add image_path column to Shelves table
ALTER TABLE `Shelves`
ADD COLUMN `image_path` VARCHAR(255) NULL DEFAULT NULL COMMENT 'Path to shelf visualization image' AFTER `shelf_number`;

-- Create index for faster image lookups
CREATE INDEX `idx_shelves_image_path` ON `Shelves`(`image_path`);

-- Update all existing shelves with their corresponding image paths
-- Image naming convention: output_final/module{N}/{face}/s{unit}_r{shelf}.jpg
-- where unit: 1-8 (A-H), shelf: 1-5 (top to bottom)

UPDATE Shelves s
INNER JOIN Shelving_units su ON s.shelving_unit_id = su.shelving_unit_id
INNER JOIN Module_parts mp ON su.module_part_id = mp.module_part_id
INNER JOIN Modules m ON mp.module_id = m.module_id
SET s.image_path = CONCAT(
    'output_final/module',
    m.module_number,
    '/',
    mp.part_name,
    '/s',
    su.unit_number,
    '_r',
    s.shelf_number,
    '.jpg'
);

-- Verify the update (optional check)
-- SELECT shelf_id, range_start, range_end, image_path FROM Shelves LIMIT 10;

-- Add comment to document the change
ALTER TABLE `Shelves`
COMMENT = 'Individual shelves within shelving units, with image paths to visualization files';
