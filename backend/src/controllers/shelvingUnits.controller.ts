import { Request, Response } from 'express';
import { listShelvingUnits } from '../models/structure.models';

export async function getShelvingUnitsItems(_req: Request, res: Response) {
  try {
    const data = await listShelvingUnits();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error('[shelving-units] GET /items failed:', err);
    res.status(500).json({ success: false, message: 'Error al obtener estantes' });
  }
}