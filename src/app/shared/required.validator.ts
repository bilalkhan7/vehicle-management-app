import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const requiredTrimmed: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = (control.value ?? '').toString();
  return v.trim().length === 0 ? { required: true, whitespace: true } : null;
};
