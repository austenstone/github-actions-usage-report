
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

interface DialogData {
  name: string;
  isEnterprise: boolean;
}

@Component({
  selector: 'app-dialog-billing-navigate',
  templateUrl: 'dialog-billing-navigate.html',
})
export class DialogOverviewExampleDialog {
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
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