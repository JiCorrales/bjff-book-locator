import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { createApiError } from './errorHandler';

export type RequestUserRole = 'admin' | 'assistant' | 'isMaster';

interface AccessTokenPayload extends JwtPayload {
  // JWT spec defines `sub` as a string; keep compatibility with JwtPayload
  sub?: string;
  role: RequestUserRole;
  email: string;
}

const verifyJwtToken = (
  token: string,
): { role: RequestUserRole; userId: number; email: string } | null => {
  if (!env.AUTH_JWT_SECRET) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.AUTH_JWT_SECRET) as AccessTokenPayload;
    if (!payload.role || !payload.sub) {
      return null;
    }

    return {
      role: payload.role,
      userId: Number(payload.sub),
      email: payload.email,
    };
  } catch {
    return null;
  }
};

const resolveToken = (
  token: string | null | undefined,
): { role: RequestUserRole; userId?: number; email?: string } | null => {
  if (!token) {
    return null;
  }

  const normalized = token.trim();

  if (normalized === env.ADMIN_API_KEY) {
    return { role: 'admin' };
  }

  if (normalized === env.ASSISTANT_API_KEY) {
    return { role: 'assistant' };
  }

  // Optional: special master key
  if (env.MASTER_API_KEY && normalized === env.MASTER_API_KEY) {
    return { role: 'isMaster' };
  }

  return verifyJwtToken(normalized);
};

export const authorize =
  (allowedRoles: RequestUserRole[] = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const details = resolveToken(token);

    if (!details) {
      return next(createApiError('Autenticación requerida.', 401, 'UNAUTHORIZED'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(details.role)) {
      return next(createApiError('No tienes permisos para esta acción.', 403, 'FORBIDDEN'));
    }

    res.locals.userRole = details.role;
    if (details.userId) {
      res.locals.userId = details.userId;
    }
    if (details.email) {
      res.locals.userEmail = details.email;
    }

    return next();
  };

declare module 'express-serve-static-core' {
  interface ResponseLocals {
    userRole?: RequestUserRole;
    userId?: number;
    userEmail?: string;
  }
}
