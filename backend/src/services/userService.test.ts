import { userService } from './userService';
import {
  createUser as createUserModel,
  getUserByEmail,
  getUserById,
  listUsers as listUsersModel,
  softDeleteUser,
  updateUser as updateUserModel,
} from '../models/userModel';

jest.mock('../models/userModel');

describe('userService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('listUsers', () => {
    it('retorna usuarios mapeados', async () => {
      (listUsersModel as jest.Mock).mockResolvedValue([
        {
          id: 101,
          firstName: 'Ana',
          lastName: 'Asistente',
          email: 'assistant@example.com',
          isActive: true,
          role: 'assistant',
          roles: ['assistant'],
          tecId: 'TEC000001',
          createdAt: '2025-10-01T10:00:00Z',
          updatedAt: '2025-10-02T10:00:00Z',
        },
      ]);

      const response = await userService.listUsers('assistant');
      expect(response[0]).toMatchObject({
        id: 101,
        fullName: 'Ana Asistente',
        role: 'assistant',
        tecId: 'TEC000001',
      });
    });
  });

  describe('createUser', () => {
    it('valida email duplicado', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValueOnce({ id: 10 });

      await expect(
        userService.createUser('admin', {
          firstName: 'Nuevo',
          lastName: 'Usuario',
          email: 'duplicate@example.com',
          password: 'secret123',
          confirmPassword: 'secret123',
          role: 'admin',
        }),
      ).rejects.toThrow('El correo electrónico ya está registrado.');
    });

    it('crea usuario cuando los datos son válidos', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValueOnce(null);
      (createUserModel as jest.Mock).mockResolvedValue({
        id: 120,
        firstName: 'Nuevo',
        lastName: 'Admin',
        email: 'new@example.com',
        isActive: true,
        role: 'admin',
        roles: ['admin'],
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      });

      const result = await userService.createUser('admin', {
        firstName: 'Nuevo',
        lastName: 'Admin',
        email: 'new@example.com',
        password: 'secret123',
        confirmPassword: 'secret123',
        role: 'admin',
      });

      expect(createUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Nuevo',
          lastName: 'Admin',
          email: 'new@example.com',
          isActive: true,
        }),
      );

      expect(result).toMatchObject({
        id: 120,
        fullName: 'Nuevo Admin',
        role: 'admin',
      });
    });
  });

  describe('updateUser', () => {
    it('actualiza usuario cuando existe', async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue(null);
      (updateUserModel as jest.Mock).mockResolvedValue({
        id: 101,
        firstName: 'Ana',
        lastName: 'Actualizada',
        email: 'assistant@example.com',
        isActive: true,
        role: 'assistant',
        roles: ['assistant'],
        tecId: 'TEC000001',
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-03T00:00:00Z',
      });

      const result = await userService.updateUser('admin', 101, {
        lastName: 'Actualizada',
      });

      expect(updateUserModel).toHaveBeenCalledWith(
        101,
        expect.objectContaining({ lastName: 'Actualizada' }),
      );
      expect(result.fullName).toBe('Ana Actualizada');
    });
  });

  describe('deleteUser', () => {
    it('lanza error cuando el usuario no existe', async () => {
      (getUserById as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser('admin', 999)).rejects.toThrow('Usuario no encontrado.');
    });

    it('realiza eliminación lógica cuando existe', async () => {
      (getUserById as jest.Mock).mockResolvedValue({
        id: 101,
        firstName: 'Ana',
        lastName: 'Asistente',
      });

      await userService.deleteUser('admin', 101);
      expect(softDeleteUser).toHaveBeenCalledWith(101);
    });
  });
});
