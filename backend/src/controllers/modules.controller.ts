import { Request, Response } from 'express';
import { listModules } from '../models/structure.models';

export async function getModulesItems(_req: Request, res: Response) {
  try {
    const data = await listModules();
    res.json({ success: true, items: data });
  } catch (err) {
    console.error('[modules] GET /items failed:', err);
    res.status(500).json({ success: false, message: 'Error al obtener módulos' });
  }
}