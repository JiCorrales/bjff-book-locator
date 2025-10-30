import express from 'express';
import request from 'supertest';
import authRouter from '../routes/auth';
import { authService } from '../services/authService';

jest.mock('../services/authService');

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
};

describe('authController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('devuelve token en login correcto', async () => {
    mockedAuthService.login.mockResolvedValueOnce({
      token: 'test-token',
      user: {
        id: 101,
        email: 'assistant@example.com',
        fullName: 'Ana Asistente',
        role: 'assistant',
      },
    });

    const response = await request(buildApp())
      .post('/api/auth/login')
      .send({ email: 'assistant@example.com', password: 'assistant123' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('test-token');
    expect(mockedAuthService.login).toHaveBeenCalledWith(
      'assistant@example.com',
      'assistant123',
    );
  });
});
