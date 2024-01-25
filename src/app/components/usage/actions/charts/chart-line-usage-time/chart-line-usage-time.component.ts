import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';

@Component({
  selector: 'app-chart-line-usage-time',
  templateUrl: './chart-line-usage-time.component.html',
  styleUrl: './chart-line-usage-time.component.scss'
})
export class ChartLineUsageTimeComponent implements OnChanges {
  @Input() data!: UsageReportLine[];
  Highcharts: typeof Highcharts = Highcharts;
  @ViewChild('chart') chartRef!: any;
  options: Highcharts.Options = {
    chart: {
      type: 'spline',
      zooming: {
        type: 'x'
      }
    },
    title: {
      text: 'Actions Usage Over Time'
    },
    subtitle: {
    },
    yAxis: {
      title: {
        text: 'Minutes (min)'
      },
      min: 0
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        // don't display the year
        month: '%e. %b',
        year: '%b'
      },
      title: {
        text: 'Date'
      }
    },
    legend: {
      align: 'right',
      verticalAlign: 'top',
      layout: 'vertical',
      y: 0,
    },
    series: []
  };
  updateFromInput: boolean = false;
  chartType: 'perRepo' | 'total' = 'total';

  constructor(
    private themeService: ThemingService
  ) {
    this.options = {
      ...this.options,
      ...this.themeService.getHighchartsOptions(),
    }
  }

  ngOnChanges() {
    let minutes = 0;
    this.data = this.data.filter((line) => line.unitType === 'minute');
    if (this.chartType === 'total') {
      this.options.series = [{
        type: 'spline',
        name: 'Usage',
        data: this.data.reduce((acc, line) => {
          minutes += line.quantity;
          acc.push([line.date.getTime(), minutes]);
          return acc;
        }, [] as [number, number][])
      }];
      if (this.options.legend) this.options.legend.enabled = false;
    } else if (this.chartType === 'perRepo') {
      (this.options.series as any) = this.data.reduce(
        (acc, line) => {
          minutes += line.quantity;
          if (acc.find(a => a.name === line.repositorySlug)) {
            const existing = acc.find(a => a.name === line.repositorySlug);
            if (existing) {
              existing?.data2.push([new Date(line.date).getTime(), existing.data[existing.data.length - 1][1] + line.quantity]);
              const rollingAverage = this.calculateRollingAverage(existing.data2.map(d => d[1]), 28);
              existing?.data.push([new Date(line.date).getTime(), rollingAverage]);
            }
          } else {
            acc.push({
              name: line.repositorySlug,
              data: [
                [new Date(line.date).getTime(), line.quantity]
              ],
              data2: [
                [new Date(line.date).getTime(), line.quantity]
              ]
            });
          }
          return acc;
        },
        [] as { name: string; data: [number, number][], data2: [number, number][] }[]
      ).sort((a: any, b: any) => {
        return b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1];
      }).slice(0, 50);
      if (this.options.legend) this.options.legend.enabled = true;
    }
    this.updateFromInput = true;
  }

  calculateRollingAverage(data: number[], windowSize: number): number {
    const rollingAverageData: number[] = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += data[j];
        count++;
      }
      const average = sum / count;
      rollingAverageData.push(average);
    }
    return rollingAverageData[rollingAverageData.length - 1];
  }

  toggleChartType(value: string) {
    (this.chartType as string) = value;
    this.chartRef.ngOnDestroy();
    this.ngOnChanges();
  }

}
