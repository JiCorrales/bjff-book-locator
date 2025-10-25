-- =========================================================
--  BJFF Book Locator — Full Schema (MySQL 8+)
--  Claves comparables: CHAR(22) ascii_bin (orden byte-a-byte)
-- =========================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- --- OPCIONAL: limpiar completamente el esquema (¡borra datos!) ---
-- DROP SCHEMA IF EXISTS `bjff_book_locator`;

CREATE SCHEMA IF NOT EXISTS `bjff_book_locator`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bjff_book_locator`;

-- =========================================================
-- Tabla: Module_types
-- =========================================================

CREATE TABLE `Module_types` (
  `module_type_id`   INT          NOT NULL AUTO_INCREMENT,
  `type_name`        VARCHAR(50)  NOT NULL COMMENT 'e.g., "standard-double", "triangular", "circular-4"',
  `type_part_count`  INT          NOT NULL COMMENT 'Number of faces this type must have',
  `type_description` TEXT         NULL DEFAULT NULL,
  `is_active`        TINYINT      NULL DEFAULT 1,
  `created_at`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`module_type_id`),
  UNIQUE KEY `uk_module_type_name` (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Types of library modules (defines how many faces each has)';

-- =========================================================
-- Tabla: Modules
-- =========================================================

CREATE TABLE `Modules` (
  `module_id`     INT          NOT NULL AUTO_INCREMENT,
  `range_start`   VARCHAR(30)  NOT NULL COMMENT 'Start of code range (texto original)',
  `range_end`     VARCHAR(30)  NOT NULL COMMENT 'End of code range (texto original)',
  `key_start`     CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Clave canónica fija',
  `key_end`       CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Clave canónica fija',
  `module_name`   VARCHAR(60)  NULL DEFAULT NULL COMMENT 'Descriptive name',
  `module_number` INT          NULL DEFAULT NULL COMMENT 'Physical module number (1..N)',
  `is_active`     TINYINT      NULL DEFAULT 1,
  `is_deleted`    TINYINT      NULL DEFAULT 0,
  `created_at`    DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `module_type_id` INT         NOT NULL,
  PRIMARY KEY (`module_id`),
  UNIQUE KEY `uk_module_number` (`module_number`),
  KEY `idx_modules_type` (`module_type_id`),
  KEY `idx_modules_keyrange` (`key_start`,`key_end`),
  CONSTRAINT `fk_modules_module_types`
    FOREIGN KEY (`module_type_id`) REFERENCES `Module_types`(`module_type_id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ck_modules_key_order` CHECK (`key_start` <= `key_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Tabla: Module_parts
-- =========================================================

CREATE TABLE `Module_parts` (
  `module_part_id` INT          NOT NULL AUTO_INCREMENT,
  `range_start`    VARCHAR(30)  NOT NULL,
  `range_end`      VARCHAR(30)  NOT NULL,
  `key_start`      CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `key_end`        CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `part_name`      VARCHAR(60)  NULL DEFAULT NULL COMMENT '"front","back","A","north", etc.',
  `part_number`    INT          NULL DEFAULT NULL COMMENT 'Physical order within module (1..face_count)',
  `is_active`      TINYINT      NULL DEFAULT 1,
  `is_deleted`     TINYINT      NULL DEFAULT 0,
  `created_at`     DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `module_id`      INT          NOT NULL,
  PRIMARY KEY (`module_part_id`),
  UNIQUE KEY `uk_part_name_per_module`   (`module_id`,`part_name`),
  UNIQUE KEY `uk_part_order_per_module`  (`module_id`,`part_number`),
  KEY `idx_parts_module` (`module_id`),
  KEY `idx_parts_keyrange` (`key_start`,`key_end`),
  CONSTRAINT `fk_parts_modules`
    FOREIGN KEY (`module_id`) REFERENCES `Modules`(`module_id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_parts_key_order` CHECK (`key_start` <= `key_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Tabla: Shelving_units
-- =========================================================

CREATE TABLE `Shelving_units` (
  `shelving_unit_id` INT          NOT NULL AUTO_INCREMENT,
  `range_start`      VARCHAR(30)  NOT NULL,
  `range_end`        VARCHAR(30)  NOT NULL,
  `key_start`        CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `key_end`          CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `unit_name`        VARCHAR(60)  NULL DEFAULT NULL COMMENT 'Ej.: "A","B","C"',
  `unit_number`      INT          NULL DEFAULT NULL COMMENT 'Order within part (left→right)',
  `is_active`        TINYINT      NULL DEFAULT 1,
  `is_deleted`       TINYINT      NULL DEFAULT 0,
  `created_at`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `module_part_id`   INT          NOT NULL,
  PRIMARY KEY (`shelving_unit_id`),
  UNIQUE KEY `uk_unit_name_per_part`   (`module_part_id`,`unit_name`),
  UNIQUE KEY `uk_unit_order_per_part`  (`module_part_id`,`unit_number`),
  KEY `idx_units_part` (`module_part_id`),
  KEY `idx_units_keyrange` (`key_start`,`key_end`),
  CONSTRAINT `fk_units_parts`
    FOREIGN KEY (`module_part_id`) REFERENCES `Module_parts`(`module_part_id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_units_key_order` CHECK (`key_start` <= `key_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Tabla: Shelves
-- =========================================================

CREATE TABLE `Shelves` (
  `shelf_id`         INT          NOT NULL AUTO_INCREMENT,
  `range_start`      VARCHAR(30)  NOT NULL,
  `range_end`        VARCHAR(30)  NOT NULL,
  `key_start`        CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `key_end`          CHAR(22)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `shelf_number`     INT          NULL DEFAULT NULL COMMENT 'Top→bottom (1..N)',
  `is_active`        TINYINT      NULL DEFAULT 1,
  `is_deleted`       TINYINT      NULL DEFAULT 0,
  `created_at`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `shelving_unit_id` INT          NOT NULL,
  PRIMARY KEY (`shelf_id`),
  UNIQUE KEY `uk_shelf_order_per_unit` (`shelving_unit_id`,`shelf_number`),
  KEY `idx_shelves_unit` (`shelving_unit_id`),
  KEY `idx_shelves_keyrange` (`key_start`,`key_end`),
  CONSTRAINT `fk_shelves_units`
    FOREIGN KEY (`shelving_unit_id`) REFERENCES `Shelving_units`(`shelving_unit_id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ck_shelves_key_order` CHECK (`key_start` <= `key_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Vista: v_complete_structure (para responder al front)
-- =========================================================

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
  ) AS full_location

FROM `Modules` m
JOIN `Module_parts`    mp ON mp.module_id = m.module_id
   AND mp.is_deleted = 0 AND mp.is_active = 1
JOIN `Shelving_units`  u  ON u.module_part_id = mp.module_part_id
   AND u.is_deleted = 0 AND u.is_active = 1
JOIN `Shelves`         s  ON s.shelving_unit_id = u.shelving_unit_id
   AND s.is_deleted = 0 AND s.is_active = 1
WHERE m.is_deleted = 0 AND m.is_active = 1;

-- Índices auxiliares para pintar mapa (orden físico)
CREATE INDEX `idx_modules_order` ON `Modules` (`module_number`);
CREATE INDEX `idx_parts_order`   ON `Module_parts` (`module_id`,`part_number`);
CREATE INDEX `idx_units_order`   ON `Shelving_units` (`module_part_id`,`unit_number`);
CREATE INDEX `idx_shelves_order` ON `Shelves` (`shelving_unit_id`,`shelf_number`);

-- =========================================================
-- Restaurar settings
-- =========================================================
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;