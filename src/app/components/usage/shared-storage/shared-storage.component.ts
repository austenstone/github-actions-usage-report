import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
  selector: 'app-shared-storage',
  templateUrl: './shared-storage.component.html',
  styleUrl: './shared-storage.component.scss'
})
export class SharedStorageComponent {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
}
