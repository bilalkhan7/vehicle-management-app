import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddVehicleComponent } from './add-vehicle.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VehicleService } from '../../../core/services/vehicle.service';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Vehicle,Fuel } from '../../../core/models/vehicle.model';

describe('AddVehicleComponent', () => {
  let fixture: ComponentFixture<AddVehicleComponent>;
  let component: AddVehicleComponent;

  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddVehicleComponent>>;
  let vehicleServiceSpy: jasmine.SpyObj<VehicleService>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<AddVehicleComponent>>('MatDialogRef', ['close']);
    vehicleServiceSpy = jasmine.createSpyObj<VehicleService>('VehicleService', ['addVehicle', 'updateVehicle']);

    await TestBed.configureTestingModule({
      imports: [AddVehicleComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: VehicleService, useValue: vehicleServiceSpy },
        { provide: MAT_DIALOG_DATA, useValue: null },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddVehicleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    dialogRefSpy.close.calls.reset();
    vehicleServiceSpy.addVehicle.calls.reset();
    vehicleServiceSpy.updateVehicle.calls.reset();
  });

  it('should have invalid form initially', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('should validate required fields (including vin single field)', () => {
    component.form.patchValue({
      name: 'Test',
      manufacturer: 'M',
      model: 'X',
      fuel: 'Diesel' as Fuel,
      type: 'SUV',
      vin: 'DEDD1233'
    });
    expect(component.form.valid).toBeTrue();
  });

  it('should call addVehicle and close on success (add mode)', () => {
    const payload = {
      name: 'Test',
      manufacturer: 'M',
      model: 'X',
      fuel: 'Diesel' as Fuel,
      type: 'SUV',
      vin: 'DEDD1233',
      color: '',
      mileage: null as number | null
    };

    component.form.setValue(payload);

    const returned: Vehicle = {
      id: '1',
      name: 'Test',
      manufacturer: 'M',
      model: 'X',
      fuel: 'Diesel',
      type: 'SUV',
      vin: 'DEDD1233',
      color: '',
      mileage: null as unknown as number
    };

    vehicleServiceSpy.addVehicle.and.returnValue(of(returned));

    component.submit();

    expect(vehicleServiceSpy.addVehicle).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Test',
        manufacturer: 'M',
        model: 'X',
        fuel: 'Diesel',
        type: 'SUV',
        vin: 'DEDD1233'
      })
    );
    expect(dialogRefSpy.close).toHaveBeenCalledWith(returned);
  });

  it('should show error if API fails', () => {
    component.form.setValue({
      name: 'Test',
      manufacturer: 'M',
      model: 'X',
      fuel: 'Diesel',
      type: 'SUV',
      vin: 'DE53252',
      color: '',
      mileage: null
    });

    vehicleServiceSpy.addVehicle.and.returnValue(throwError(() => new Error('boom')));

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBeTruthy();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });
});
