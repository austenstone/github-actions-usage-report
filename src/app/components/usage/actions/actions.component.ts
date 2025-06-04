import { Component, Input, OnInit } from '@angular/core';
import { AggregationType, CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
    selector: 'app-actions',
    templateUrl: './actions.component.html',
    styleUrl: './actions.component.scss',
    standalone: false
})
export class ActionsComponent implements OnInit {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: 'cost' | 'minutes';
  @Input() grouping!: AggregationType;
  @Input() filter: string = '';
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
