import { PoolConnection, query, queryRows, withTransaction } from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

export type UserRole = 'admin' | 'assistant' | 'isMaster';

export interface UserRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  role: UserRole;
  roles: UserRole[];
  tecId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredentialsRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  isDeleted: boolean;
  roles: UserRole[];
}

export interface CreateUserModelInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  role: UserRole;
  tecId?: string;
}

export interface UpdateUserModelInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  passwordHash?: string;
  isActive?: boolean;
  role?: UserRole;
  tecId?: string | null;
}

const mapRowToUser = (row: any): UserRecord => {
  const roles = (row.roles as string | null)?.split(',').filter(Boolean) as UserRole[] | undefined;
  const primaryRole = roles?.[0] ?? 'assistant';

  return {
    id: Number(row.userID),
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    isActive: Boolean(row.isActive),
    role: primaryRole,
    roles: roles ?? [],
    tecId: row.tecID ?? null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : '',
  };
};

const resolveRoleId = async (role: UserRole, conn: PoolConnection): Promise<number> => {
  const existing = await queryRows<RowDataPacket>(
    'SELECT rolesID FROM Roles WHERE name = ? LIMIT 1',
    [role],
    conn,
  );

  if (existing.length > 0) {
    return Number(existing[0].rolesID);
  }

  await query(
    `INSERT INTO Roles (rolesID, name)
     VALUES ((SELECT COALESCE(MAX(rolesID), 0) + 1 FROM Roles AS r), ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    [role],
    conn,
  );

  const created = await queryRows<RowDataPacket>(
    'SELECT rolesID FROM Roles WHERE name = ? LIMIT 1',
    [role],
    conn,
  );

  if (!created.length) {
    throw new Error(`No se pudo registrar el rol ${role}.`);
  }

  return Number(created[0].rolesID);
};

const nextUserId = async (conn: PoolConnection): Promise<number> => {
  const rows = await queryRows<RowDataPacket>(
    'SELECT COALESCE(MAX(userID), 100) AS maxId FROM Users',
    [],
    conn,
  );

  const maxId = rows.length ? Number(rows[0].maxId) : 100;
  return maxId + 1;
};

export async function listUsers(): Promise<UserRecord[]> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT
       u.userID,
       u.firstName,
       u.lastName,
       u.email,
       u.isActive,
       u.createdAt,
       u.updatedAt,
       GROUP_CONCAT(r.name ORDER BY r.rolesID) AS roles,
       ap.tecID
     FROM Users u
     LEFT JOIN Users_Roles ur ON ur.userID = u.userID
     LEFT JOIN Roles r ON r.rolesID = ur.rolesID
     LEFT JOIN AssistantProfiles ap ON ap.userID = u.userID
     WHERE u.isDeleted = 0
     GROUP BY u.userID, ap.tecID, u.firstName, u.lastName, u.email, u.isActive, u.createdAt, u.updatedAt
     ORDER BY u.updatedAt DESC`,
  );

  return rows.map(mapRowToUser);
}

export async function getUserById(userId: number): Promise<UserRecord | null> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT
       u.userID,
       u.firstName,
       u.lastName,
       u.email,
       u.isActive,
       u.createdAt,
       u.updatedAt,
       GROUP_CONCAT(r.name ORDER BY r.rolesID) AS roles,
       ap.tecID
     FROM Users u
     LEFT JOIN Users_Roles ur ON ur.userID = u.userID
     LEFT JOIN Roles r ON r.rolesID = ur.rolesID
     LEFT JOIN AssistantProfiles ap ON ap.userID = u.userID
     WHERE u.userID = ?
     GROUP BY u.userID, ap.tecID, u.firstName, u.lastName, u.email, u.isActive, u.createdAt, u.updatedAt
     LIMIT 1`,
    [userId],
  );

  if (!rows.length) {
    return null;
  }

  return mapRowToUser(rows[0]);
}

export async function getUserCredentialsByEmail(
  email: string,
): Promise<UserCredentialsRecord | null> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT
       u.userID,
       u.firstName,
       u.lastName,
       u.email,
       u.password,
       u.isActive,
       u.isDeleted,
       GROUP_CONCAT(r.name ORDER BY r.rolesID) AS roles
     FROM Users u
     LEFT JOIN Users_Roles ur ON ur.userID = u.userID
     LEFT JOIN Roles r ON r.rolesID = ur.rolesID
     WHERE u.email = ?
     GROUP BY u.userID, u.firstName, u.lastName, u.email, u.password, u.isActive, u.isDeleted
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    return null;
  }

  const row = rows[0] as any;
  const roles = (row.roles as string | null)?.split(',').filter(Boolean) as UserRole[] | undefined;

  return {
    id: Number(row.userID),
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    passwordHash: row.password,
    isActive: Boolean(row.isActive),
    isDeleted: Boolean(row.isDeleted),
    roles: roles ?? [],
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const rows = await queryRows<RowDataPacket>(
    `SELECT
       u.userID,
       u.firstName,
       u.lastName,
       u.email,
       u.isActive,
       u.createdAt,
       u.updatedAt,
       GROUP_CONCAT(r.name ORDER BY r.rolesID) AS roles,
       ap.tecID
     FROM Users u
     LEFT JOIN Users_Roles ur ON ur.userID = u.userID
     LEFT JOIN Roles r ON r.rolesID = ur.rolesID
     LEFT JOIN AssistantProfiles ap ON ap.userID = u.userID
     WHERE u.email = ?
     GROUP BY u.userID, ap.tecID, u.firstName, u.lastName, u.email, u.isActive, u.createdAt, u.updatedAt
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    return null;
  }

  return mapRowToUser(rows[0]);
}

export async function createUser(data: CreateUserModelInput): Promise<UserRecord> {
  return withTransaction(async (conn) => {
    const userId = await nextUserId(conn);

    await query(
      `INSERT INTO Users
        (userID, firstName, lastName, email, password, isActive, isDeleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
      [
        userId,
        data.firstName,
        data.lastName,
        data.email,
        data.passwordHash,
        data.isActive ? 1 : 0,
      ],
      conn,
    );

    const roleId = await resolveRoleId(data.role, conn);

    await query(
      `INSERT INTO Users_Roles (userID, rolesID)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE rolesID = VALUES(rolesID)`,
      [userId, roleId],
      conn,
    );

    if (data.role === 'admin' || data.role === 'isMaster') {
      await query(
        'INSERT INTO AdminProfiles (userID) VALUES (?) ON DUPLICATE KEY UPDATE userID = VALUES(userID)',
        [userId],
        conn,
      );
      await query('DELETE FROM AssistantProfiles WHERE userID = ?', [userId], conn);
    } else if (data.role === 'assistant') {
      await query(
        'INSERT INTO AssistantProfiles (userID, tecID) VALUES (?, ?) ON DUPLICATE KEY UPDATE tecID = VALUES(tecID)',
        [userId, data.tecId ?? null],
        conn,
      );
      await query('DELETE FROM AdminProfiles WHERE userID = ?', [userId], conn);
    }

    const created = await getUserById(userId);
    if (!created) {
      throw new Error('No se pudo recuperar el usuario recién creado.');
    }

    return created;
  });
}

export async function updateUser(
  userId: number,
  data: UpdateUserModelInput,
): Promise<UserRecord | null> {
  return withTransaction(async (conn) => {
    const fields: string[] = [];
    const params: Array<string | number | null> = [];

    if (data.firstName !== undefined) {
      fields.push('firstName = ?');
      params.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push('lastName = ?');
      params.push(data.lastName);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      params.push(data.email);
    }
    if (data.passwordHash !== undefined) {
      fields.push('password = ?');
      params.push(data.passwordHash);
    }
    if (data.isActive !== undefined) {
      fields.push('isActive = ?');
      params.push(data.isActive ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push('updatedAt = NOW()');
      await query(
        `UPDATE Users SET ${fields.join(', ')} WHERE userID = ?`,
        [...params, userId],
        conn,
      );
    }

    if (data.role) {
      const roleId = await resolveRoleId(data.role, conn);
      await query('DELETE FROM Users_Roles WHERE userID = ?', [userId], conn);
      await query('INSERT INTO Users_Roles (userID, rolesID) VALUES (?, ?)', [userId, roleId], conn);

      if (data.role === 'admin' || data.role === 'isMaster') {
        await query(
          'INSERT INTO AdminProfiles (userID) VALUES (?) ON DUPLICATE KEY UPDATE userID = VALUES(userID)',
          [userId],
          conn,
        );
        await query('DELETE FROM AssistantProfiles WHERE userID = ?', [userId], conn);
      }

      if (data.role === 'assistant') {
        await query(
          'INSERT INTO AssistantProfiles (userID, tecID) VALUES (?, ?) ON DUPLICATE KEY UPDATE tecID = VALUES(tecID)',
          [userId, data.tecId ?? null],
          conn,
        );
        await query('DELETE FROM AdminProfiles WHERE userID = ?', [userId], conn);
      }
    } else if (data.tecId !== undefined) {
      // Only update assistant profile if role not changing but tecId provided.
      await query(
        'UPDATE AssistantProfiles SET tecID = ? WHERE userID = ?',
        [data.tecId, userId],
        conn,
      );
    }

    const updated = await getUserById(userId);
    return updated;
  });
}

export async function softDeleteUser(userId: number): Promise<void> {
  await withTransaction(async (conn) => {
    await query(
      'UPDATE Users SET isDeleted = 1, isActive = 0, updatedAt = NOW() WHERE userID = ?',
      [userId],
      conn,
    );

    await query('DELETE FROM Users_Roles WHERE userID = ?', [userId], conn);
    await query('DELETE FROM AdminProfiles WHERE userID = ?', [userId], conn);
    await query('DELETE FROM AssistantProfiles WHERE userID = ?', [userId], conn);
  });
}
