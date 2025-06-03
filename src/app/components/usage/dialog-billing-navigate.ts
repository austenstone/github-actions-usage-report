import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';

interface DialogDataComponent {
  name: string;
  isEnterprise: boolean;
}

@Component({
    selector: 'app-dialog-billing-navigate',
    templateUrl: 'dialog-billing-navigate.html',
    standalone: false
})
export class DialogBillingNavigateComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogBillingNavigateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogDataComponent,
  ) {
    this.data = {
      name: '',
      isEnterprise: true
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onToggleEnterprise() {
    this.data.isEnterprise = !this.data.isEnterprise;
  }
}