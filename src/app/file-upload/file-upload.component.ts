import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Output() fileText = new EventEmitter<string>();
  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file: File | null = fileInput.files ? fileInput.files[0] : null;
  
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileText = reader.result as string;
        this.fileText.emit(fileText); // emit the file text to the parent component
      };
      reader.readAsText(file);
    }
  }
}
