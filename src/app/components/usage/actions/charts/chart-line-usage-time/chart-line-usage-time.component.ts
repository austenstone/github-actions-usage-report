import { Component, Input, ViewChild } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-line-usage-time',
  templateUrl: './chart-line-usage-time.component.html',
  styleUrl: './chart-line-usage-time.component.scss'
})
export class ChartLineUsageTimeComponent {
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
      y: -80,
    },
    series: []
  };
  updateFromInput: boolean = false;
  chartType: 'perRepo' | 'total' = 'total';

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
    } else if (this.chartType === 'perRepo') {
      (this.options.series as any) = this.data.reduce((acc, line) => {
        minutes += line.quantity;
        if (acc.find(a => a.name === line.repositorySlug)) {
          const existing = acc.find(a => a.name === line.repositorySlug);
          existing?.data.push([new Date(line.date).getTime(), existing.data[existing.data.length - 1][1] + line.quantity]);
        } else {
          acc.push({
            name: line.repositorySlug,
            data: [
              [new Date(line.date).getTime(), line.quantity]
            ]
          });
        }
        return acc;
      }, [] as { name: string; data: [number, number][] }[]);
    }
    this.updateFromInput = true;
  }

  toggleChartType(value: string) {
    (this.chartType as string) = value;
    this.chartRef.ngOnDestroy();
    this.ngOnChanges();
  }

}