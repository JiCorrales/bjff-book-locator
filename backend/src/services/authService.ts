import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  UserRole,
  getUserCredentialsByEmail,
} from '../models/userModel';
import { createApiError } from '../middleware/errorHandler';

interface LoginResult {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
  };
}

const hashPassword = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const resolvePrimaryRole = (roles: UserRole[]): UserRole => {
  if (roles.includes('isMaster')) {
    return 'isMaster';
  }
  if (roles.includes('admin')) {
    return 'admin';
  }
  if (roles.includes('assistant')) {
    return 'assistant';
  }
  return roles[0] ?? 'assistant';
};

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    if (!email || !password) {
      throw createApiError('Correo y contraseña son obligatorios.', 400, 'VALIDATION_ERROR');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await getUserCredentialsByEmail(normalizedEmail);

    if (!record || record.isDeleted || !record.isActive) {
      throw createApiError('Credenciales inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    const hashed = hashPassword(password);
    if (hashed !== record.passwordHash) {
      throw createApiError('Credenciales inválidas.', 401, 'INVALID_CREDENTIALS');
    }

    if (!env.AUTH_JWT_SECRET) {
      throw createApiError('Configuración de autenticación incompleta.', 500, 'AUTH_CONFIG_MISSING');
    }

    const role = resolvePrimaryRole(record.roles);
    const token = jwt.sign(
      {
        // `sub` should be a string to satisfy JwtPayload typings
        sub: String(record.id),
        role,
        email: record.email,
      },
      env.AUTH_JWT_SECRET,
      { expiresIn: '8h' },
    );

    return {
      token,
      user: {
        id: record.id,
        email: record.email,
        fullName: `${record.firstName} ${record.lastName}`.trim(),
        role,
      },
    };
  },
};

export type AuthService = typeof authService;
