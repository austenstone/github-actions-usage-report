import { Component, ComponentRef, Input, ViewChild } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-line-usage-time',
  templateUrl: './line-usage-time.component.html',
  styleUrl: './line-usage-time.component.scss'
})
export class LineUsageTimeComponent {
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
      text: 'Shared Storage Over Time'
    },
    subtitle: {
    },
    yAxis: {
      title: {
        text: 'Gigabits (Gb)'
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
    },
    series: []
  };
  updateFromInput: boolean = false;
  chartType: 'perRepo' | 'total' = 'total';

  ngOnChanges() {
    let gbs = 0;
    if (this.chartType === 'total') {
      let gbs = 0;
      this.options.series = [{
        type: 'spline',
        name: 'Usage',
        data: this.data.reduce((acc, line) => {
          gbs += line.quantity;
          acc.push([line.date.getTime(), gbs]);
          return acc;
        }, [] as [number, number][])
      }];
    } else if (this.chartType === 'perRepo') {
      (this.options.series as any) = this.data.reduce((acc, line) => {
        gbs += line.quantity;
        if (acc.find(a => a.name === line.repositorySlug)) {
          const existing = acc.find(a => a.name === line.repositorySlug);
          existing?.data.push([line.date.getTime(), existing.data[existing.data.length - 1][1] + line.quantity]);
        } else {
          acc.push({
            name: line.repositorySlug,
            data: [
              [line.date.getTime(), line.quantity]
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
