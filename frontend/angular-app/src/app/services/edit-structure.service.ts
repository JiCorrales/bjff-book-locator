import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ModuleUpdatePayload {
  module_name?: string;
  module_number?: number;
  range_start?: string;
  range_end?: string;
}

export interface ShelvingUnitUpdatePayload {
  unit_name?: string;
  unit_number?: number;
  range_start?: string;
  range_end?: string;
}

export interface ShelfUpdatePayload {
  shelf_number?: number;
  range_start?: string;
  range_end?: string;
}

export interface UpdateResponse {
  success: boolean;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EditStructureService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private buildHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  updateModule(id: number, payload: ModuleUpdatePayload): Observable<UpdateResponse> {
    return this.http.patch<UpdateResponse>(`${this.baseUrl}/modules/items/${id}`, payload, {
      headers: this.buildHeaders(),
    });
  }

  updateShelvingUnit(id: number, payload: ShelvingUnitUpdatePayload): Observable<UpdateResponse> {
    return this.http.patch<UpdateResponse>(`${this.baseUrl}/shelving-units/items/${id}`, payload, {
      headers: this.buildHeaders(),
    });
  }

  updateShelf(id: number, payload: ShelfUpdatePayload): Observable<UpdateResponse> {
    return this.http.patch<UpdateResponse>(`${this.baseUrl}/shelves/items/${id}`, payload, {
      headers: this.buildHeaders(),
    });
  }
}