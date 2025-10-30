import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, map } from 'rxjs';

export type UserRole = 'admin' | 'assistant' | 'isMaster';

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: UserRole;
  roles: UserRole[];
  tecId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  isActive?: boolean;
  tecId?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: UserRole;
  isActive?: boolean;
  tecId?: string | null;
}

interface ApiListResponse<T> {
  success: boolean;
  items: T[];
}

interface ApiItemResponse<T> {
  success: boolean;
  user: T;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly baseUrl = '/api/users';

  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  private buildHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  list(): Observable<UserDto[]> {
    return this.http
      .get<ApiListResponse<UserDto>>(this.baseUrl, { headers: this.buildHeaders() })
      .pipe(map((response) => response.items ?? []));
  }

  create(payload: CreateUserRequest): Observable<UserDto> {
    return this.http
      .post<ApiItemResponse<UserDto>>(this.baseUrl, payload, { headers: this.buildHeaders() })
      .pipe(map((response) => response.user));
  }

  update(id: number, payload: UpdateUserRequest): Observable<UserDto> {
    return this.http
      .put<ApiItemResponse<UserDto>>(`${this.baseUrl}/${id}`, payload, {
        headers: this.buildHeaders(),
      })
      .pipe(map((response) => response.user));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: this.buildHeaders(),
    });
  }
}
