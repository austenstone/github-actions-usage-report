import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss'],
    standalone: false
})
export class FileUploadComponent {
  @Input() text: string = 'Choose File';
  @Output() fileText = new EventEmitter<{
    type: 'metered' | 'copilot_premium_requests';
    fileText: string;
  }>();
  @ViewChild('fileUpload', { static: false }) fileUpload!: ElementRef; // Add this line
  type?: 'metered' | 'copilot_premium_requests';

  constructor() {
    this.fileUpload = new ElementRef(null);
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file: File | null = fileInput.files ? fileInput.files[0] : null;

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileText = reader.result as string;
        this.fileText.emit({
          type: this.type || 'metered',
          fileText
        }); // emit the file text to the parent component
      };
      reader.readAsText(file);
    }
  }
}
