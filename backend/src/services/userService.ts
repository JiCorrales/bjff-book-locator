import { createHash } from 'crypto';
import {
  CreateUserModelInput,
  UpdateUserModelInput,
  UserRecord,
  UserRole,
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  softDeleteUser,
  updateUser,
} from '../models/userModel';
import { createApiError } from '../middleware/errorHandler';
import { RequestUserRole } from '../middleware/auth.middleware';
import { logChange } from '../utils/logger';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  isActive?: boolean;
  tecId?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: UserRole;
  isActive?: boolean;
  tecId?: string | null;
}

const ALLOWED_ROLES: UserRole[] = ['admin', 'assistant', 'isMaster'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeName = (value: string) => value.trim();

const hashPassword = (password: string): string =>
  createHash('sha256').update(password).digest('hex');

const ensureAdminOrMaster = (actor: RequestUserRole) => {
  if (!['admin', 'isMaster'].includes(actor)) {
    throw createApiError('No tienes permisos para realizar esta acción.', 403, 'FORBIDDEN');
  }
};

const mapUserToDto = (user: UserRecord) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  isActive: user.isActive,
  role: user.role,
  roles: user.roles,
  tecId: user.tecId ?? undefined,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateRole = (role: UserRole) => {
  if (!ALLOWED_ROLES.includes(role)) {
    throw createApiError(`Rol ${role} no permitido.`, 400, 'INVALID_ROLE');
  }
};

const validateCreatePayload = async (payload: CreateUserPayload) => {
  const { firstName, lastName, email, password, confirmPassword, role, tecId } = payload;

  if (!firstName || firstName.trim().length < 2) {
    throw createApiError('El nombre debe tener al menos 2 caracteres.', 400, 'INVALID_FIRST_NAME');
  }

  if (!lastName || lastName.trim().length < 2) {
    throw createApiError(
      'El apellido debe tener al menos 2 caracteres.',
      400,
      'INVALID_LAST_NAME',
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createApiError('El correo electrónico no es válido.', 400, 'INVALID_EMAIL');
  }

  if (!password || password.length < 8) {
    throw createApiError(
      'La contraseña debe tener al menos 8 caracteres.',
      400,
      'INVALID_PASSWORD',
    );
  }

  if (password !== confirmPassword) {
    throw createApiError('Las contraseñas no coinciden.', 400, 'PASSWORD_MISMATCH');
  }

  validateRole(role);

  if (role === 'assistant' && (!tecId || tecId.trim().length < 4)) {
    throw createApiError(
      'El asistente requiere un TecID válido (mínimo 4 caracteres).',
      400,
      'INVALID_TEC_ID',
    );
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    throw createApiError('El correo electrónico ya está registrado.', 409, 'EMAIL_IN_USE');
  }
};

const validateUpdatePayload = async (userId: number, payload: UpdateUserPayload) => {
  if (payload.email && !EMAIL_REGEX.test(payload.email)) {
    throw createApiError('El correo electrónico no es válido.', 400, 'INVALID_EMAIL');
  }

  if (payload.password && payload.password.length < 8) {
    throw createApiError(
      'La contraseña debe tener al menos 8 caracteres.',
      400,
      'INVALID_PASSWORD',
    );
  }

  if (payload.password && payload.confirmPassword && payload.password !== payload.confirmPassword) {
    throw createApiError('Las contraseñas no coinciden.', 400, 'PASSWORD_MISMATCH');
  }

  if (payload.role) {
    validateRole(payload.role);
  }

  if (payload.role === 'assistant' && payload.tecId !== undefined) {
    if (!payload.tecId || payload.tecId.trim().length < 4) {
      throw createApiError(
        'El asistente requiere un TecID válido (mínimo 4 caracteres).',
        400,
        'INVALID_TEC_ID',
      );
    }
  }

  if (payload.email) {
    const existing = await getUserByEmail(payload.email);
    if (existing && existing.id !== userId) {
      throw createApiError('El correo electrónico ya está registrado.', 409, 'EMAIL_IN_USE');
    }
  }
};

export const userService = {
  async listUsers(actorRole: RequestUserRole) {
    if (!['admin', 'isMaster'].includes(actorRole)) {
      throw createApiError('No tienes permisos para ver usuarios.', 403, 'FORBIDDEN');
    }

    const users = await listUsers();
    return users.map(mapUserToDto);
  },

  async getUser(actorRole: RequestUserRole, userId: number) {
    if (!['admin', 'isMaster'].includes(actorRole)) {
      throw createApiError('No tienes permisos para ver usuarios.', 403, 'FORBIDDEN');
    }

    const user = await getUserById(userId);
    if (!user) {
      throw createApiError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }

    return mapUserToDto(user);
  },

  async createUser(actorRole: RequestUserRole, payload: CreateUserPayload) {
    ensureAdminOrMaster(actorRole);
    await validateCreatePayload(payload);

    // Admins can only create assistants; isMaster can create admin or assistant
    if (actorRole === 'admin' && payload.role !== 'assistant') {
      throw createApiError('Los administradores solo pueden crear asistentes.', 403, 'FORBIDDEN');
    }
    if (actorRole === 'isMaster' && !['admin', 'assistant'].includes(payload.role)) {
      throw createApiError('El super administrador solo crea admins o asistentes.', 400, 'INVALID_ROLE');
    }

    const record: CreateUserModelInput = {
      firstName: normalizeName(payload.firstName),
      lastName: normalizeName(payload.lastName),
      email: payload.email.trim().toLowerCase(),
      passwordHash: hashPassword(payload.password),
      isActive: payload.isActive ?? true,
      role: payload.role,
      tecId: payload.role === 'assistant' ? payload.tecId?.trim() : undefined,
    };

    const created = await createUser(record);
    logChange({
      timestamp: new Date().toISOString(),
      entity: 'Users',
      id: created.id,
      action: 'create_user',
      after: { email: created.email, role: created.role, isActive: created.isActive },
    });
    return mapUserToDto(created);
  },

  async updateUser(actorRole: RequestUserRole, userId: number, payload: UpdateUserPayload) {
    ensureAdminOrMaster(actorRole);
    await validateUpdatePayload(userId, payload);

    // Admins cannot change role to admin or isMaster; they may only set assistant
    if (actorRole === 'admin' && payload.role && payload.role !== 'assistant') {
      throw createApiError('Los administradores no pueden asignar rol distinto a asistente.', 403, 'FORBIDDEN');
    }

    const record: UpdateUserModelInput = {};

    if (payload.firstName !== undefined) {
      if (!payload.firstName || payload.firstName.trim().length < 2) {
        throw createApiError('El nombre debe tener al menos 2 caracteres.', 400, 'INVALID_FIRST_NAME');
      }
      record.firstName = normalizeName(payload.firstName);
    }

    if (payload.lastName !== undefined) {
      if (!payload.lastName || payload.lastName.trim().length < 2) {
        throw createApiError(
          'El apellido debe tener al menos 2 caracteres.',
          400,
          'INVALID_LAST_NAME',
        );
      }
      record.lastName = normalizeName(payload.lastName);
    }

    if (payload.email !== undefined) {
      record.email = payload.email.trim().toLowerCase();
    }

    if (payload.password) {
      record.passwordHash = hashPassword(payload.password);
    }

    if (payload.isActive !== undefined) {
      record.isActive = payload.isActive;
    }

    if (payload.role) {
      record.role = payload.role;
    }

    if (payload.tecId !== undefined) {
      record.tecId = payload.tecId?.trim() ?? null;
    }

    const before = await getUserById(userId);
    const updated = await updateUser(userId, record);
    if (!updated) {
      throw createApiError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }
    logChange({
      timestamp: new Date().toISOString(),
      entity: 'Users',
      id: userId,
      action: 'update_user',
      before: before ? { email: before.email, role: before.role, isActive: before.isActive } : undefined,
      after: { email: updated.email, role: updated.role, isActive: updated.isActive },
    });
    return mapUserToDto(updated);
  },

  async deleteUser(actorRole: RequestUserRole, userId: number) {
    ensureAdminOrMaster(actorRole);

    const existing = await getUserById(userId);
    if (!existing) {
      throw createApiError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }

    await softDeleteUser(userId);
    logChange({
      timestamp: new Date().toISOString(),
      entity: 'Users',
      id: userId,
      action: 'delete_user',
      before: { email: existing.email, role: existing.role, isActive: existing.isActive },
    });
  },
};

export type UserService = typeof userService;
