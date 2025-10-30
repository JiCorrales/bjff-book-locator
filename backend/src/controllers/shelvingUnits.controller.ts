import { Request, Response } from 'express';
import { listShelvingUnits } from '../models/structure.models';
import { updateShelvingUnitRange, setShelvingUnitActive, updateShelvingUnit } from '../services/structureUpdate.service';
import { createApiError } from '../middleware/errorHandler';

export async function getShelvingUnitsItems(_req: Request, res: Response) {
  try {
    const data = await listShelvingUnits();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error('[shelving-units] GET /items failed:', err);
    res.status(500).json({ success: false, message: 'Error al obtener estantes' });
  }
}

export async function putShelvingUnitRange(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { range_start, range_end } = req.body || {};
    if (!id || !range_start || !range_end) {
      throw createApiError('Parámetros inválidos: id, range_start y range_end son requeridos', 400, 'INVALID_PARAMS');
    }
    const result = await updateShelvingUnitRange(id, { range_start, range_end });
    res.json(result);
  } catch (err: any) {
    console.error('[shelving-units] PUT /items/:id failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar estante' });
  }
}

export async function patchShelvingUnitActive(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body || {};
    if (!id || typeof is_active !== 'boolean') {
      throw createApiError('Parámetros inválidos: id y is_active(boolean) son requeridos', 400, 'INVALID_PARAMS');
    }
    const result = await setShelvingUnitActive(id, is_active);
    res.json(result);
  } catch (err: any) {
    console.error('[shelving-units] PATCH /items/:id/active failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar estado del estante' });
  }
}

export async function patchShelvingUnit(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { unit_name, unit_number, range_start, range_end } = req.body || {};
    
    if (!id) {
      throw createApiError('ID del estante es requerido', 400, 'INVALID_PARAMS');
    }

    // Validar que al menos un campo esté presente
    if (unit_name === undefined && unit_number === undefined && !range_start && !range_end) {
      throw createApiError('Al menos un campo debe ser proporcionado para actualizar', 400, 'NO_FIELDS');
    }

    // Si se proporcionan rangos, ambos deben estar presentes
    if ((range_start && !range_end) || (!range_start && range_end)) {
      throw createApiError('Si se actualiza el rango, tanto range_start como range_end son requeridos', 400, 'INCOMPLETE_RANGE');
    }

    const payload: any = {};
    if (unit_name !== undefined) payload.unit_name = unit_name;
    if (unit_number !== undefined) payload.unit_number = unit_number;
    if (range_start && range_end) {
      payload.range_start = range_start;
      payload.range_end = range_end;
    }

    const result = await updateShelvingUnit(id, payload);
    res.json(result);
  } catch (err: any) {
    console.error('[shelving-units] PATCH /items/:id failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar estante' });
  }
}