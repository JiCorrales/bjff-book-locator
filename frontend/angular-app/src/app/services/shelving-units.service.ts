import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemDto {
  id: number;
  nombre: string;
  rango: string;
  estado: boolean;
  ultimaModificacion: string;
  meta?: Record<string, number | string>;
}

@Injectable({ providedIn: 'root' })
export class ShelvingUnitsService {
  private readonly baseUrl = '/api/shelving-units';

  constructor(private http: HttpClient) {}

  getAll(): Observable<{ success: boolean; items: ItemDto[] }> {
    return this.http.get<{ success: boolean; items: ItemDto[] }>(`${this.baseUrl}/items`);
  }
}