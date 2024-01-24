import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrl: './actions.component.scss'
})
export class ActionsUsageComponent {
  @Input() data!: UsageReportLine[];
}
