import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VehicleService } from './vehicle.service';
import { Vehicle, CreateVehicle } from '../models/vehicle.model';

describe('VehicleService', () => {
  let service: VehicleService;
  let httpMock: HttpTestingController;

  const BASE = 'https://67d4273b8bca322cc26c5b38.mockapi.io/vehicles';

  const mockVehicle: Vehicle = {
    id: '1',
    name: 'Car A',
    manufacturer: 'X',
    model: 'Y',
    fuel: 'Diesel',
    type: 'SUV',
    vin: 'DEDD1233',
    color: 'blue',
    mileage: 10000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VehicleService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(VehicleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch vehicles', () => {
    const mockVehicles: Vehicle[] = [mockVehicle];

    service.getVehicles().subscribe(vehicles => {
      expect(vehicles.length).toBe(1);
      expect(vehicles[0]).toEqual(mockVehicle);
    });

    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(mockVehicles);
  });

  it('should fetch a single vehicle by ID', () => {
    service.getVehicleById('1').subscribe(vehicle => {
      expect(vehicle).toEqual(mockVehicle);
    });

    const req = httpMock.expectOne(`${BASE}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockVehicle);
  });

  it('should post a new vehicle', () => {
    const newVehicle: CreateVehicle = {
      name: 'Test Car',
      manufacturer: 'Test',
      model: 'Model X',
      fuel: 'Petrol',
      type: 'Sedan',
      vin: 'DEAB1234',
      color: 'red',
      mileage: 5000
    };

    const mockResponse: Vehicle = { ...newVehicle, id: '99' };

    service.addVehicle(newVehicle).subscribe(vehicle => {
      expect(vehicle).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newVehicle);
    req.flush(mockResponse);
  });

  it('should patch (update) a vehicle', () => {
    const id = '42';
    const patch: Partial<CreateVehicle> = { color: 'black', mileage: 12345 };
    const mockResponse: Vehicle = { ...mockVehicle, id, ...patch };

    service.updateVehicle(id, patch).subscribe(vehicle => {
      expect(vehicle).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${BASE}/${id}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(patch);
    req.flush(mockResponse);
  });

  it('should delete a vehicle', () => {
    const id = '7';

    service.deleteVehicle(id).subscribe(res => {
      expect(res).toEqual({});
    });

    const req = httpMock.expectOne(`${BASE}/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
