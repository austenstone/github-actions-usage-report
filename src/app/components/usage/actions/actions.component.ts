import { Component, Input, OnChanges } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrl: './actions.component.scss'
})
export class ActionsUsageComponent implements OnChanges {
  @Input() usage!: UsageReport;
  @Input() data!: UsageReportLine[];
  totalMinutes: number = 0;
  totalCost: number = 0;
  workflows: string[] = [];

  ngOnChanges() {
    this.workflows = [];
    this.totalCost = 0;
    this.totalMinutes = 0;
    this.data.forEach((line) => {
      this.totalMinutes += line.quantity;
      this.totalCost += line.quantity * line.pricePerUnit;
      if (!this.workflows.includes(line.actionsWorkflow)) {
        this.workflows.push(line.actionsWorkflow);
      }
    });
    this.totalMinutes = Math.round(this.totalMinutes);
  }

}
