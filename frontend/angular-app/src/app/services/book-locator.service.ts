import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// API Response Interfaces
export interface ShelfLocation {
  shelf_id: number;
  shelf_image_path: string | null;
  shelf_number: number;
  unit_number: number;
  unit_side: string;
  module_part_side: string;
  module_name: string;
  location_text: string;
  min_comparable_key: string;
  max_comparable_key: string;
}

export interface SearchBookResponse {
  success: boolean;
  code: string;
  comparable_key: string;
  location: ShelfLocation;
}

export interface SearchBookError {
  success: false;
  message: string;
  code?: string;
  comparable_key?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface LibraryStats {
  success: boolean;
  data: {
    total_modules: number;
    total_shelves: number;
    shelves_with_images: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BookLocatorService {
  private readonly API_BASE_URL = '/api';
  private readonly IMAGE_BASE_URL = '/images';

  constructor(private http: HttpClient) {}

  /**
   * Search for a book by its classification code
   * @param code - Book classification code (e.g., "510.5 A500a")
   * @returns Observable with search results
   */
  searchBook(code: string): Observable<SearchBookResponse> {
    return this.http.post<SearchBookResponse>(
      `${this.API_BASE_URL}/books/search`,
      { code }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get library statistics
   * @returns Observable with library stats
   */
  getLibraryStats(): Observable<LibraryStats> {
    return this.http.get<LibraryStats>(
      `${this.API_BASE_URL}/books/stats`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check API health status
   * @returns Observable with health check result
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.API_BASE_URL}/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get full URL for shelf image
   * @param imagePath - Relative path from backend (e.g., "output_final/module1/front/s1_r5.jpg")
   * @returns Full URL to display image
   */
  getShelfImageUrl(imagePath: string | null): string | null {
    if (!imagePath) {
      return null;
    }

    // Remove "output_final/" prefix if present
    const cleanPath = imagePath.replace(/^output_final\//, '');

    return `${this.IMAGE_BASE_URL}/${cleanPath}`;
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      if (error.status === 404 && error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 400 && error.error?.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Server error: ${error.status} ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
