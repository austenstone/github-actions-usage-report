import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
  selector: 'app-copilot',
  templateUrl: './copilot.component.html',
  styleUrl: './copilot.component.scss'
})
export class CopilotComponent {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  
  ngOnChanges() {
    console.log('data', this.data);
  }
}
