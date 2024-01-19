import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-pie-owner',
  templateUrl: './chart-pie-owner.component.html',
  styleUrls: ['./chart-pie-owner.component.scss']
})
export class ChartPieOwnerComponent {
  @Input() data!: UsageReportLine[];
  Highcharts: typeof Highcharts = Highcharts;
}
