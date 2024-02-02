import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Input() text: string = 'Choose File';
  @Output() fileText = new EventEmitter<string[]>();
  @ViewChild('fileUpload', { static: false }) fileUpload!: ElementRef; // Add this line

  constructor() {
    this.fileUpload = new ElementRef(null);
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const files: FileList | null = fileInput.files;
  
    if (files) {
      const fileTexts = [] as string[];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(file.name); // log the file name
  
        const reader = new FileReader();
        reader.onload = () => {
          const fileText = reader.result as string;
          fileTexts.push(fileText);
        };
        reader.readAsText(file);
      }
      this.fileText.emit(fileTexts); // emit the file text to the parent component
    }
  }
}
