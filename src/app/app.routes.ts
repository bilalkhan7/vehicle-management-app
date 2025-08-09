import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vehicles' },

  {
    path: 'vehicles',
    loadComponent: () =>
      import('./features/vehicles/list/vehicle-list.component')
        .then(m => m.VehicleListComponent),
    title: 'Vehicles'
  },
  {
    path: 'vehicle/:id',
    loadComponent: () =>
      import('./features/vehicles/detail/vehicle-detail.component')
        .then(m => m.VehicleDetailComponent),
    title: 'Vehicle details'
  },

  { path: '**', redirectTo: 'vehicles' }
];
