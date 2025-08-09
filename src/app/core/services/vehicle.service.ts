import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Vehicle, CreateVehicle } from '../models/vehicle.model';
import { catchError, retry, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://67d4273b8bca322cc26c5b38.mockapi.io/vehicles';

  getVehicles() {
    return this.http.get<Vehicle[]>(this.baseUrl).pipe(
      retry(2),
      catchError(this.handleError('getVehicles'))
    );
  }

  getVehicleById(id: string) {
    return this.http.get<Vehicle>(`${this.baseUrl}/${id}`).pipe(
      retry(2),
      catchError(this.handleError('getVehicleById'))
    );
  }

  addVehicle(vehicle: CreateVehicle) {
    return this.http.post<Vehicle>(this.baseUrl, vehicle).pipe(
      catchError(this.handleError('addVehicle'))
    );
  }

  updateVehicle(id: string, changes: Partial<CreateVehicle>) {
    return this.http.patch<Vehicle>(`${this.baseUrl}/${id}`, changes).pipe(
      catchError(this.handleError('updateVehicle'))
    );
  }

  deleteVehicle(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError('deleteVehicle'))
    );
  }

  private handleError(operation: string) {
    return (error: HttpErrorResponse | Error | unknown) => {
      let message = `Error during ${operation}`;

      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          message = 'Network error: please check your connection.';
        } else if (error.status === 404) {
          message = 'Vehicle not found.';
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        } else {
          message = error.error?.message || error.message || message;
        }
      } else if (error instanceof Error) {
        message = error.message || message;
      }

      return throwError(() => new Error(message));
    };
  }
}
