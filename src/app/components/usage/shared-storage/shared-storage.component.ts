import { Component, Input } from '@angular/core';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
    selector: 'app-shared-storage',
    templateUrl: './shared-storage.component.html',
    styleUrl: './shared-storage.component.scss',
    standalone: false
})
export class SharedStorageComponent {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: 'cost' | 'minutes';
}
