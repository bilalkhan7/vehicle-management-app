import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { finalize, take } from 'rxjs/operators';

import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle, Fuel, CreateVehicle, FUEL_TYPES } from '../../../core/models/vehicle.model';
import { requiredTrimmed } from '../../../shared/validators/required.validtor';

@Component({
  selector: 'app-add-vehicle',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule,
  ],
  templateUrl: './add-vehicle.component.html',
  styleUrls: ['./add-vehicle.component.scss'],
})
export class AddVehicleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vehicleService = inject(VehicleService);
  private dialogRef = inject(MatDialogRef<AddVehicleComponent>);
  private data = inject<{ vehicle?: Vehicle } | null>(MAT_DIALOG_DATA, { optional: true }) ?? null;

  fuels: readonly Fuel[] = FUEL_TYPES;

  isEdit = signal(!!this.data?.vehicle);
  submitting = signal(false);
  error = signal<string>('');

  form = this.fb.nonNullable.group({
    name: ['', [requiredTrimmed]],
    manufacturer: ['', [requiredTrimmed]],
    model: ['', [requiredTrimmed]],
    fuel: 'Petrol' as Fuel,
    type: ['', [requiredTrimmed]],
    vin: ['', [requiredTrimmed, Validators.minLength(6)]],
    color: '',
    mileage: null as number | null,
  });

  title = computed(() => (this.isEdit() ? 'Edit Vehicle' : 'Add New Vehicle'));
  cta = computed(() => (this.isEdit() ? 'Save Changes' : 'Add Vehicle'));
  canSubmit = computed(() => this.form.valid && this.hasChanges() && !this.submitting());

  private originalSnapshot: ReturnType<AddVehicleComponent['snapshot']> | null = null;

  ngOnInit(): void {
    if (!this.isEdit()) return;

    const v = this.data!.vehicle!;
    this.form.patchValue({
      name: v.name ?? '',
      manufacturer: v.manufacturer ?? '',
      model: v.model ?? '',
      fuel: (v.fuel as Fuel) ?? 'Petrol',
      type: v.type ?? '',
      vin: v.vin ?? '',
      color: v.color ?? '',
      mileage: v.mileage ?? null,
    }, { emitEvent: false });

    this.originalSnapshot = this.snapshot();
    this.form.markAsPristine();
  }

  private tidy(s: string | null | undefined): string | null {
    const v = (s ?? '').toString().trim();
    return v === '' ? null : v;
  }

  private snapshot() {
    const raw = this.form.getRawValue();
    return {
      name: this.tidy(raw.name),
      manufacturer: this.tidy(raw.manufacturer),
      model: this.tidy(raw.model),
      fuel: raw.fuel as Fuel,
      type: this.tidy(raw.type),
      vin: this.tidy(raw.vin),
      color: this.tidy(raw.color),
      mileage: raw.mileage ?? null,
    };
  }

  hasChanges(): boolean {
    if (!this.isEdit()) return true;
    const now = this.snapshot();
    return JSON.stringify(now) !== JSON.stringify(this.originalSnapshot ?? now);
  }

  submit() {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const toNum = (v: unknown) => (v === null || v === '' ? null : Number(v));

    const createPayload: CreateVehicle = {
      name: raw.name.trim(),
      manufacturer: raw.manufacturer.trim(),
      model: raw.model.trim(),
      fuel: raw.fuel as Fuel,
      type: raw.type.trim(),
      vin: raw.vin.trim(),
      color: raw.color?.trim() || undefined,
      mileage: toNum(raw.mileage) ?? undefined,
    };

    const req$ = this.isEdit()
      ? this.vehicleService.updateVehicle(this.data!.vehicle!.id!, createPayload)
      : this.vehicleService.addVehicle(createPayload);

    req$.pipe(take(1), finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (vehicle) => this.dialogRef.close(vehicle),
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to save vehicle.';
          this.error.set(message);
        }
      });
  }

  cancel() { this.dialogRef.close(); }
}
