export const SORT_BY = {
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc',
  MANUFACTURER_ASC: 'manufacturer-asc',
  MANUFACTURER_DESC: 'manufacturer-desc',
  MILEAGE_ASC: 'mileage-asc',
  MILEAGE_DESC: 'mileage-desc',
} as const;

export type SortByType = typeof SORT_BY[keyof typeof SORT_BY];

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'] as const;
export type Fuel = typeof FUEL_TYPES[number];

export interface Vehicle {
  id?: string;
  name?: string;
  manufacturer: string;
  model: string;
  mileage?: number | null;
  fuel?: Fuel;
  type?: string;
  vin?: string;
  color?: string;
}

export interface CreateVehicle {
  name: string;
  manufacturer: string;
  model: string;
  fuel: Fuel;
  type: string;
  vin: string;
  color?: string;
  mileage?: number;
}
