import { Component, Input, OnChanges } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-chart-pie-user',
  templateUrl: './chart-pie-user.component.html',
  styleUrls: ['./chart-pie-user.component.scss']
})
export class ChartPieUserComponent implements OnChanges {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Usage by username'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br>Minutes: <b>{point.y}</b>'
    },
    series: [{
      type: 'pie',
      name: 'Usage',
      data: []
    }]
  };
  updateFromInput: boolean = false;

  constructor(
    private themeService: ThemingService,
    private usageReportService: UsageReportService
  ) {
    this.options = {
      ...this.options,
      ...this.themeService.getHighchartsOptions(),
    }
  }

  ngOnChanges() {
    this.data = this.data.filter((line) => line.unitType === 'minutes');
    this.options.series = [{
      type: 'pie',
      name: 'Usage',
      data: this.data.reduce((acc, line) => {
        const index = acc.findIndex((item) => item[0] === line.username);
        if (index === -1) {
          acc.push([line.username, line.value]);
        } else {
          acc[index][1] += line.value;
        }
        return acc;
      }, [] as [string, number][]).sort((a, b) => b[1] - a[1])
    }];
    this.options.title = {
      text: `${this.currency === 'minutes' ? 'Usage' : 'Cost'} by username`
    };
    this.options.tooltip = {
      ...this.options.tooltip,
      pointFormat: `{series.name}: <b>{point.percentage:.1f}%</b><br>${this.currency === 'cost' ? 'Cost: <b>${point.y:.2f}</b>' : 'Minutes: <b>{point.y}</b>'}</b>`
    };
    this.updateFromInput = true;
  }

}
