import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { debounceTime } from 'rxjs';
import { UserManagementService, UserDto, UserRole } from '../../services/user-management.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class AdminUsersComponent implements OnInit {
  users: UserDto[] = [];

  form: FormGroup;
  mode: 'create' | 'edit' = 'create';
  selectedUser?: UserDto;
  isSubmitting = false;
  isLoading = false;
  loadError?: string;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  searchControl!: FormControl;
  roleOptions: UserRole[] = [];

  constructor(private readonly fb: FormBuilder, private readonly usersService: UserManagementService, private readonly auth: AuthService) {
    this.searchControl = new FormControl('');

    const currentRole = this.auth.getRole();
    this.roleOptions = currentRole === 'isMaster' ? ['admin','assistant'] : ['assistant'];

    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['assistant' as UserRole, Validators.required],
      isActive: [true],
      tecId: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });

    this.form.get('role')?.valueChanges.subscribe((role) => {
      const tecIdControl = this.form.get('tecId');
      if (role === 'assistant') {
        tecIdControl?.addValidators([Validators.required, Validators.minLength(4)]);
      } else {
        tecIdControl?.clearValidators();
        tecIdControl?.setValue('');
      }
      tecIdControl?.updateValueAndValidity({ emitEvent: false });
    });

    this.form.valueChanges.pipe(debounceTime(150)).subscribe(() => {
      if (this.form.hasError('passwordMismatch')) {
        this.form.get('confirmPassword')?.setErrors({ mismatch: true });
      }
    });
  }

  ngOnInit() {
    this.form.get('confirmPassword')?.valueChanges.subscribe(() => this.checkPasswords());
    this.form.get('password')?.valueChanges.subscribe(() => this.checkPasswords());
    this.loadUsers();
  }

  private checkPasswords() {
    const password = this.form.get('password')?.value;
    const confirm = this.form.get('confirmPassword')?.value;
    if (password && confirm && password !== confirm) {
      this.form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      const errors = this.form.get('confirmPassword')?.errors;
      if (errors?.['mismatch']) {
        delete errors['mismatch'];
        if (errors && Object.keys(errors).length === 0) {
          this.form.get('confirmPassword')?.setErrors(null);
        } else {
          this.form.get('confirmPassword')?.setErrors(errors || null);
        }
      }
    }
  }

  get filteredUsers(): UserDto[] {
    const search = (this.searchControl.value ?? '').toLowerCase();
    const status = this.statusFilter;
    return this.users.filter((user) => {
      const matchesSearch =
        !search ||
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);
      const matchesStatus =
        status === 'all' || (status === 'active' ? user.isActive : !user.isActive);
      return matchesSearch && matchesStatus;
    });
  }

  get totalUsers() {
    return this.users.length;
  }

  private loadUsers() {
    this.isLoading = true;
    this.loadError = undefined;
    this.usersService.list().subscribe({
      next: (items) => {
        this.users = items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'No se pudieron cargar los usuarios.';
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.form.value;
    const requestBase = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      role: value.role as UserRole,
      isActive: value.isActive,
      tecId: value.role === 'assistant' ? value.tecId?.trim() : undefined,
    };

    if (this.mode === 'create') {
      this.usersService
        .create({
          ...requestBase,
          password: value.password,
          confirmPassword: value.confirmPassword,
        })
        .subscribe({
          next: (user) => {
            this.users = [user, ...this.users];
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.isSubmitting = false;
            this.loadError = err?.error?.error?.message || 'No fue posible crear el usuario.';
          },
        });
    } else if (this.selectedUser) {
      const payload = {
        ...requestBase,
        password: value.password ? value.password : undefined,
        confirmPassword: value.password ? value.confirmPassword : undefined,
        tecId: requestBase.role === 'assistant' ? requestBase.tecId ?? null : null,
      };

      this.usersService.update(this.selectedUser.id, payload).subscribe({
        next: (user) => {
          this.users = this.users.map((item) => (item.id === user.id ? user : item));
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.loadError = err?.error?.error?.message || 'No fue posible actualizar el usuario.';
        },
      });
    }
  }

  edit(user: UserDto) {
    this.mode = 'edit';
    this.selectedUser = user;
    const currentRole = this.auth.getRole();
    this.roleOptions = currentRole === 'isMaster' ? ['admin','assistant'] : ['assistant'];
    this.form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      tecId: user.tecId ?? '',
      password: '',
      confirmPassword: '',
    });
  }

  cancelEdit() {
    this.resetForm();
  }

  delete(user: UserDto) {
    if (!confirm(`Eliminar a ${user.fullName}?`)) {
      return;
    }

    this.usersService.remove(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((item) => item.id !== user.id);
      },
      error: (err) => {
        this.loadError = err?.error?.error?.message || 'No fue posible eliminar el usuario.';
      },
    });
  }

  private resetForm() {
    this.form.reset({
      firstName: '',
      lastName: '',
      email: '',
      role: 'assistant',
      isActive: true,
      tecId: '',
      password: '',
      confirmPassword: '',
    });
    this.mode = 'create';
    this.selectedUser = undefined;
  }

  getError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control || (!control.touched && !control.dirty)) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    if (control.hasError('email')) {
      return 'Ingresa un correo electronico valido.';
    }
    if (control.hasError('minlength')) {
      const min = control.getError('minlength').requiredLength;
      return `Debe tener al menos ${min} caracteres.`;
    }
    if (controlName === 'confirmPassword' && control.hasError('mismatch')) {
      return 'Las contrasenas no coinciden.';
    }
    if (control.hasError('pattern')) {
      return 'Formato invalido.';
    }
    return null;
  }
}