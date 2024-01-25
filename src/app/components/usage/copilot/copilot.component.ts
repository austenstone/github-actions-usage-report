import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';

@Component({
  selector: 'app-copilot',
  templateUrl: './copilot.component.html',
  styleUrl: './copilot.component.scss'
})
export class CopilotComponent {
  @Input() data!: UsageReportLine[];
}
