import { Component, Input, OnChanges } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
    selector: 'app-chart-pie-sku',
    templateUrl: './chart-pie-sku.component.html',
    styleUrl: './chart-pie-sku.component.scss',
    standalone: false
})
export class ChartPieSkuComponent implements OnChanges {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Usage by Runner Type'
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
    }],
  };
  updateFromInput: boolean = false;

  constructor(
    private usageReportService: UsageReportService,
    private themeService: ThemingService
  ) {
    this.options = {
      ...this.options,
      ...this.themeService.getHighchartsOptions(),
    }
  }

  ngOnChanges() {
    this.data = this.data.filter((line) => line.unitType === 'minutes');
    this.options.series = [{
      type: 'pie', // Add the type property
      name: 'Usage',
      data: this.data.reduce((acc, line) => {
        const formattedSku = this.usageReportService.formatSku(line.sku);
        const index = acc.findIndex((item) => item[0] === formattedSku);
        if (index === -1) {
          acc.push([formattedSku, line.value]);
        } else {
          acc[index][1] += line.value;
        }
        return acc;
      }, [] as [string, number][]).sort((a, b) => b[1] - a[1])
    }];
    this.options.title = {
      text: `${this.currency === 'minutes' ? 'Usage' : 'Cost'} by runner type`
    };
    this.options.tooltip = {
      ...this.options.tooltip,
      pointFormat: `{series.name}: <b>{point.percentage:.1f}%</b><br>${this.currency === 'cost' ? 'Cost: <b>${point.y:.2f}</b>' : 'Minutes: <b>{point.y}</b>'}</b>`
    };
    this.updateFromInput = true;
  }
}
