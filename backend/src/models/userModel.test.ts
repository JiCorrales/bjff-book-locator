import { listUsers } from './userModel';

jest.mock('../config/database', () => ({
  queryRows: jest.fn(),
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const { queryRows } = jest.requireMock('../config/database');

describe('userModel.listUsers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('mapea resultados de la base de datos en registros de usuario', async () => {
    queryRows.mockResolvedValueOnce([
      {
        userID: 102,
        firstName: 'Adán',
        lastName: 'Administrador',
        email: 'admin@example.com',
        isActive: 1,
        createdAt: '2025-10-01T10:00:00Z',
        updatedAt: '2025-10-05T10:00:00Z',
        roles: 'admin',
        tecID: null,
      },
    ]);

    const result = await listUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 102,
        firstName: 'Adán',
        lastName: 'Administrador',
        email: 'admin@example.com',
        isActive: true,
        role: 'admin',
        roles: ['admin'],
      }),
    );
  });
});
