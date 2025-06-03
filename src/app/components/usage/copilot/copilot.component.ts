import { Component, Input } from '@angular/core';
import { UsageReportItem } from 'src/app/usage-report.service';

@Component({
    selector: 'app-copilot',
    templateUrl: './copilot.component.html',
    styleUrl: './copilot.component.scss',
    standalone: false
})
export class CopilotComponent {
  @Input() data!: UsageReportItem[];
  @Input() currency!: string;
}
