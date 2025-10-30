import { Request, Response } from 'express';
import { listShelves } from '../models/structure.models';

export async function getShelvesItems(_req: Request, res: Response) {
  try {
    const data = await listShelves();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error('[shelves] GET /items failed:', err);
    res.status(500).json({ success: false, message: 'Error al obtener anaqueles' });
  }
}