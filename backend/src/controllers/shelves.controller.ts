import { Request, Response } from 'express';
import { listShelves } from '../models/structure.models';
import { updateShelfRange, setShelfActive, updateShelf } from '../services/structureUpdate.service';
import { createApiError } from '../middleware/errorHandler';

export async function getShelvesItems(_req: Request, res: Response) {
  try {
    const data = await listShelves();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error('[shelves] GET /items failed:', err);
    res.status(500).json({ success: false, message: 'Error al obtener anaqueles' });
  }
}

export async function putShelfRange(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { range_start, range_end } = req.body || {};
    if (!id || !range_start || !range_end) {
      throw createApiError('Parámetros inválidos: id, range_start y range_end son requeridos', 400, 'INVALID_PARAMS');
    }
    const result = await updateShelfRange(id, { range_start, range_end });
    res.json(result);
  } catch (err: any) {
    console.error('[shelves] PUT /items/:id failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar anaquel' });
  }
}

export async function patchShelfActive(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body || {};
    if (!id || typeof is_active !== 'boolean') {
      throw createApiError('Parámetros inválidos: id y is_active(boolean) son requeridos', 400, 'INVALID_PARAMS');
    }
    const result = await setShelfActive(id, is_active);
    res.json(result);
  } catch (err: any) {
    console.error('[shelves] PATCH /items/:id/active failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar estado del anaquel' });
  }
}

export async function patchShelf(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { shelf_number, range_start, range_end } = req.body || {};
    
    if (!id) {
      throw createApiError('ID del anaquel es requerido', 400, 'INVALID_PARAMS');
    }

    // Validar que al menos un campo esté presente
    if (shelf_number === undefined && !range_start && !range_end) {
      throw createApiError('Al menos un campo debe ser proporcionado para actualizar', 400, 'NO_FIELDS');
    }

    // Si se proporcionan rangos, ambos deben estar presentes
    if ((range_start && !range_end) || (!range_start && range_end)) {
      throw createApiError('Si se actualiza el rango, tanto range_start como range_end son requeridos', 400, 'INCOMPLETE_RANGE');
    }

    const payload: any = {};
    if (shelf_number !== undefined) payload.shelf_number = shelf_number;
    if (range_start && range_end) {
      payload.range_start = range_start;
      payload.range_end = range_end;
    }

    const result = await updateShelf(id, payload);
    res.json(result);
  } catch (err: any) {
    console.error('[shelves] PATCH /items/:id failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar anaquel' });
  }
}