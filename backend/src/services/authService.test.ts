import { authService } from './authService';
import { getUserCredentialsByEmail } from '../models/userModel';

jest.mock('../models/userModel');

const mockedModel = getUserCredentialsByEmail as jest.Mock;

describe('authService.login', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('genera token para credenciales correctas', async () => {
    mockedModel.mockResolvedValue({
      id: 101,
      firstName: 'Ana',
      lastName: 'Asistente',
      email: 'assistant@example.com',
      passwordHash:
        'fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4', // sha256('assistant123')
      isActive: true,
      isDeleted: false,
      roles: ['assistant'],
    });

    const result = await authService.login('assistant@example.com', 'assistant123');

    expect(result.user).toMatchObject({
      id: 101,
      email: 'assistant@example.com',
      role: 'assistant',
    });
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(10);
  });

  it('lanza error para contraseña incorrecta', async () => {
    mockedModel.mockResolvedValue({
      id: 101,
      firstName: 'Ana',
      lastName: 'Asistente',
      email: 'assistant@example.com',
      passwordHash:
        'fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4',
      isActive: true,
      isDeleted: false,
      roles: ['assistant'],
    });

    await expect(authService.login('assistant@example.com', 'wrongpass')).rejects.toThrow(
      'Credenciales inválidas.',
    );
  });
});
