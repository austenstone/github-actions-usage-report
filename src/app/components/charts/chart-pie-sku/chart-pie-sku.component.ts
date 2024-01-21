import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';
import { UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-chart-pie-sku',
  templateUrl: './chart-pie-sku.component.html',
  styleUrl: './chart-pie-sku.component.scss'
})
export class ChartPieSkuComponent {
  @Input() data!: UsageReportLine[];
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Usage by SKU'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br>Minutes: <b>{point.y}</b>'
    },
    series: [{
      type: 'pie', // Add the type property
      name: 'Usage',
      data: [
        ['SKU1', 1],
        ['SKU2', 2],
        ['SKU3', 3]
      ]
    }]
  };
  updateFromInput: boolean = false;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    this.data = this.data.filter((line) => line.unitType === 'minute');
    this.options.series = [{
      type: 'pie', // Add the type property
      name: 'Usage',
      data: this.data.reduce((acc, line) => {
        const formattedSku = this.usageReportService.formatSku(line.sku);
        const index = acc.findIndex((item) => item[0] === formattedSku);
        if (index === -1) {
          acc.push([formattedSku, line.quantity]);
        } else {
          acc[index][1] += line.quantity;
        }
        return acc;
      }, [] as [string, number][]).sort((a, b) => b[1] - a[1])
    }];
    this.updateFromInput = true;
  }
}
