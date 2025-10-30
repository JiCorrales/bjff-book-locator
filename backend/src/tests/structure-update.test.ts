import { getConnection, PoolConnection, pool } from '../config/database';
import {
  updateModuleRange,
  setModuleActive,
  updateShelvingUnitRange,
  setShelvingUnitActive,
  updateShelfRange,
  setShelfActive,
} from '../services/structureUpdate.service';

import { RowDataPacket } from 'mysql2/promise';

async function selectOne(sql: string, params: any[] = [], conn: PoolConnection) {
  const [rows] = await conn.query<RowDataPacket[]>(sql, params);
  return rows[0] as any;
}

describe('Structure update services (transactional)', () => {
  afterAll(async () => {
    await pool.end();
  });
  test('Module range update and active toggle are transactional', async () => {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const mod = await selectOne('SELECT module_id, range_start, range_end, updated_at, is_active FROM Modules WHERE is_deleted = 0 ORDER BY module_id LIMIT 1', [], conn);
      expect(mod).toBeTruthy();

      const original = { ...mod };
      const newEnd = original.range_end.replace(/9+ Z999z$/, '888 Z999z');

      await updateModuleRange(mod.module_id, { range_start: original.range_start, range_end: newEnd }, conn);

      const afterUpdate = await selectOne('SELECT range_start, range_end, updated_at FROM Modules WHERE module_id = ?', [mod.module_id], conn);
      expect(afterUpdate.range_end).toBe(newEnd);
      expect(new Date(afterUpdate.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(original.updated_at).getTime());

      await setModuleActive(mod.module_id, !original.is_active, conn);
      const afterToggle = await selectOne('SELECT is_active FROM Modules WHERE module_id = ?', [mod.module_id], conn);
      expect(afterToggle.is_active).toBe(!original.is_active ? 1 : 0);

      await conn.rollback();
    } finally {
      conn.release();
    }
  }, 30000);

  test('Shelving unit range update and active toggle are transactional', async () => {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const unit = await selectOne('SELECT shelving_unit_id, range_start, range_end, updated_at, is_active FROM Shelving_units WHERE is_deleted = 0 ORDER BY shelving_unit_id LIMIT 1', [], conn);
      expect(unit).toBeTruthy();

      const original = { ...unit };
      const newEnd = original.range_end.replace(/9+ Z999z$/, '888 Z999z');

      await updateShelvingUnitRange(unit.shelving_unit_id, { range_start: original.range_start, range_end: newEnd }, conn);

      const afterUpdate = await selectOne('SELECT range_end, updated_at FROM Shelving_units WHERE shelving_unit_id = ?', [unit.shelving_unit_id], conn);
      expect(afterUpdate.range_end).toBe(newEnd);
      expect(new Date(afterUpdate.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(original.updated_at).getTime());

      await setShelvingUnitActive(unit.shelving_unit_id, !original.is_active, conn);
      const afterToggle = await selectOne('SELECT is_active FROM Shelving_units WHERE shelving_unit_id = ?', [unit.shelving_unit_id], conn);
      expect(afterToggle.is_active).toBe(!original.is_active ? 1 : 0);

      await conn.rollback();
    } finally {
      conn.release();
    }
  }, 30000);

  test('Shelf range update and active toggle are transactional', async () => {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      const shelf = await selectOne('SELECT shelf_id, range_start, range_end, updated_at, is_active FROM Shelves WHERE is_deleted = 0 ORDER BY shelf_id LIMIT 1', [], conn);
      expect(shelf).toBeTruthy();

      const original = { ...shelf };
      const newEnd = original.range_end.replace(/9+ Z999z$/, '888 Z999z');

      await updateShelfRange(shelf.shelf_id, { range_start: original.range_start, range_end: newEnd }, conn);

      const afterUpdate = await selectOne('SELECT range_end, updated_at FROM Shelves WHERE shelf_id = ?', [shelf.shelf_id], conn);
      expect(afterUpdate.range_end).toBe(newEnd);
      expect(new Date(afterUpdate.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(original.updated_at).getTime());

      await setShelfActive(shelf.shelf_id, !original.is_active, conn);
      const afterToggle = await selectOne('SELECT is_active FROM Shelves WHERE shelf_id = ?', [shelf.shelf_id], conn);
      expect(afterToggle.is_active).toBe(!original.is_active ? 1 : 0);

      await conn.rollback();
    } finally {
      conn.release();
    }
  }, 30000);

  test('Validation: range_start must be <= range_end (keys)', async () => {
    const conn = await getConnection();
    try {
      await conn.beginTransaction();
      const mod = await selectOne('SELECT module_id, range_start FROM Modules WHERE is_deleted = 0 ORDER BY module_id LIMIT 1', [], conn);
      await expect(
        updateModuleRange(mod.module_id, { range_start: '519.999 Z999z', range_end: '510 A100a' }, conn),
      ).rejects.toHaveProperty('statusCode', 400);
      await conn.rollback();
    } finally {
      conn.release();
    }
  }, 30000);
});