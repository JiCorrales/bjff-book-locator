import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { AdminUsersComponent } from './users';
import { UserManagementService } from '../../services/user-management.service';

const usersMock = [
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

describe('AdminUsersComponent', () => {
  let fixture: ComponentFixture<AdminUsersComponent>;
  let component: AdminUsersComponent;
  let service: jasmine.SpyObj<UserManagementService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj<UserManagementService>('UserManagementService', [
      'list',
      'create',
      'update',
      'remove',
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: UserManagementService, useValue: serviceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(UserManagementService) as jasmine.SpyObj<UserManagementService>;
    service.list.and.returnValue(of(usersMock));
    fixture.detectChanges();
  });

  it('carga usuarios al iniciar', () => {
    expect(service.list).toHaveBeenCalled();
    expect(component.users.length).toBe(1);
  });

  it('envía formulario válido para crear un usuario', fakeAsync(() => {
    component.form.setValue({
      firstName: 'Nuevo',
      lastName: 'Admin',
      email: 'nuevo@example.com',
      role: 'admin',
      isActive: true,
      tecId: '',
      password: 'secreto123',
      confirmPassword: 'secreto123',
    });

    service.create.and.returnValue(
      of({
        id: 122,
        firstName: 'Nuevo',
        lastName: 'Admin',
        fullName: 'Nuevo Admin',
        email: 'nuevo@example.com',
        isActive: true,
        role: 'admin',
        roles: ['admin'],
        createdAt: '2025-10-02T00:00:00Z',
        updatedAt: '2025-10-02T00:00:00Z',
      }),
    );

    component.submit();
    tick();

    expect(service.create).toHaveBeenCalled();
    expect(component.users[0].email).toBe('nuevo@example.com');
  }));
});
