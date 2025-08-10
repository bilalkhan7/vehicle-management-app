import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { VehicleListComponent } from './vehicle-list.component';
import { VehicleService } from '../../../core/services/vehicle.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { Vehicle } from '../../../core/models/vehicle.model';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { delay, mergeMap } from 'rxjs/operators';

const mockVehicles: Vehicle[] = [
  { id: '1', name: 'Audi', manufacturer: 'Audi', model: 'A4', fuel: 'Petrol', type: 'Sedan', vin: 'VIN1' },
  { id: '2', name: 'BMW', manufacturer: 'BMW', model: 'X5', fuel: 'Diesel', type: 'SUV', vin: 'VIN2' }
];

describe('VehicleListComponent', () => {
  let fixture: ComponentFixture<VehicleListComponent>;
  let component: VehicleListComponent;

  let vehicleServiceSpy: jasmine.SpyObj<VehicleService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    vehicleServiceSpy = jasmine.createSpyObj<VehicleService>('VehicleService', [
      'getVehicles', 'deleteVehicle', 'addVehicle', 'updateVehicle',
    ]);
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    snackSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [VehicleListComponent],
      providers: [
        { provide: VehicleService, useValue: vehicleServiceSpy },
        provideRouter([]),
      ],
    })
    .overrideComponent(VehicleListComponent, {
      add: {
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
          { provide: MatSnackBar, useValue: snackSpy },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleListComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    dialogSpy.open.calls.reset();
    snackSpy.open.calls.reset();
    vehicleServiceSpy.getVehicles.calls.reset();
    vehicleServiceSpy.deleteVehicle.calls.reset();
    vehicleServiceSpy.addVehicle.calls?.reset?.();
    vehicleServiceSpy.updateVehicle.calls?.reset?.();
  });

  function mockDialog(result: boolean) {
    const dialogRefStub = { afterClosed: () => of(result) } as unknown as MatDialogRef<unknown>;
    dialogSpy.open.and.returnValue(dialogRefStub);
  }

  it('should load and display vehicles', () => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    fixture.detectChanges();

    expect(vehicleServiceSpy.getVehicles).toHaveBeenCalled();
    expect(component.vehicles().length).toBe(2);
    expect(component.vehicles()[0].name).toBe('Audi');
  });

  it('should set error when loading fails', () => {
    vehicleServiceSpy.getVehicles.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.hasError()).toBeTrue();
    expect(component.isLoading()).toBeFalse();
  });

  it('should delete vehicle on success', fakeAsync(() => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    vehicleServiceSpy.deleteVehicle.and.returnValue(of({}));
    mockDialog(true);

    fixture.detectChanges();
    component.delete('1');

    tick();
    fixture.detectChanges();

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(vehicleServiceSpy.deleteVehicle).toHaveBeenCalledWith('1');
    expect(snackSpy.open).toHaveBeenCalledWith(
      'Vehicle "Audi" deleted successfully',
      'Close',
      { duration: 2500 }
    );
    expect(component.vehicles().length).toBe(1);
  }));

  it('should not delete vehicle if confirm is cancelled', () => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    mockDialog(false);

    fixture.detectChanges();
    component.delete('1');

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(vehicleServiceSpy.deleteVehicle).not.toHaveBeenCalled();
    expect(component.vehicles().length).toBe(2);
  });

  it('should optimistically remove vehicle from UI before server confirms', fakeAsync(() => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    vehicleServiceSpy.deleteVehicle.and.returnValue(of({}));
    mockDialog(true);

    fixture.detectChanges();
    expect(component.vehicles().length).toBe(2);

    component.delete('1');
    expect(component.vehicles().length).toBe(1);
    expect(vehicleServiceSpy.deleteVehicle).toHaveBeenCalledWith('1');

    tick();
    fixture.detectChanges();

    expect(snackSpy.open).toHaveBeenCalledWith(
      'Vehicle "Audi" deleted successfully',
      'Close',
      { duration: 2500 }
    );
  }));

  it('should rollback deleted vehicle in UI if server call fails', fakeAsync(() => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    vehicleServiceSpy.deleteVehicle.and.returnValue(
      of(null).pipe(delay(0), mergeMap(() => throwError(() => new Error('fail'))))
    );
    mockDialog(true);

    fixture.detectChanges();
    expect(component.vehicles().length).toBe(2);

    component.delete('1');
    expect(component.vehicles().length).toBe(1);

    tick(0);
    fixture.detectChanges();

    expect(component.vehicles().length).toBe(2);
    expect(snackSpy.open).toHaveBeenCalledWith(
      'Failed to delete vehicle. Changes reverted.',
      'Close',
      { duration: 3000 }
    );
  }));

  it('should add new vehicle when modal returns data', fakeAsync(() => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    const newVehicle: Vehicle = {
      id: '3', name: 'Volvo', manufacturer: 'Volvo', model: 'XC90', fuel: 'Diesel', type: 'SUV', vin: 'VIN3'
    };

    const dialogRefStub = { afterClosed: () => of(newVehicle) } as unknown as MatDialogRef<unknown>;
    dialogSpy.open.and.returnValue(dialogRefStub);

    fixture.detectChanges();
    component.openAddVehicleModal();

    flushMicrotasks();
    fixture.detectChanges();

    expect(component.vehicles().some(v => v.id === '3')).toBeTrue();
  }));

  it('should not add vehicle if modal returns undefined', fakeAsync(() => {
    vehicleServiceSpy.getVehicles.and.returnValue(of(mockVehicles));
    const dialogRefStub = { afterClosed: () => of(undefined) } as unknown as MatDialogRef<unknown>;
    dialogSpy.open.and.returnValue(dialogRefStub);

    fixture.detectChanges();
    component.openAddVehicleModal();

    flushMicrotasks();
    fixture.detectChanges();

    expect(component.vehicles().length).toBe(2);
  }));

  it('should update vehicle on edit and highlight it', fakeAsync(() => {
    const original: Vehicle = {
      id: '7', name: 'OldName', manufacturer: 'VW', model: 'Torro',
      fuel: 'Hybrid', type: 'SUV', vin: 'DEDD1233', color: 'Black', mileage: 32122
    };

    vehicleServiceSpy.getVehicles.and.returnValue(of([original]));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const updated: Vehicle = { ...original, name: 'NewName', color: 'Blue' };
    const dialogRefStub = { afterClosed: () => of(updated) } as unknown as MatDialogRef<unknown>;
    dialogSpy.open.and.returnValue(dialogRefStub);

    component.openEdit(original);

    flushMicrotasks();
    tick();
    fixture.detectChanges();

    const sel = `.veh-card[data-id="${updated.id}"]`;
    const cardDe = fixture.debugElement.query(By.css(sel));
    expect(cardDe).not.toBeNull();

    const titleEl: HTMLElement | null = cardDe!.nativeElement.querySelector('.title');
    expect(titleEl?.textContent).toContain('NewName');

    expect(snackSpy.open).toHaveBeenCalledWith(
      'Vehicle "NewName" updated successfully',
      'Close',
      { duration: 2500 }
    );
    expect(cardDe!.nativeElement.classList.contains('added')).toBeTrue();

    tick(3000);
    fixture.detectChanges();
    expect(cardDe!.nativeElement.classList.contains('added')).toBeFalse();
  }));
});
