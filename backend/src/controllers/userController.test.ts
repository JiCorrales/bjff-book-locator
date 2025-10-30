jest.mock('../config/env', () => {
  const actual = jest.requireActual('../config/env');
  return {
    env: {
      ...actual.env,
      ADMIN_API_KEY: 'admin-token',
      ASSISTANT_API_KEY: 'assistant-token',
    },
  };
});

import express from 'express';
import request from 'supertest';
import usersRouter from '../routes/users';
import { userService } from '../services/userService';

jest.mock('../services/userService');

const mockedService = userService as jest.Mocked<typeof userService>;

const buildApp = (role: 'admin' | 'assistant' = 'admin') => {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    res.locals.userRole = role;
    next();
  });
  app.use('/api/users', usersRouter);
  return app;
};

describe('userController routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /api/users responde con listado', async () => {
    mockedService.listUsers.mockResolvedValueOnce([
      {
        id: 101,
        firstName: 'Ana',
        lastName: 'Asistente',
        fullName: 'Ana Asistente',
        email: 'assistant@example.com',
        isActive: true,
        role: 'assistant',
        roles: ['assistant'],
        tecId: 'TEC000001',
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      },
    ]);

    const response = await request(buildApp('assistant'))
      .get('/api/users')
      .set('Authorization', 'Bearer assistant-token');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(mockedService.listUsers).toHaveBeenCalledWith('assistant');
  });

  it('POST /api/users crea usuario', async () => {
    mockedService.createUser.mockResolvedValueOnce({
      id: 120,
      firstName: 'Nuevo',
      lastName: 'Admin',
      fullName: 'Nuevo Admin',
      email: 'new@example.com',
      isActive: true,
      role: 'admin',
      roles: ['admin'],
      tecId: undefined,
      createdAt: '2025-10-01T00:00:00Z',
      updatedAt: '2025-10-01T00:00:00Z',
    });

    const payload = {
      firstName: 'Nuevo',
      lastName: 'Admin',
      email: 'new@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      role: 'admin',
    };

    const response = await request(buildApp())
      .post('/api/users')
      .send(payload)
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: 'new@example.com' });
    expect(mockedService.createUser).toHaveBeenCalledWith('admin', payload);
  });

  it('DELETE /api/users/:id elimina usuario', async () => {
    mockedService.deleteUser.mockResolvedValueOnce();

    const response = await request(buildApp())
      .delete('/api/users/101')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(204);
    expect(mockedService.deleteUser).toHaveBeenCalledWith('admin', 101);
  });
});
