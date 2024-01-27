import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
  selector: 'app-line-usage-time',
  templateUrl: './line-usage-time.component.html',
  styleUrl: './line-usage-time.component.scss'
})
export class LineUsageTimeComponent implements OnChanges {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
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
    let gbs = 0;
    if (this.chartType === 'total') {
      this.options.series = [{
        type: 'spline',
        name: 'Usage',
        data: this.data.reduce((acc, line) => {
          gbs += line.value;
          acc.push([line.date.getTime(), gbs]);
          return acc;
        }, [] as [number, number][])
      }];
      if (this.options.legend) this.options.legend.enabled = false;
    } else if (this.chartType === 'perRepo') {
      (this.options.series as any) = this.data.reduce(
        (acc, line) => {
          gbs += line.value;
          if (acc.find(a => a.name === line.repositorySlug)) {
            const existing = acc.find(a => a.name === line.repositorySlug);
            existing?.data.push([line.date.getTime(), existing.data[existing.data.length - 1][1] + line.value]);
          } else {
            acc.push({
              name: line.repositorySlug,
              data: [
                [line.date.getTime(), line.value]
              ]
            });
          }
          return acc;
        }, 
        [] as { name: string; data: [number, number][] }[]
      ).sort((a: any, b: any) => {
        return b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1];
      }).slice(0, 50);
      if (this.options.legend) this.options.legend.enabled = true;
    }
    this.updateFromInput = true;
  }

  toggleChartType(value: string) {
    (this.chartType as string) = value;
    this.chartRef.ngOnDestroy();
    this.ngOnChanges();
  }
}
