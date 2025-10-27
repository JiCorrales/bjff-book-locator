-- =========================================================
-- Seed de Users, Roles y relaciones (admin, assistant, isMaster)
-- =========================================================
USE `bjff_book_locator`;

-- 1) Roles básicos
INSERT INTO `Roles` (`rolesID`, `name`) VALUES
  (1, 'admin'),
  (2, 'assistant'),
  (3, 'isMaster')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2) Usuarios de ejemplo (passwords con SHA-256)
INSERT INTO `Users` (
  `userID`, `firstName`, `lastName`, `email`, `password`,
  `isActive`, `isDeleted`, `createdAt`, `updatedAt`
) VALUES
  (101, 'Ana',  'Asistente',    'assistant@example.com', SHA2('assistant123', 256), 1, 0, NOW(), NOW()),
  (102, 'Adán', 'Administrador', 'admin@example.com',     SHA2('admin123',     256), 1, 0, NOW(), NOW()),
  (103, 'Root', 'Master',        'root@example.com',      SHA2('root123',      256), 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `firstName`=VALUES(`firstName`),
  `lastName`=VALUES(`lastName`),
  `email`=VALUES(`email`),
  `password`=VALUES(`password`),
  `isActive`=VALUES(`isActive`),
  `isDeleted`=VALUES(`isDeleted`),
  `updatedAt`=VALUES(`updatedAt`);

-- 3) Perfiles por rol (coherentes con las tablas del modelo)
-- AdminProfiles: admin y master
INSERT INTO `AdminProfiles` (`userID`) VALUES
  (102),
  (103)
ON DUPLICATE KEY UPDATE `userID` = VALUES(`userID`);

-- AssistantProfiles: assistant requiere tecID
INSERT INTO `AssistantProfiles` (`userID`, `tecID`) VALUES
  (101, 'TEC000001')
ON DUPLICATE KEY UPDATE `tecID` = VALUES(`tecID`);

-- 4) Asignaciones de roles a usuarios
INSERT INTO `Users_Roles` (`userID`, `rolesID`) VALUES
  (101, 2), -- assistant
  (102, 1), -- admin
  (103, 1), -- master también es admin
  (103, 3)  -- master
ON DUPLICATE KEY UPDATE `userID` = VALUES(`userID`), `rolesID` = VALUES(`rolesID`);