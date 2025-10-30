import { Request, Response } from 'express';
import { listModules } from '../models/structure.models';
import { updateModuleRange, setModuleActive, updateModule } from '../services/structureUpdate.service';
import { createApiError } from '../middleware/errorHandler';

export async function getModulesItems(_req: Request, res: Response) {
  try {
    const data = await listModules();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error('[modules] GET /items failed:', err);
    res.status(500).json({ success: false, message: 'Error al obtener módulos' });
  }
}

export async function putModuleRange(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { range_start, range_end } = req.body || {};
    if (!id || !range_start || !range_end) {
      throw createApiError('Parámetros inválidos: id, range_start y range_end son requeridos', 400, 'INVALID_PARAMS');
    }
    const result = await updateModuleRange(id, { range_start, range_end });
    res.json(result);
  } catch (err: any) {
    console.error('[modules] PUT /items/:id failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar módulo' });
  }
}

export async function patchModuleActive(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { is_active } = req.body || {};
    if (!id || typeof is_active !== 'boolean') {
      throw createApiError('Parámetros inválidos: id y is_active(boolean) son requeridos', 400, 'INVALID_PARAMS');
    }
    const result = await setModuleActive(id, is_active);
    res.json(result);
  } catch (err: any) {
    console.error('[modules] PATCH /items/:id/active failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar estado del módulo' });
  }
}

export async function patchModule(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const { module_name, module_number, range_start, range_end } = req.body || {};
    
    if (!id) {
      throw createApiError('ID del módulo es requerido', 400, 'INVALID_PARAMS');
    }

    // Validar que al menos un campo esté presente
    if (module_name === undefined && module_number === undefined && !range_start && !range_end) {
      throw createApiError('Al menos un campo debe ser proporcionado para actualizar', 400, 'NO_FIELDS');
    }

    // Si se proporcionan rangos, ambos deben estar presentes
    if ((range_start && !range_end) || (!range_start && range_end)) {
      throw createApiError('Si se actualiza el rango, tanto range_start como range_end son requeridos', 400, 'INCOMPLETE_RANGE');
    }

    const payload: any = {};
    if (module_name !== undefined) payload.module_name = module_name;
    if (module_number !== undefined) payload.module_number = module_number;
    if (range_start && range_end) {
      payload.range_start = range_start;
      payload.range_end = range_end;
    }

    const result = await updateModule(id, payload);
    res.json(result);
  } catch (err: any) {
    console.error('[modules] PATCH /items/:id failed:', err);
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || 'Error al actualizar módulo' });
  }
}