import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { RequestUserRole } from '../middleware/auth.middleware';

const getActorRole = (res: Response): RequestUserRole => {
  const role = res.locals.userRole;
  if (!role) {
    throw new Error('No se pudo determinar el rol del usuario autenticado.');
  }
  return role;
};

export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await userService.listUsers(getActorRole(res));
    res.json({ success: true, items: data });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const user = await userService.getUser(getActorRole(res), id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await userService.createUser(getActorRole(res), req.body);
    res.status(201).json({ success: true, user: created });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const updated = await userService.updateUser(getActorRole(res), id, req.body);
    res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await userService.deleteUser(getActorRole(res), id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
