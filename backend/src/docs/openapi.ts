import { OpenAPIV3 } from 'openapi-types';

const userSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 102 },
    firstName: { type: 'string', example: 'Ad�n' },
    lastName: { type: 'string', example: 'Administrador' },
    fullName: { type: 'string', example: 'Ad�n Administrador' },
    email: { type: 'string', format: 'email' },
    isActive: { type: 'boolean', example: true },
    role: { type: 'string', enum: ['admin', 'assistant', 'isMaster'] },
    roles: {
      type: 'array',
      items: { type: 'string' },
    },
    tecId: { type: 'string', nullable: true, example: 'TEC000001' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const createUserSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'role'],
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', format: 'password', minLength: 8 },
    confirmPassword: { type: 'string', format: 'password' },
    role: { type: 'string', enum: ['admin', 'assistant', 'isMaster'] },
    isActive: { type: 'boolean', default: true },
    tecId: { type: 'string', nullable: true, description: 'Requerido para asistentes' },
  },
};

const updateUserSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', format: 'password', minLength: 8 },
    confirmPassword: { type: 'string', format: 'password' },
    role: { type: 'string', enum: ['admin', 'assistant'] },
    isActive: { type: 'boolean' },
    tecId: { type: 'string', nullable: true },
  },
};

const loginRequestSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', format: 'password' },
  },
};

const loginResponseSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    token: { type: 'string', description: 'JWT para autenticaci�n' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 102 },
        email: { type: 'string', format: 'email' },
        fullName: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'assistant'] },
      },
    },
  },
};

export const openApiDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Book Locator API',
    version: '1.0.0',
    description:
      'Endpoints para la gesti�n de usuarios administradores y asistentes, as� como para la localizaci�n de libros.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Utiliza el token JWT emitido por /api/auth/login o las claves ADMIN_API_KEY / ASSISTANT_API_KEY para acceso directo.',
      },
    },
    schemas: {
      User: userSchema,
      CreateUserRequest: createUserSchema,
      UpdateUserRequest: updateUserSchema,
      LoginRequest: loginRequestSchema,
      LoginResponse: loginResponseSchema,
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'Iniciar sesi�n',
        description: 'Genera un token JWT validando las credenciales del usuario.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Inicio de sesi�n exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: {
            description: 'Datos incompletos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: {
            description: 'Credenciales inv�lidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'Listar usuarios',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Listado de usuarios',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    items: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Crear usuario',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Usuario creado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Datos inv�lidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Obtener un usuario',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Usuario encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Usuario no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Actualizar un usuario',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Usuario actualizado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Eliminar (soft delete) un usuario',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: 'Usuario eliminado' },
          404: {
            description: 'Usuario no encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};
