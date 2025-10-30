import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserManagementService } from './user-management.service';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserManagementService],
    });

    service = TestBed.inject(UserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe recuperar usuarios', () => {
    const mockUsers = [
      {
        id: 101,
        firstName: 'Ana',
        lastName: 'Asistente',
        fullName: 'Ana Asistente',
        email: 'assistant@example.com',
        isActive: true,
        role: 'assistant',
        roles: ['assistant'],
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      },
    ];

    service.list().subscribe((users) => {
      expect(users).toEqual(mockUsers);
    });

    const request = httpMock.expectOne('/api/users');
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer admin-token');
    request.flush({ success: true, items: mockUsers });
  });
});
