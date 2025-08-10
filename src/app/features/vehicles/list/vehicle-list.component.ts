import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { AddVehicleComponent } from '../add-vehicle/add-vehicle.component';
import { ConfirmDeleteData, ConfirmDeleteDialogComponent } from '../delete-vehicle/confirm-delete-dialog.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle, Fuel, SortByType, SORT_BY, FUEL_TYPES } from '../../../core/models/vehicle.model';

@Component({
  standalone: true,
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss'],
  imports: [
    CommonModule, RouterModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatCardModule, MatSnackBarModule, MatTooltipModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatPaginatorModule
  ]
})
export class VehicleListComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly SORT_BY = SORT_BY;
  readonly fuelOptions: readonly Fuel[] = FUEL_TYPES;

  vehicles = signal<Vehicle[]>([]);
  isLoading = signal(true);
  hasError  = signal(false);

  searchTerm = signal<string>('');
  selectedFuel = signal<'All' | Fuel>('All');
  selectedSort = signal<SortByType>(SORT_BY.NAME_ASC);

  currentPageIndex = signal(0);
  currentPageSize  = signal(3);

  ngOnInit(): void {
    this.loadVehicles();
  }

  private displayLabel(v: Vehicle): string {
    return v.name?.trim() || `${v.manufacturer} ${v.model}`.trim();
  }

  loadVehicles() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(
          [...data].sort((a, b) =>
            (a.name || `${a.manufacturer} ${a.model}`).localeCompare(
              b.name || `${b.manufacturer} ${b.model}`))
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
    this.currentPageIndex.set(0);
  }

  onFuelChange(value: 'All' | Fuel) {
    this.selectedFuel.set(value);
    this.currentPageIndex.set(0);
  }

  onSortChange(value: SortByType) {
    this.selectedSort.set(value);
    this.currentPageIndex.set(0);
  }

  onPage(event: PageEvent) {
    this.currentPageIndex.set(event.pageIndex);
    this.currentPageSize.set(event.pageSize);
  }

  filteredAndSortedVehicles = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const fuel  = this.selectedFuel();
    const sort  = this.selectedSort();

    let list = this.vehicles();

    if (query) {
      list = list.filter(v => {
        const name = v.name || '';
        const makeModel = `${v.manufacturer} ${v.model}`;
        const vin = v.vin || '';
        return (
          name.toLowerCase().includes(query) ||
          makeModel.toLowerCase().includes(query) ||
          vin.toLowerCase().includes(query)
        );
      });
    }

    if (fuel !== 'All') {
      list = list.filter(v => v.fuel === fuel);
    }

    return [...list].sort((a, b) => {
      switch (sort) {
        case SORT_BY.NAME_ASC:
          return (a.name || `${a.manufacturer} ${a.model}`).toLowerCase()
            .localeCompare((b.name || `${b.manufacturer} ${b.model}`).toLowerCase());
        case SORT_BY.NAME_DESC:
          return (b.name || `${b.manufacturer} ${b.model}`).toLowerCase()
            .localeCompare((a.name || `${a.manufacturer} ${a.model}`).toLowerCase());
        case SORT_BY.MANUFACTURER_ASC:
          return a.manufacturer.toLowerCase().localeCompare(b.manufacturer.toLowerCase()) ||
                 a.model.toLowerCase().localeCompare(b.model.toLowerCase());
        case SORT_BY.MANUFACTURER_DESC:
          return b.manufacturer.toLowerCase().localeCompare(a.manufacturer.toLowerCase()) ||
                 b.model.toLowerCase().localeCompare(a.model.toLowerCase());
        case SORT_BY.MILEAGE_ASC: {
          const aMiles = a.mileage ?? Number.POSITIVE_INFINITY;
          const bMiles = b.mileage ?? Number.POSITIVE_INFINITY;
          return aMiles - bMiles;
        }
        case SORT_BY.MILEAGE_DESC: {
          const aMiles = a.mileage ?? Number.NEGATIVE_INFINITY;
          const bMiles = b.mileage ?? Number.NEGATIVE_INFINITY;
          return bMiles - aMiles;
        }
        default:
          return 0;
      }
    });
  });

  paginatedVehicles = computed(() => {
    const start = this.currentPageIndex() * this.currentPageSize();
    return this.filteredAndSortedVehicles().slice(start, start + this.currentPageSize());
  });

  private highlightedIds = signal<Set<string>>(new Set());
  isHighlighted = (id: string) => this.highlightedIds().has(id);
  private markHighlighted(id: string) {
    this.highlightedIds.update(s => new Set(s).add(id));
    setTimeout(() => {
      this.highlightedIds.update(s => {
        const next = new Set(s); next.delete(id); return next;
      });
    }, 3000);
  }

  openAddVehicleModal(): void {
    const ref = this.dialog.open(AddVehicleComponent, { width: '500px' });

    ref.afterClosed().subscribe((newVehicle: Vehicle | undefined) => {
      if (!newVehicle) return;

      this.vehicles.update(current =>
        [...current, newVehicle].sort((a, b) =>
          (a.name || `${a.manufacturer} ${a.model}`).localeCompare(
            b.name || `${b.manufacturer} ${b.model}`))
      );

      if (newVehicle.id) this.markHighlighted(newVehicle.id);

      const label = this.displayLabel(newVehicle);
      this.snack.open(`Vehicle "${label}" added successfully`, 'Close', { duration: 2500 });
    });
  }

  openEdit(vehicle: Vehicle) {
    const ref = this.dialog.open(AddVehicleComponent, { width: '520px', data: { vehicle } });

    ref.afterClosed().subscribe((updated: Vehicle | undefined) => {
      if (!updated) return;

      this.vehicles.update(list =>
        list
          .map(v => (v.id === updated.id ? updated : v))
          .sort((a, b) =>
            (a.name || `${a.manufacturer} ${a.model}`).localeCompare(
              b.name || `${b.manufacturer} ${b.model}`))
      );

      if (updated.id) this.markHighlighted(updated.id);
      const label = this.displayLabel(updated);
      this.snack.open(`Vehicle "${label}" updated successfully`, 'Close', { duration: 2500 });
    });
  }

  delete(id: string) {
    const vehicle = this.vehicles().find(v => v.id === id);
    const label = vehicle ? this.displayLabel(vehicle) : 'this vehicle';

    const confirmRef = this.dialog.open<ConfirmDeleteDialogComponent, ConfirmDeleteData, boolean>(
      ConfirmDeleteDialogComponent,
      {
        width: '420px',
        data: {
          title: 'Delete vehicle',
          message: 'Are you sure you want to delete this vehicle?',
          itemLabel: label,
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        },
      }
    );

    confirmRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      const previous = this.vehicles();
      this.vehicles.update(list => list.filter(v => v.id !== id));

      this.vehicleService.deleteVehicle(id).subscribe({
        next: () => this.snack.open(`Vehicle "${label}" deleted successfully`, 'Close', { duration: 2500 }),
        error: () => {
          this.vehicles.set(previous);
          this.snack.open('Failed to delete vehicle. Changes reverted.', 'Close', { duration: 3000 });
        }
      });
    });
  }

  openDetails(v: Vehicle) {
    if (!v?.id) return;
    this.router.navigate(['/vehicle', v.id]);
  }

  trackById = (_: number, item: Vehicle) => item.id!;
}
