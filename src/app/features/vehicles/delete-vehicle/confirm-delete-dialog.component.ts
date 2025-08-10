import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDeleteData {
  title?: string;
  message?: string;
  itemLabel?: string; 
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrls: ['./confirm-delete-dialog.component.scss']
})
export class ConfirmDeleteDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialogComponent, boolean>);
  readonly data = inject<ConfirmDeleteData>(MAT_DIALOG_DATA);

  get vehicleLabel(): string | undefined {
    return this.data?.itemLabel;
  }
  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
