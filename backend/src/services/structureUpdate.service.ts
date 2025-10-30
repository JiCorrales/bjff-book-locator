import { PoolConnection, queryRows, withTransaction } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';
import { parseClassificationCode } from '../utils/classificationParser/parser';
import { logChange } from '../utils/logger';
import { createApiError } from '../middleware/errorHandler';

type Entity = 'Modules' | 'Shelving_units' | 'Shelves';

interface RangeUpdatePayload {
  range_start: string;
  range_end: string;
}

interface ModuleUpdatePayload extends RangeUpdatePayload {
  module_name?: string;
  module_number?: number;
}

interface ShelvingUnitUpdatePayload extends RangeUpdatePayload {
  unit_name?: string;
  unit_number?: number;
}

interface ShelfUpdatePayload extends RangeUpdatePayload {
  shelf_number?: number;
}

function validateAndComputeKeys(range_start: string, range_end: string) {
  const parsedStart = parseClassificationCode(range_start);
  const parsedEnd = parseClassificationCode(range_end);
  const keyStart = parsedStart.comparableKey;
  const keyEnd = parsedEnd.comparableKey;

  if (keyStart > keyEnd) {
    throw createApiError('El rango es inválido: range_start debe ser menor o igual a range_end', 400, 'INVALID_RANGE_ORDER');
  }

  return { keyStart, keyEnd };
}

async function updateRangeGeneric(
  entity: Entity,
  idColumn: string,
  id: number,
  payload: RangeUpdatePayload,
  conn?: PoolConnection,
) {
  const runner = async (connection: PoolConnection) => {
    const rows = await queryRows<RowDataPacket>(
      `SELECT * FROM ${entity} WHERE ${idColumn} = ? AND is_deleted = 0 LIMIT 1`,
      [id],
      connection,
    );
    if (rows.length === 0) {
      throw createApiError(`${entity} con id=${id} no encontrado`, 404, 'NOT_FOUND');
    }

    const before = rows[0] as any;

    const { keyStart, keyEnd } = validateAndComputeKeys(payload.range_start, payload.range_end);

    // Actualizar rango y claves comparables; updated_at se auto-actualiza por ON UPDATE CURRENT_TIMESTAMP
    await connection.query(
      `UPDATE ${entity}
       SET range_start = ?, range_end = ?, key_start = ?, key_end = ?
       WHERE ${idColumn} = ?`,
      [payload.range_start, payload.range_end, keyStart, keyEnd, id],
    );

    const afterRows = await queryRows<RowDataPacket>(
      `SELECT * FROM ${entity} WHERE ${idColumn} = ? LIMIT 1`,
      [id],
      connection,
    );
    const after = afterRows[0] as any;

    logChange({
      timestamp: new Date().toISOString(),
      entity,
      id,
      action: 'update_range',
      before: {
        range_start: before.range_start,
        range_end: before.range_end,
        key_start: before.key_start,
        key_end: before.key_end,
      },
      after: {
        range_start: after.range_start,
        range_end: after.range_end,
        key_start: after.key_start,
        key_end: after.key_end,
      },
    });

    return { success: true };
  };

  if (conn) {
    return runner(conn);
  }
  return withTransaction(runner);
}

async function toggleActiveGeneric(
  entity: Entity,
  idColumn: string,
  id: number,
  is_active: boolean,
  conn?: PoolConnection,
) {
  const runner = async (connection: PoolConnection) => {
    const rows = await queryRows<RowDataPacket>(
      `SELECT is_active FROM ${entity} WHERE ${idColumn} = ? AND is_deleted = 0 LIMIT 1`,
      [id],
      connection,
    );
    if (rows.length === 0) {
      throw createApiError(`${entity} con id=${id} no encontrado`, 404, 'NOT_FOUND');
    }
    const before = rows[0] as any;

    await connection.query(
      `UPDATE ${entity} SET is_active = ? WHERE ${idColumn} = ?`,
      [is_active ? 1 : 0, id],
    );

    logChange({
      timestamp: new Date().toISOString(),
      entity,
      id,
      action: 'toggle_active',
      before: { is_active: before.is_active },
      after: { is_active },
    });

    return { success: true };
  };

  if (conn) {
    return runner(conn);
  }
  return withTransaction(runner);
}

// Public API
export async function updateModuleRange(module_id: number, payload: RangeUpdatePayload, conn?: PoolConnection) {
  return updateRangeGeneric('Modules', 'module_id', module_id, payload, conn);
}

export async function updateModule(module_id: number, payload: ModuleUpdatePayload, conn?: PoolConnection) {
  const runner = async (connection: PoolConnection) => {
    const rows = await queryRows<RowDataPacket>(
      `SELECT * FROM Modules WHERE module_id = ? AND is_deleted = 0 LIMIT 1`,
      [module_id],
      connection,
    );
    if (rows.length === 0) {
      throw createApiError(`Módulo con id=${module_id} no encontrado`, 404, 'NOT_FOUND');
    }

    const before = rows[0] as any;

    // Validar claves comparables si se actualizan los rangos
    let keyStart = before.key_start;
    let keyEnd = before.key_end;
    if (payload.range_start && payload.range_end) {
      const keys = validateAndComputeKeys(payload.range_start, payload.range_end);
      keyStart = keys.keyStart;
      keyEnd = keys.keyEnd;
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];

    if (payload.module_name !== undefined) {
      updates.push('module_name = ?');
      values.push(payload.module_name);
    }
    if (payload.module_number !== undefined) {
      updates.push('module_number = ?');
      values.push(payload.module_number);
    }
    if (payload.range_start !== undefined) {
      updates.push('range_start = ?');
      values.push(payload.range_start);
    }
    if (payload.range_end !== undefined) {
      updates.push('range_end = ?');
      values.push(payload.range_end);
    }
    if (payload.range_start && payload.range_end) {
      updates.push('key_start = ?', 'key_end = ?');
      values.push(keyStart, keyEnd);
    }

    if (updates.length === 0) {
      throw createApiError('No hay campos para actualizar', 400, 'NO_UPDATES');
    }

    values.push(module_id);

    await connection.query(
      `UPDATE Modules SET ${updates.join(', ')} WHERE module_id = ?`,
      values,
    );

    const afterRows = await queryRows<RowDataPacket>(
      `SELECT * FROM Modules WHERE module_id = ? LIMIT 1`,
      [module_id],
      connection,
    );
    const after = afterRows[0] as any;

    logChange({
      timestamp: new Date().toISOString(),
      entity: 'Modules',
      id: module_id,
      action: 'update_full',
      before,
      after,
    });

    return {
      success: true,
      message: 'Módulo actualizado exitosamente',
      data: after,
    };
  };

  return conn ? runner(conn) : withTransaction(runner);
}

export async function updateShelvingUnitRange(shelving_unit_id: number, payload: RangeUpdatePayload, conn?: PoolConnection) {
  return updateRangeGeneric('Shelving_units', 'shelving_unit_id', shelving_unit_id, payload, conn);
}

export async function updateShelvingUnit(shelving_unit_id: number, payload: ShelvingUnitUpdatePayload, conn?: PoolConnection) {
  const runner = async (connection: PoolConnection) => {
    const rows = await queryRows<RowDataPacket>(
      `SELECT * FROM Shelving_units WHERE shelving_unit_id = ? AND is_deleted = 0 LIMIT 1`,
      [shelving_unit_id],
      connection,
    );
    if (rows.length === 0) {
      throw createApiError(`Estante con id=${shelving_unit_id} no encontrado`, 404, 'NOT_FOUND');
    }

    const before = rows[0] as any;

    // Validar claves comparables si se actualizan los rangos
    let keyStart = before.key_start;
    let keyEnd = before.key_end;
    if (payload.range_start && payload.range_end) {
      const keys = validateAndComputeKeys(payload.range_start, payload.range_end);
      keyStart = keys.keyStart;
      keyEnd = keys.keyEnd;
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];

    if (payload.unit_name !== undefined) {
      updates.push('unit_name = ?');
      values.push(payload.unit_name);
    }
    if (payload.unit_number !== undefined) {
      updates.push('unit_number = ?');
      values.push(payload.unit_number);
    }
    if (payload.range_start !== undefined) {
      updates.push('range_start = ?');
      values.push(payload.range_start);
    }
    if (payload.range_end !== undefined) {
      updates.push('range_end = ?');
      values.push(payload.range_end);
    }
    if (payload.range_start && payload.range_end) {
      updates.push('key_start = ?', 'key_end = ?');
      values.push(keyStart, keyEnd);
    }

    if (updates.length === 0) {
      throw createApiError('No hay campos para actualizar', 400, 'NO_UPDATES');
    }

    values.push(shelving_unit_id);

    await connection.query(
      `UPDATE Shelving_units SET ${updates.join(', ')} WHERE shelving_unit_id = ?`,
      values,
    );

    const afterRows = await queryRows<RowDataPacket>(
      `SELECT * FROM Shelving_units WHERE shelving_unit_id = ? LIMIT 1`,
      [shelving_unit_id],
      connection,
    );
    const after = afterRows[0] as any;

    logChange({
      timestamp: new Date().toISOString(),
      entity: 'Shelving_units',
      id: shelving_unit_id,
      action: 'update_full',
      before,
      after,
    });

    return {
      success: true,
      message: 'Estante actualizado exitosamente',
      data: after,
    };
  };

  return conn ? runner(conn) : withTransaction(runner);
}

export async function updateShelfRange(shelf_id: number, payload: RangeUpdatePayload, conn?: PoolConnection) {
  return updateRangeGeneric('Shelves', 'shelf_id', shelf_id, payload, conn);
}

export async function updateShelf(shelf_id: number, payload: ShelfUpdatePayload, conn?: PoolConnection) {
  const runner = async (connection: PoolConnection) => {
    const rows = await queryRows<RowDataPacket>(
      `SELECT * FROM Shelves WHERE shelf_id = ? AND is_deleted = 0 LIMIT 1`,
      [shelf_id],
      connection,
    );
    if (rows.length === 0) {
      throw createApiError(`Anaquel con id=${shelf_id} no encontrado`, 404, 'NOT_FOUND');
    }

    const before = rows[0] as any;

    // Validar claves comparables si se actualizan los rangos
    let keyStart = before.key_start;
    let keyEnd = before.key_end;
    if (payload.range_start && payload.range_end) {
      const keys = validateAndComputeKeys(payload.range_start, payload.range_end);
      keyStart = keys.keyStart;
      keyEnd = keys.keyEnd;
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];

    if (payload.shelf_number !== undefined) {
      updates.push('shelf_number = ?');
      values.push(payload.shelf_number);
    }
    if (payload.range_start !== undefined) {
      updates.push('range_start = ?');
      values.push(payload.range_start);
    }
    if (payload.range_end !== undefined) {
      updates.push('range_end = ?');
      values.push(payload.range_end);
    }
    if (payload.range_start && payload.range_end) {
      updates.push('key_start = ?', 'key_end = ?');
      values.push(keyStart, keyEnd);
    }

    if (updates.length === 0) {
      throw createApiError('No hay campos para actualizar', 400, 'NO_UPDATES');
    }

    values.push(shelf_id);

    await connection.query(
      `UPDATE Shelves SET ${updates.join(', ')} WHERE shelf_id = ?`,
      values,
    );

    const afterRows = await queryRows<RowDataPacket>(
      `SELECT * FROM Shelves WHERE shelf_id = ? LIMIT 1`,
      [shelf_id],
      connection,
    );
    const after = afterRows[0] as any;

    logChange({
      timestamp: new Date().toISOString(),
      entity: 'Shelves',
      id: shelf_id,
      action: 'update_full',
      before,
      after,
    });

    return {
      success: true,
      message: 'Anaquel actualizado exitosamente',
      data: after,
    };
  };

  return conn ? runner(conn) : withTransaction(runner);
}

export async function setModuleActive(module_id: number, is_active: boolean, conn?: PoolConnection) {
  return toggleActiveGeneric('Modules', 'module_id', module_id, is_active, conn);
}

export async function setShelvingUnitActive(shelving_unit_id: number, is_active: boolean, conn?: PoolConnection) {
  return toggleActiveGeneric('Shelving_units', 'shelving_unit_id', shelving_unit_id, is_active, conn);
}

export async function setShelfActive(shelf_id: number, is_active: boolean, conn?: PoolConnection) {
  return toggleActiveGeneric('Shelves', 'shelf_id', shelf_id, is_active, conn);
}