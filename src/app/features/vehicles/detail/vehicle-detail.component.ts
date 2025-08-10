import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle, CreateVehicle, Fuel } from '../../../core/models/vehicle.model';
import { AddVehicleComponent } from '../add-vehicle/add-vehicle.component';
import { ConfirmDeleteDialogComponent, ConfirmDeleteData } from '../delete-vehicle/confirm-delete-dialog.component';

@Component({
  standalone: true,
  selector: 'app-vehicle-detail',
  templateUrl: './vehicle-detail.component.html',
  styleUrls: ['./vehicle-detail.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
})
export class VehicleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehicleService = inject(VehicleService);
  private location = inject(Location);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(true);
  error = signal(false);
  vehicle = signal<Vehicle | null>(null);

  private readonly MIN_SPINNER_MS = 900;

  ngOnInit(): void {
    this.reload();
  }

  reload() {
    const id = this.route.snapshot.paramMap.get('id');

    this.loading.set(true);
    this.error.set(false);
    this.vehicle.set(null);

    if (!id) {
      setTimeout(() => {
        this.loading.set(false);
        this.error.set(true);
      }, this.MIN_SPINNER_MS);
      return;
    }

    const started = Date.now();

    this.vehicleService.getVehicleById(id).subscribe({
      next: (v) => {
        const elapsed = Date.now() - started;
        const remaining = Math.max(0, this.MIN_SPINNER_MS - elapsed);
        setTimeout(() => {
          this.vehicle.set(v ?? null);
          this.loading.set(false);
          this.error.set(!v);
        }, remaining);
      },
      error: () => {
        const elapsed = Date.now() - started;
        const remaining = Math.max(0, this.MIN_SPINNER_MS - elapsed);
        setTimeout(() => {
          this.error.set(true);
          this.loading.set(false);
        }, remaining);
      },
    });
  }

  goBack() {
    this.location.back();
  }

  openEdit() {
    const current = this.vehicle();
    if (!current) return;

    const dialogRef = this.dialog.open(AddVehicleComponent, {
      width: '500px',
      data: { vehicle: current },
    });

    dialogRef.afterClosed().subscribe((updated: Vehicle | undefined) => {
      if (!updated) return;

      const previous = { ...current };
      this.vehicle.set(updated);

      const payload: Partial<CreateVehicle> = {
        name: updated.name,
        manufacturer: updated.manufacturer,
        model: updated.model,
        fuel: updated.fuel as Fuel,
        type: updated.type,
        vin: updated.vin,
        color: updated.color,
        mileage: updated.mileage ?? undefined
      };

      this.vehicleService.updateVehicle(updated.id!, payload).subscribe({
        next: () => this.snack.open('Vehicle updated', 'Close', { duration: 2500 }),
        error: () => {
          this.vehicle.set(previous);
          this.snack.open('Failed to update vehicle', 'Close', { duration: 3000 });
        },
      });
    });
  }

  deleteVehicle() {
    const current = this.vehicle();
    if (!current) return;

    const label = current.name || `${current.manufacturer} ${current.model}`;

    const confirmRef = this.dialog.open<
      ConfirmDeleteDialogComponent,
      ConfirmDeleteData,
      boolean
    >(ConfirmDeleteDialogComponent, {
      width: '420px',
      data: {
        title: 'Delete vehicle',
        message: 'Are you sure you want to delete this vehicle?',
        itemLabel: label,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
      },
    });

    confirmRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const prev = { ...current };
      this.vehicle.set(null);

      this.vehicleService.deleteVehicle(current.id!).subscribe({
        next: () => {
          this.snack.open(`Vehicle "${label}" deleted`, 'Close', { duration: 2500 });
          this.router.navigate(['/vehicles']);
        },
        error: () => {
          this.vehicle.set(prev);
          this.snack.open('Failed to delete vehicle', 'Close', { duration: 3000 });
        },
      });
    });
  }
}
