import { Component, Input, OnInit } from '@angular/core';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-actions',
  templateUrl: './actions.component.html',
  styleUrl: './actions.component.scss'
})
export class ActionsUsageComponent implements OnInit {
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
