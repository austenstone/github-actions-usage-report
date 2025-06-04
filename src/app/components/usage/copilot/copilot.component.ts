import { Component, Input } from '@angular/core';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
    selector: 'app-copilot',
    templateUrl: './copilot.component.html',
    styleUrl: './copilot.component.scss',
    standalone: false
})
export class CopilotComponent {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: 'minutes' | 'cost';
  @Input() grouping!: 'workflow' | 'repo' | 'sku' | 'user';
}
