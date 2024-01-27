import { Component, Input, OnChanges } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrl: './actions.component.scss'
})
export class ActionsUsageComponent {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  totalMinutes: number = 0;
  totalCost: number = 0;

  constructor(
    public usageReportService: UsageReportService,
  ) { }
  
  ngOnInit() {
    this.usageReportService.getActionsTotalMinutes().subscribe((totalMinutes) => {
      this.totalMinutes = totalMinutes;
    });
    this.usageReportService.getActionsTotalCost().subscribe((totalCost) => {
      this.totalCost = totalCost;
    });
  }

}
