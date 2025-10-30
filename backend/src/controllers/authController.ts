import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { createApiError } from '../middleware/errorHandler';

export const  login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      throw createApiError('Correo y contraseña son obligatorios.', 400, 'VALIDATION_ERROR');
    }

    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
